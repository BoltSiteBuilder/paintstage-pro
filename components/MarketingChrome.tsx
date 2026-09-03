import React, { useEffect, useState } from 'react';
import { SITE, BRAND_DISCLAIMER, PREVIEW_DISCLAIMER } from '../config/site';

export interface MarketingNavProps {
  onStart: () => void;
  onPricing: () => void;
  onHome: () => void;
  /** Overlay sits on top of the hero and turns solid on scroll. */
  variant?: 'overlay' | 'solid';
}

export const MarketingHeader: React.FC<MarketingNavProps> = ({
  onStart,
  onPricing,
  onHome,
  variant = 'overlay',
}) => {
  const [scrolled, setScrolled] = useState(variant === 'solid');

  useEffect(() => {
    if (variant === 'solid') return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  const solid = variant === 'solid' || scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        solid ? 'border-b border-slate-200 bg-white/95 shadow-md backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button onClick={onHome} className="flex items-center gap-2" aria-label={`${SITE.name} home`}>
          <img src={SITE.logo} alt={SITE.name} className="h-12 w-auto object-contain" />
        </button>

        <nav
          className={`hidden items-center gap-8 text-sm font-semibold md:flex ${
            solid ? 'text-slate-600' : 'text-white/90'
          }`}
        >
          <button onClick={onHome} className="transition-colors hover:text-brand-accent">How it works</button>
          <button onClick={onPricing} className="transition-colors hover:text-brand-accent">Pricing</button>
          <a href="#faq" className="transition-colors hover:text-brand-accent">FAQ</a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onPricing}
            className={`hidden rounded-xl px-4 py-2.5 text-sm font-bold transition-colors sm:block ${
              solid ? 'text-slate-600 hover:bg-slate-100' : 'text-white/90 hover:bg-white/10'
            }`}
          >
            Plans
          </button>
          <button
            onClick={onStart}
            className="rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-accenthover hover:shadow-md"
          >
            Open the studio
          </button>
        </div>
      </div>
    </header>
  );
};

export const MarketingFooter: React.FC<MarketingNavProps> = ({ onStart, onPricing, onHome }) => (
  <footer className="border-t border-white/10 bg-brand-dark py-12">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-8 flex flex-col items-center justify-between gap-6 md:flex-row">
        <button onClick={onHome}>
          <img src={SITE.logo} alt={SITE.name} className="h-12 w-auto object-contain opacity-80" />
        </button>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
          <button onClick={onHome} className="transition-colors hover:text-white">How it works</button>
          <button onClick={onPricing} className="transition-colors hover:text-white">Pricing</button>
          <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="transition-colors hover:text-white"
          >
            Contact
          </a>
          <button onClick={onStart} className="font-bold text-brand-accent transition-colors hover:text-brand-accenthover">
            Open the studio
          </button>
        </div>
      </div>
      <div className="border-t border-white/10 pt-8 text-center">
        <p className="mx-auto max-w-xl text-xs leading-relaxed text-slate-400">{PREVIEW_DISCLAIMER}</p>
        <p className="mt-4 text-xs text-slate-500">
          © {new Date().getFullYear()} {SITE.name} ·{' '}
          <a
            href={SITE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-slate-300"
          >
            PaintStagePro.com
          </a>
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-slate-600">{BRAND_DISCLAIMER}</p>
      </div>
    </div>
  </footer>
);
