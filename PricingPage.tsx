import React, { useState } from 'react';
import { MarketingHeader, MarketingFooter } from './components/MarketingChrome';
import { HARD_CAP_STAGES, PLAN_LIST, TRIAL_STAGES, type Plan, type PlanId } from './config/plans';
import { SITE } from './config/site';
import { openBillingPortal, startCheckout, type BillingStatus } from './services/billingService';

interface PricingPageProps {
  onStart: () => void;
  onHome: () => void;
  status: BillingStatus | null;
}

const PRICING_FAQS = [
  {
    q: 'What exactly counts as a stage?',
    a: 'One stage is one successful paint render. If a render fails you are not charged for it. Refining a photo you already staged — repainting the trim, changing the door colour, asking for a lighter shade — does not spend another stage.',
  },
  {
    q: 'What happens when I run out?',
    a: `Crew stops at 50 stages in a billing period and offers you Studio. Studio stops at ${HARD_CAP_STAGES}. ${HARD_CAP_STAGES} is a hard cap on every plan — get in touch and we will sort out a volume arrangement rather than silently billing you for overages.`,
  },
  {
    q: 'Do unused stages roll over?',
    a: 'No. Your allowance resets at the start of each billing period so the price stays predictable.',
  },
  {
    q: 'Can I cancel or switch plans?',
    a: 'Any time, from the billing portal. Switching between Crew and Studio is prorated by Stripe, and cancelling leaves you access until the end of the period you have already paid for.',
  },
  {
    q: 'Can I put my own logo on what I send clients?',
    a: 'Every download carries the before/after comparison and the accuracy disclaimer. You send it from your own inbox alongside your estimate, so the conversation stays yours.',
  },
];

const PlanCard: React.FC<{
  plan: Plan;
  featured: boolean;
  current: boolean;
  busy: boolean;
  onChoose: (plan: PlanId) => void;
}> = ({ plan, featured, current, busy, onChoose }) => (
  <div
    className={`relative flex flex-col rounded-3xl border p-8 transition-shadow ${
      featured
        ? 'border-brand-accent bg-white shadow-xl ring-1 ring-brand-accent/20'
        : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
    }`}
  >
    {featured && (
      <span className="absolute -top-3 left-8 rounded-full bg-brand-accent px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
        Most popular
      </span>
    )}
    {current && (
      <span className="absolute -top-3 right-8 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
        Your plan
      </span>
    )}

    <h3 className="text-xl font-black text-brand-dark">{plan.name}</h3>
    <p className="mt-1 text-sm font-semibold text-brand-accent">{plan.tagline}</p>

    <div className="mt-6 flex items-baseline gap-1">
      <span className="text-5xl font-black tracking-tight text-brand-dark">${plan.priceMonthly}</span>
      <span className="text-base font-semibold text-slate-400">/month</span>
    </div>
    <p className="mt-3 text-sm leading-relaxed text-slate-500">{plan.bestFor}</p>

    <button
      onClick={() => onChoose(plan.id)}
      disabled={busy || current}
      className={`mt-7 w-full rounded-2xl px-6 py-4 text-base font-black shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        featured
          ? 'bg-brand-accent text-white hover:bg-brand-accenthover'
          : 'bg-brand-dark text-white hover:bg-black'
      }`}
    >
      {current ? 'Current plan' : busy ? 'Opening Stripe…' : `Choose ${plan.name}`}
    </button>

    <ul className="mt-7 space-y-3 border-t border-slate-100 pt-7">
      {plan.features.map(feature => (
        <li key={feature} className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-slate-600">{feature}</span>
        </li>
      ))}
    </ul>
  </div>
);

