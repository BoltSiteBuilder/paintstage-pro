# Billing, stage metering and Stripe

PaintStage Pro sells two subscription plans. Everything below is additive — if
none of it is configured the studio runs exactly as it did before, unmetered.

| Plan   | Price   | Stages / month |
| ------ | ------- | -------------- |
| Crew   | $29/mo  | 0–50           |
| Studio | $49/mo  | 51–100         |

**One stage = one successful paint render.** Trim passes, door passes and
lighter/darker refinements on an already-staged photo are free, and a failed
render is never counted. 100 stages is a hard cap on every plan: past it the
studio stops and shows a volume CTA rather than billing an overage.

Plan definitions live in `config/plans.ts` and the matching allowances live in
`paintstage_included_stages()` in the migration. **Change both together.**

---

## 1. Apply the migration

```bash
supabase db push
```

`supabase/migrations/20260903120000_billing_stage_metering.sql` creates:

- `public.billing_workspaces` — one row per workspace, mirroring Stripe
- `public.stage_renders` — one row per successful render
- `paintstage_billing_status(uuid)` / `paintstage_record_stage(uuid)` — the two
  RPCs the client calls

Both tables have RLS enabled with **no policies**. They are reachable only
through the `SECURITY DEFINER` RPCs (granted to `anon` and `authenticated`) and
through the service role used by the webhook. `paintstage_record_stage` refuses
to record past the allowance, so the cap cannot be bypassed from the browser.

### What a "workspace" is

There are no user accounts in the app yet, so the metering subject is a uuid
held in the browser's `localStorage` under `paintstage.workspace_id`
(`services/billingService.ts`). When accounts land, replace that value with
`auth.uid()` and drop the `p_workspace` argument from the RPCs — nothing else
has to change.

Because of that, this is a deliberate soft boundary: clearing site data starts a
new trial. That is acceptable for a $29 self-serve plan and should be closed by
adding auth, not by hardening the uuid.

## 2. Create the Stripe prices

In the Stripe dashboard create one product with two recurring monthly prices:

- $29.00 USD / month → note the `price_…` id for `STRIPE_PRICE_CREW`
- $49.00 USD / month → note the `price_…` id for `STRIPE_PRICE_STUDIO`

## 3. Set the function secrets

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_xxx \
  STRIPE_PRICE_CREW=price_xxx \
  STRIPE_PRICE_STUDIO=price_xxx \
  SITE_URL=https://paintstagepro.com
```

| Variable                    | Used by                          | Purpose                                                        |
| --------------------------- | -------------------------------- | -------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`         | `stripe-checkout`, `stripe-webhook` | Stripe API calls                                            |
| `STRIPE_WEBHOOK_SECRET`     | `stripe-webhook`                 | Signature verification (from the endpoint, added in step 5)     |
| `STRIPE_PRICE_CREW`         | both                             | $29 price id, and price → plan mapping in the webhook           |
| `STRIPE_PRICE_STUDIO`       | both                             | $49 price id, and price → plan mapping in the webhook           |
| `SITE_URL`                  | `stripe-checkout`                | Checkout success/cancel origin. Without it the function refuses the request rather than trusting a client-supplied URL. |
| `SUPABASE_URL`              | both                             | Injected by the platform                                        |
| `SUPABASE_SERVICE_ROLE_KEY` | both                             | Injected by the platform                                        |

If `STRIPE_SECRET_KEY` or `SITE_URL` is missing, `stripe-checkout` returns 503
and the pricing page shows an inline "checkout is not available yet" message.
The rest of the site keeps working.

## 4. Deploy the functions

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

`--no-verify-jwt` matters: Stripe calls the webhook with its own signature, not
a Supabase JWT. The function verifies `stripe-signature` itself and rejects
anything unsigned.

## 5. Register the webhook

Add an endpoint in the Stripe dashboard pointing at:

```
https://<project-ref>.functions.supabase.co/stripe-webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy the webhook.

## 6. Test

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

Then confirm `billing_workspaces` has a row with `status = 'active'` and the
expected `plan_id`, and that the stage counter in the studio header reflects the
new allowance.

---

## How the client uses it

- `services/billingService.ts` — workspace id, the two RPC calls, and the two
  edge-function calls. Every path fails open: a missing table, a missing
  function or a network error logs a warning and reports `configured: false`,
  which disables metering rather than blocking renders.
- `hooks/useStageMeter.ts` — the React wrapper. `blocked` is only ever true when
  metering is live *and* the allowance is spent.
- `App.tsx` — refuses to start a render when `blocked`, calls `countStage()`
  after a successful one, and shows the upgrade banner. Nothing else in the
  render pipeline is touched.

## Why `stripe` is in package.json

The edge functions import `npm:stripe@^18.5.0`, which Deno resolves at deploy
time rather than from `node_modules`. The dependency is listed so the pinned
major stays visible in one place and so editors can type-check the function
source. Nothing in the Vite bundle imports it.
