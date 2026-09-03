import { supabase } from './supabaseClient';
import { HARD_CAP_STAGES, TRIAL_STAGES, type PlanId } from '../config/plans';

// ============================================================
// Stage metering + Stripe Checkout
// ------------------------------------------------------------
// A "stage" is one successful paint render. The database is the
// source of truth; the client only mirrors it for the UI.
//
// Everything here FAILS OPEN. If the billing schema or the
// Stripe edge functions are not deployed yet, `configured` comes
// back false and the studio behaves exactly as it did before.
// ============================================================

const WORKSPACE_KEY = 'paintstage.workspace_id';

export type SubscriptionStatus =
  | 'inactive'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled';

export interface BillingStatus {
  /** False when the billing schema is unreachable — metering is then disabled. */
  configured: boolean;
  workspaceId: string;
  planId: PlanId | null;
  status: SubscriptionStatus;
  stagesUsed: number;
  stagesIncluded: number;
  stagesRemaining: number;
  /** True at 100 stages, where no upgrade is available. */
  atHardCap: boolean;
  /** True when the next render must be refused. */
  blocked: boolean;
  periodEnd: string | null;
}

const randomId = (): string => {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && 'randomUUID' in cryptoObj) return cryptoObj.randomUUID();
  // Non-secure fallback for older browsers; only used as an opaque key.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
};

/**
 * Stable per-browser workspace key. This is the metering subject until
 * accounts land, at which point it becomes the authenticated user id.
 */
export function getWorkspaceId(): string {
  try {
    const existing = window.localStorage.getItem(WORKSPACE_KEY);
    if (existing) return existing;
    const created = randomId();
    window.localStorage.setItem(WORKSPACE_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}

function unmeteredStatus(workspaceId: string): BillingStatus {
  return {
    configured: false,
    workspaceId,
    planId: null,
    status: 'inactive',
    stagesUsed: 0,
    stagesIncluded: HARD_CAP_STAGES,
    stagesRemaining: HARD_CAP_STAGES,
    atHardCap: false,
    blocked: false,
    periodEnd: null,
  };
}

function parseStatus(workspaceId: string, row: Record<string, unknown> | null): BillingStatus {
  if (!row) return unmeteredStatus(workspaceId);

  const planId = (row.plan_id === 'crew' || row.plan_id === 'studio') ? row.plan_id : null;
  const stagesUsed = Number(row.stages_used ?? 0);
  const stagesIncluded = Number(row.stages_included ?? (planId ? HARD_CAP_STAGES : TRIAL_STAGES));
  const remaining = Math.max(0, stagesIncluded - stagesUsed);

  return {
    configured: true,
    workspaceId,
    planId,
    status: (row.status as SubscriptionStatus) ?? 'inactive',
    stagesUsed,
    stagesIncluded,
    stagesRemaining: remaining,
    atHardCap: stagesUsed >= HARD_CAP_STAGES,
    blocked: remaining <= 0,
    periodEnd: (row.period_end as string) ?? null,
  };
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  const workspaceId = getWorkspaceId();
  try {
    const { data, error } = await supabase.rpc('paintstage_billing_status', {
      p_workspace: workspaceId,
    });
    if (error) throw error;
    return parseStatus(workspaceId, data as Record<string, unknown> | null);
  } catch (err) {
    console.warn('[PaintStage] Stage metering unavailable, running unmetered.', err);
    return unmeteredStatus(workspaceId);
  }
}

/**
 * Records one successful render. Returns the refreshed status, or null when
 * metering is unavailable (in which case the render is simply not counted).
 */
export async function recordStageRender(): Promise<BillingStatus | null> {
  const workspaceId = getWorkspaceId();
  try {
    const { data, error } = await supabase.rpc('paintstage_record_stage', {
      p_workspace: workspaceId,
    });
    if (error) throw error;
    return parseStatus(workspaceId, data as Record<string, unknown> | null);
  } catch (err) {
    console.warn('[PaintStage] Could not record stage usage.', err);
    return null;
  }
}

export class BillingNotConfiguredError extends Error {}

async function invokeBilling(body: Record<string, unknown>): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke('stripe-checkout', { body });

  if (error) {
    throw new BillingNotConfiguredError(
      'Checkout is not available yet. Add the Stripe keys to the stripe-checkout function and try again.',
    );
  }
  const url = (data as { url?: string } | null)?.url;
  if (!url) {
    throw new BillingNotConfiguredError('Stripe did not return a checkout URL.');
  }
  return { url };
}

/** Sends the browser to Stripe Checkout for the given plan. */
export async function startCheckout(planId: PlanId): Promise<void> {
  const { url } = await invokeBilling({
    action: 'checkout',
    planId,
    workspaceId: getWorkspaceId(),
    returnUrl: window.location.origin,
  });
  window.location.href = url;
}

/** Sends the browser to the Stripe customer portal to change or cancel a plan. */
export async function openBillingPortal(): Promise<void> {
  const { url } = await invokeBilling({
    action: 'portal',
    workspaceId: getWorkspaceId(),
    returnUrl: window.location.origin,
  });
  window.location.href = url;
}