const PricingPage: React.FC<PricingPageProps> = ({ onStart, onHome, status }) => {
  const [busyPlan, setBusyPlan] = useState<PlanId | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const metered = Boolean(status?.configured);
  const hasSubscription = Boolean(status?.planId);

  const handleChoose = async (planId: PlanId) => {
    setBusyPlan(planId);
    setError(null);
    try {
      await startCheckout(planId);
    } catch (err: any) {
      setError(err?.message ?? 'We could not open Stripe Checkout. Please try again.');
      setBusyPlan(null);
    }
  };

  const handlePortal = async () => {
    setBusyPlan('portal');
    setError(null);
    try {
      await openBillingPortal();
    } catch (err: any) {
      setError(err?.message ?? 'We could not open the billing portal. Please try again.');
      setBusyPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg font-sans text-brand-dark">
      <MarketingHeader variant="solid" onStart={onStart} onHome={onHome} onPricing={() => window.scrollTo(0, 0)} />

      <main className="pt-20">
        {/* ── Heading ─────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-4 pb-4 pt-16 text-center sm:px-6 sm:pt-20">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-accent">Pricing</p>
          <h1 className="text-4xl font-black leading-tight text-brand-dark sm:text-5xl">
            Priced per month, not per argument about paint colours
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
            One stage is one successful paint render. Pick the band that matches how many estimates you
            put out, and change it whenever the season does.
          </p>
        </section>

        {/* ── Usage strip ─────────────────────────────────── */}
        {metered && status && (
          <section className="mx-auto mt-8 max-w-2xl px-4 sm:px-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-brand-dark">
                    {status.stagesUsed} of {status.stagesIncluded} stages used
                    {!status.planId && ' on your trial'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {status.periodEnd
                      ? `Resets ${new Date(status.periodEnd).toLocaleDateString(undefined, {
                          month: 'long',
                          day: 'numeric',
                        })}`
                      : 'Resets at the start of each billing period'}
                  </p>
                </div>
                {hasSubscription && (
                  <button
                    onClick={handlePortal}
                    disabled={busyPlan === 'portal'}
                    className="flex-shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:border-slate-400 hover:text-brand-dark disabled:opacity-50"
                  >
                    {busyPlan === 'portal' ? 'Opening…' : 'Manage billing'}
                  </button>
                )}
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    status.blocked ? 'bg-red-500' : 'bg-brand-accent'
                  }`}
                  style={{
                    width: `${Math.min(100, (status.stagesUsed / Math.max(1, status.stagesIncluded)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── Plans ───────────────────────────────────────── */}
        <section className="mx-auto mt-12 max-w-4xl px-4 sm:px-6">
          {error && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PLAN_LIST.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                featured={plan.id === 'studio'}
                current={status?.planId === plan.id}
                busy={busyPlan === plan.id}
                onChoose={handleChoose}
              />
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Every new workspace gets {TRIAL_STAGES} free stages so you can run a real estimate through it
            before you pay. No card needed for those.
          </p>
        </section>

        {/* ── What a stage is ─────────────────────────────── */}
        <section className="mx-auto mt-20 max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-black text-brand-dark">What counts as a stage</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-emerald-600">Uses a stage</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>Painting the walls in a photo you uploaded</li>
                  <li>Staging the same room again in a different colour</li>
                  <li>Staging a second photo of the same job</li>
                </ul>
              </div>
              <div>
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Free</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>Trim and door passes on an already-staged photo</li>
                  <li>Lighter / darker refinements</li>
                  <li>Failed renders — you are never billed for those</li>
                  <li>Downloads, comparisons and sending to a client</li>
                </ul>
              </div>
            </div>
            <p className="mt-8 rounded-2xl bg-page-bg p-4 text-sm leading-relaxed text-slate-600">
              <span className="font-bold text-brand-dark">Hard cap at {HARD_CAP_STAGES} stages.</span>{' '}
              We stop rather than run up a surprise bill. If your shop needs more than that in a month,{' '}
              <a
                href={`mailto:${SITE.contactEmail}?subject=PaintStage%20Pro%20volume%20plan`}
                className="font-bold text-brand-accent underline underline-offset-2"
              >
                email us
              </a>{' '}
              and we will work something out.
            </p>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────── */}
        <section id="faq" className="mx-auto mt-20 max-w-3xl px-4 pb-24 sm:px-6">
          <h2 className="mb-8 text-center text-3xl font-black text-brand-dark">Billing questions</h2>
          <div className="space-y-3">
            {PRICING_FAQS.map((faq, i) => (
              <div key={faq.q} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="text-sm font-bold text-brand-dark sm:text-base">{faq.q}</span>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? '260px' : '0px' }}
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-500">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <MarketingFooter onStart={onStart} onHome={onHome} onPricing={() => window.scrollTo(0, 0)} />
    </div>
  );
};

export default PricingPage;
