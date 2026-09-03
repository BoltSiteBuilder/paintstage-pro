import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^18.5.0";
import { createClient } from "npm:@supabase/supabase-js@^2.110.0";

// ============================================================
// Keeps billing_workspaces in sync with Stripe.
//
// Deploy WITHOUT JWT verification — Stripe signs the request itself:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Required secrets:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   whsec_… from the endpoint in the Stripe dashboard
//   STRIPE_PRICE_CREW / STRIPE_PRICE_STUDIO   to map a price back to a plan
//
// Events to subscribe to:
//   checkout.session.completed
//   customer.subscription.created
//   customer.subscription.updated
//   customer.subscription.deleted
//   invoice.payment_failed
// ============================================================

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const PLAN_BY_PRICE: Record<string, "crew" | "studio"> = {};
const crewPrice = Deno.env.get("STRIPE_PRICE_CREW");
const studioPrice = Deno.env.get("STRIPE_PRICE_STUDIO");
if (crewPrice) PLAN_BY_PRICE[crewPrice] = "crew";
if (studioPrice) PLAN_BY_PRICE[studioPrice] = "studio";

const db = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

/** Stripe statuses collapsed onto the four the app cares about. */
function mapStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      return "canceled";
  }
}

const toIso = (seconds: number | null | undefined): string | null =>
  typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;

async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const item = sub.items?.data?.[0];
  const workspaceId =
    sub.metadata?.workspace_id ??
    (typeof sub.customer === "object" ? sub.customer.metadata?.workspace_id : undefined);

  if (!workspaceId) {
    console.error(`[stripe-webhook] subscription ${sub.id} has no workspace_id metadata`);
    return;
  }

  const priceId = item?.price?.id ?? "";
  const planId = PLAN_BY_PRICE[priceId] ?? (sub.metadata?.plan_id as "crew" | "studio" | undefined) ?? null;

  // Stripe moved the period fields onto subscription items in recent API
  // versions; read the item first and fall back for older payloads.
  const legacy = sub as unknown as { current_period_start?: number; current_period_end?: number };
  const periodStart = toIso(item?.current_period_start ?? legacy.current_period_start);
  const periodEnd = toIso(item?.current_period_end ?? legacy.current_period_end);

  const { error } = await db()
    .from("billing_workspaces")
    .upsert(
      {
        workspace_id: workspaceId,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        stripe_subscription_id: sub.id,
        plan_id: planId,
        status: mapStatus(sub.status),
        period_start: periodStart,
        period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" },
    );

  if (error) {
    console.error("[stripe-webhook] upsert failed:", error);
    throw new Error(error.message);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe-webhook] Stripe secrets are not set");
    return new Response("Billing is not configured", { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature", { status: 400 });

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.subscription) break;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        // Checkout metadata is the most reliable source of the workspace id.
        sub.metadata = {
          ...sub.metadata,
          workspace_id:
            sub.metadata?.workspace_id ??
            session.metadata?.workspace_id ??
            session.client_reference_id ??
            "",
        };
        await syncSubscription(sub);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (!invoice.subscription) break;
        const subscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription;
        await syncSubscription(await stripe.subscriptions.retrieve(subscriptionId));
        break;
      }

      default:
        // Unhandled events are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] handler for ${event.type} failed:`, err);
    return new Response("Handler failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
