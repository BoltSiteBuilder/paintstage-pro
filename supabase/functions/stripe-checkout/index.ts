import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^18.5.0";
import { createClient } from "npm:@supabase/supabase-js@^2.110.0";

// ============================================================
// Creates Stripe Checkout sessions and customer-portal sessions.
//
// Required secrets (supabase secrets set …):
//   STRIPE_SECRET_KEY     sk_live_… / sk_test_…
//   STRIPE_PRICE_CREW     price_… for the $29/mo plan
//   STRIPE_PRICE_STUDIO   price_… for the $49/mo plan
//   SITE_URL              https://your-site — success/cancel redirects
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SITE_URL = Deno.env.get("SITE_URL");

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  crew: Deno.env.get("STRIPE_PRICE_CREW"),
  studio: Deno.env.get("STRIPE_PRICE_STUDIO"),
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Only ever redirect back to a host we configured. */
function resolveReturnUrl(requested: unknown): string {
  if (SITE_URL) return SITE_URL.replace(/\/$/, "");
  if (typeof requested === "string") {
    try {
      const url = new URL(requested);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // fall through
    }
  }
  return "";
}

/** Reuses the workspace's Stripe customer, creating one on first checkout. */
async function customerForWorkspace(
  stripe: Stripe,
  workspaceId: string,
): Promise<string> {
  const db = admin();

  const { data: existing } = await db
    .from("billing_workspaces")
    .select("stripe_customer_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({
    metadata: { workspace_id: workspaceId },
  });

  await db.from("billing_workspaces").upsert(
    {
      workspace_id: workspaceId,
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" },
  );

  return customer.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!STRIPE_SECRET_KEY) {
    console.error("[stripe-checkout] STRIPE_SECRET_KEY is not set");
    return json({ error: "Billing is not configured." }, 503);
  }

  let body: { action?: string; planId?: string; workspaceId?: string; returnUrl?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const workspaceId = body.workspaceId ?? "";
  if (!UUID_RE.test(workspaceId)) {
    return json({ error: "A valid workspaceId is required." }, 400);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });
  const returnUrl = resolveReturnUrl(body.returnUrl);
  if (!returnUrl) {
    console.error("[stripe-checkout] SITE_URL is not set and no usable returnUrl was supplied");
    return json({ error: "Billing is not configured." }, 503);
  }

  try {
    const customerId = await customerForWorkspace(stripe, workspaceId);

    if (body.action === "portal") {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${returnUrl}/?billing=updated`,
      });
      return json({ url: portal.url });
    }

    const planId = body.planId ?? "";
    const price = PRICE_BY_PLAN[planId];
    if (!price) {
      console.error(`[stripe-checkout] No price configured for plan "${planId}"`);
      return json({ error: "That plan is not available right now." }, 400);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: workspaceId,
      customer: customerId,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { workspace_id: workspaceId, plan_id: planId },
      subscription_data: {
        metadata: { workspace_id: workspaceId, plan_id: planId },
      },
      success_url: `${returnUrl}/?checkout=success&plan=${planId}`,
      cancel_url: `${returnUrl}/?checkout=cancelled`,
    });

    if (!session.url) throw new Error("Stripe returned a session without a URL");
    return json({ url: session.url });
  } catch (err) {
    console.error("[stripe-checkout] failed:", err);
    return json({ error: "We could not start checkout. Please try again." }, 500);
  }
});
