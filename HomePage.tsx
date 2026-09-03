import React, { useState } from 'react';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import { MarketingHeader, MarketingFooter } from './components/MarketingChrome';
import { HARD_CAP_STAGES, PLAN_LIST, TRIAL_STAGES } from './config/plans';

const HERO_BEFORE = '/hero-before-white-walls.jpg';
const HERO_AFTER = '/hero-after-slate-blue.jpg';

// No in-house exterior shot yet — swap this for real job photography when there is one.
const EXTERIOR_IMG =
  'https://images.pexels.com/photos/6422929/pexels-photo-6422929.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const VALUE_PROPS = [
  {
    title: 'Answer "what would it look like?" on the spot',
    body: 'Stage two or three options while you are still in the room instead of promising a mock-up you have to build back at the office — and then chasing a reply for a week.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    ),
  },
  {
    title: 'Sell the trim and the doors too',
    body: 'Walls, trim and doors are separate passes. Show the full package next to the walls-only version and let the client talk themselves into the bigger scope.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 10h16M10 20V10" />
    ),
  },
  {
    title: 'Cut the callback repaints',
    body: 'A colour signed off from a photo of their own room, in their own light, is a colour they stop second-guessing once two coats are on the wall.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    ),
  },
  {
    title: 'Nothing to roll out to the crew',
    body: 'It runs in the browser on whatever phone your estimator already carries. No app store, no licences per seat, no IT project.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
  },
];

const STEPS = [
  {
    title: 'Photograph the room',
    body: 'On site, on the estimator\'s phone. Interior or exterior, one photo or a dozen — no lighting kit, no measuring.',
  },
  {
    title: 'Pick the real colour',
    body: 'Search 1,700+ Sherwin-Williams, Benjamin Moore and Behr colours by name or code, or drop in any hex the client hands you.',
  },
  {
    title: 'Stage it',
    body: 'The walls repaint in about a minute. Add trim and door passes, or nudge the shade lighter or darker until the client nods.',
  },
  {
    title: 'Send it with the quote',
    body: 'Download the before/after with the accuracy disclaimer already on it and attach it to the estimate from your own inbox.',
  },
];

const FAQS = [
  {
    q: 'Who is this built for?',
    a: 'Painting contractors and painting companies — the people writing the estimate. It is a sales tool for your business, not a consumer toy. Your client never needs an account.',
  },
  {
    q: 'What counts as a stage?',
    a: 'One stage is one successful paint render. Trim passes, door passes and lighter/darker refinements on a photo you already staged are free, and a failed render never counts against you.',
  },
  {
    q: 'How accurate are the colours?',
    a: 'They are photo-real previews, not colour-matched proofs. Screens, lighting, sheen and substrate all shift the result, so every download carries a disclaimer saying so. Keep bringing physical samples to the sign-off — this gets you to the shortlist far faster.',
  },
  {
    q: 'Does it work on exteriors?',
    a: 'Yes. Siding, stucco and brick all work, and the roof, trim and landscaping stay put. Exterior repaints are where a preview usually earns its keep.',
  },
  {
    q: 'Is there a contract?',
    a: `No. It is month to month through Stripe, and you can switch between the $29 and $49 bands or cancel from the billing portal whenever your season changes. We stop at ${HARD_CAP_STAGES} stages a month rather than send you an overage bill.`,
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. It runs in the browser on a phone, tablet or laptop. Nothing for your crew to download and nothing to keep updated.',
  },
];

const STATS = [
  { value: '1,700+', label: 'Real fan-deck colours' },
  { value: '~1 min', label: 'From photo to staged room' },
  { value: '$29/mo', label: 'To get started' },
  { value: 'No', label: 'Overage bills, ever' },
];

