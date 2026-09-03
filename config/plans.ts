// ============================================================
// Billing plans
// ------------------------------------------------------------
// One "stage" = one successful paint render. Trim and door passes
// on an already-staged photo are refinements, not new stages.
//
// Two plans only. Usage above HARD_CAP_STAGES is blocked and the
// customer is pointed at the volume CTA.
// ============================================================

export type PlanId = 'crew' | 'studio';

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  /** Inclusive lower bound of the monthly stage band this plan is priced for. */
  bandFrom: number;
  /** Inclusive upper bound — the plan's hard stop. */
  bandTo: number;
  tagline: string;
  bestFor: string;
  features: string[];
  /** Name of the Stripe price env var read by the stripe-checkout edge function. */
  priceEnvVar: string;
}

export const PLANS: Record<PlanId, Plan> = {
  crew: {
    id: 'crew',
    name: 'Crew',
    priceMonthly: 29,
    bandFrom: 0,
    bandTo: 50,
    tagline: 'Up to 50 stages a month',
    bestFor: 'Owner-operators and small crews running a handful of estimates a week.',
    features: [
      '50 client-ready stages every month',
      'Interior and exterior photos',
      '1,700+ real Sherwin-Williams, Benjamin Moore and Behr colors',
      'Separate wall, trim and door passes',
      'Before / after slider to send with every quote',
      'Download with the accuracy disclaimer baked in',
    ],
  priceEnvVar: 'STRIPE_PRICE_CREW',
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    priceMonthly: 49,
    bandFrom: 51,
    bandTo: 100,
    tagline: '51 to 100 stages a month',
    bestFor: 'Multi-crew shops and companies with a dedicated estimator.',
    features: [
      'Everything in Crew',
      '100 client-ready stages every month',
      'Room for a full estimating pipeline',
      'Unlimited trim and door refinements on staged photos',
      'Priority render queue',
      'Email support',
    ],
    priceEnvVar: 'STRIPE_PRICE_STUDIO',
  },
};

export const PLAN_LIST: Plan[] = [PLANS.crew, PLANS.studio];

/** Nobody renders past this in a month, on any plan. */
export const HARD_CAP_STAGES = 100;

/** Stages a workspace can run before it has to pick a plan. */
export const TRIAL_STAGES = 3;

export function planForId(id: string | null | undefined): Plan | null {
  if (id === 'crew' || id === 'studio') return PLANS[id];
  return null;
}

/** Stages included in a billing period for a given plan (null = no plan yet). */
export function includedStages(id: string | null | undefined): number {
  const plan = planForId(id);
  return plan ? plan.bandTo : TRIAL_STAGES;
}

/** The plan a workspace should move to when it runs out, or null at the hard cap. */
export function nextPlanUp(id: string | null | undefined): Plan | null {
  if (!id) return PLANS.crew;
  if (id === 'crew') return PLANS.studio;
  return null;
}