interface HomePageProps {
  onStart: () => void;
  onPricing: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStart, onPricing }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const goHome = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-page-bg font-sans text-brand-dark">
      <MarketingHeader onStart={onStart} onPricing={onPricing} onHome={goHome} />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-dark pb-20 pt-32 sm:pb-24 sm:pt-36">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(1000px 500px at 15% -10%, rgba(37,99,235,0.35), transparent 60%), radial-gradient(700px 500px at 95% 20%, rgba(71,85,105,0.45), transparent 65%)',
          }}
        />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Built for painting contractors
            </div>

            <h1 className="mb-6 text-4xl font-black leading-[1.08] text-white sm:text-5xl md:text-6xl">
              Close the colour conversation
              <br />
              <span className="text-brand-accent">on the first visit</span>
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              PaintStage Pro turns a phone photo of your client's room into a photo-real repaint in real
              fan-deck colours — while you are still standing in it. Send it with the estimate instead of
              hoping they can picture it.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={onStart}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-brand-accent px-8 py-4 text-base font-black text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-brand-accenthover"
              >
                Stage your first room
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <button
                onClick={onPricing}
                className="flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                See plans — from $29/mo
              </button>
            </div>

            <p className="mt-5 text-sm text-slate-400">
              {TRIAL_STAGES} free stages to try it on a real job. No card required.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/80">
              {['1,700+ real colours', 'Interior & exterior', 'Runs on your phone'].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="mx-auto w-full max-w-[420px]">
              <BeforeAfterSlider
                before={HERO_BEFORE}
                after={HERO_AFTER}
                beforeAlt="Open-plan living room with white walls before repainting"
                afterAlt="The same home with a slate-blue accent wall after repainting"
                aspectClassName="aspect-[3/4]"
              />
              <p className="mt-4 text-center text-sm text-slate-400">
                Real job, staged in PaintStage Pro. Drag the handle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 text-center sm:px-6 md:grid-cols-4">
          {STATS.map(stat => (
            <div key={stat.label}>
              <div className="text-2xl font-black text-brand-dark sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Value props ────────────────────────────────────── */}
      <section id="why" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-accent">Why painters use it</p>
            <h2 className="mb-4 text-3xl font-black text-brand-dark sm:text-4xl">
              The estimate isn't the hard part. The colour is.
            </h2>
            <p className="text-lg text-slate-500">
              Jobs stall because a homeowner can't commit to a colour from a two-inch chip. Take that
              problem off the table and the quote gets signed.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {VALUE_PROPS.map(prop => (
              <div
                key={prop.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light">
                  <svg className="h-6 w-6 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {prop.icon}
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-bold text-brand-dark">{prop.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{prop.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how" className="border-y border-slate-200 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-accent">How it works</p>
            <h2 className="mb-4 text-3xl font-black text-brand-dark sm:text-4xl">Four steps, one site visit</h2>
            <p className="text-lg text-slate-500">
              No design skills, no CAD, no back-office step. If your estimator can take a photo, they can
              run this.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-slate-200 bg-page-bg p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent text-lg font-black text-white shadow-sm">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-bold text-brand-dark">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.body}</p>
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-3 top-12 hidden h-0.5 w-6 bg-slate-200 lg:block" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-dark px-8 py-4 text-base font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-black"
            >
              Try it on {TRIAL_STAGES} rooms, free
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── Interior ───────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-accent">Interiors</p>
            <h2 className="mb-4 text-3xl font-black leading-tight text-brand-dark sm:text-4xl">
              Every colour on their walls, before you buy a single gallon
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-slate-500">
              Naval or Agreeable Gray? Accent wall or the whole room? Settle it in the walkthrough with
              their furniture, their light and their ceiling height in frame — not with a chip held up to
              a window.
            </p>
            <ul className="mb-8 space-y-3">
              {[
                'Walls, trim and doors painted as separate passes',
                'Before/after slider to send with the estimate',
                'Search real colours by name, code or hex',
                'Refine lighter or darker without spending another stage',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-slate-600">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onStart}
              className="rounded-xl bg-brand-accent px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-accenthover"
            >
              Stage a room
            </button>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-3xl shadow-xl">
              <img
                src={HERO_AFTER}
                alt="Living room staged with a slate-blue accent wall"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-dark/70 to-transparent p-5">
                <p className="text-sm font-semibold text-white">
                  Slate-blue accent wall, staged from the homeowner's own photo
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Exterior ───────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="group relative overflow-hidden rounded-3xl shadow-xl">
              <img
                src={EXTERIOR_IMG}
                alt="Freshly painted home exterior"
                className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 to-transparent" />
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-accent">Exteriors</p>
            <h2 className="mb-4 text-3xl font-black leading-tight text-brand-dark sm:text-4xl">
              The five-figure decision nobody wants to make from a chip
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-slate-500">
              Exterior repaints are where hesitation costs you the most. Show the whole elevation in the
              colour they're considering, and in the two they haven't, before the ladders come off the
              truck.
            </p>
            <ul className="mb-8 space-y-3">
              {[
                'Works on siding, stucco, brick and board-and-batten',
                'Roof, trim and landscaping stay untouched',
                'Let them try the bold option risk-free',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-slate-600">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onStart}
              className="rounded-xl bg-brand-accent px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-accenthover"
            >
              Stage an exterior
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing preview ────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-accent">Pricing</p>
            <h2 className="mb-4 text-3xl font-black text-brand-dark sm:text-4xl">
              Two plans. Priced on how much you stage.
            </h2>
            <p className="text-lg text-slate-500">
              One stage is one successful paint render. Month to month, cancel any time, and a hard stop
              at {HARD_CAP_STAGES} stages so there is never a surprise invoice.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {PLAN_LIST.map(plan => (
              <div
                key={plan.id}
                className={`rounded-3xl border bg-white p-8 shadow-sm ${
                  plan.id === 'studio' ? 'border-brand-accent ring-1 ring-brand-accent/20' : 'border-slate-200'
                }`}
              >
                <h3 className="text-lg font-black text-brand-dark">{plan.name}</h3>
                <p className="mt-1 text-sm font-semibold text-brand-accent">{plan.tagline}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight text-brand-dark">${plan.priceMonthly}</span>
                  <span className="text-sm font-semibold text-slate-400">/month</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{plan.bestFor}</p>
                <button
                  onClick={onPricing}
                  className={`mt-6 w-full rounded-xl px-6 py-3 text-sm font-bold transition-all ${
                    plan.id === 'studio'
                      ? 'bg-brand-accent text-white hover:bg-brand-accenthover'
                      : 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-brand-dark'
                  }`}
                >
                  {plan.id === 'studio' ? 'Compare plans' : 'See what\'s included'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-slate-200 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-accent">Questions</p>
            <h2 className="text-3xl font-black text-brand-dark sm:text-4xl">Frequently asked</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={faq.q} className="overflow-hidden rounded-2xl border border-slate-200 bg-page-bg shadow-sm">
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
                  style={{ maxHeight: openFaq === i ? '280px' : '0px' }}
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-500">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="bg-brand-dark py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="mb-5 text-3xl font-black leading-tight text-white sm:text-5xl">
            Your next estimate could
            <br />
            leave with a picture attached
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-slate-300">
            {TRIAL_STAGES} stages free, then $29 a month. Nothing to install and nothing to cancel by
            phone.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-accent px-10 py-5 text-lg font-black text-white shadow-xl transition-all hover:scale-[1.03] hover:bg-brand-accenthover"
            >
              Stage your first room
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button
              onClick={onPricing}
              className="rounded-2xl border border-white/30 px-8 py-5 text-base font-bold text-white transition-all hover:bg-white/10"
            >
              View pricing
            </button>
          </div>
        </div>
      </section>

      <MarketingFooter onStart={onStart} onPricing={onPricing} onHome={goHome} />
    </div>
  );
};

export default HomePage;
