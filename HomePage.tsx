import React, { useState, useEffect } from 'react';

const COMPANY_NAME = 'DB Painting';
const COMPANY_PHONE = '(864) 555-0000';

const HERO_IMG = 'https://images.pexels.com/photos/6782370/pexels-photo-6782370.jpeg?auto=compress&cs=tinysrgb&h=900&w=1400';
const EXTERIOR_IMG = 'https://images.pexels.com/photos/6422929/pexels-photo-6422929.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const ROLLER_IMG = 'https://images.pexels.com/photos/6764270/pexels-photo-6764270.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const GALLERY = [
  { url: 'https://images.pexels.com/photos/12420730/pexels-photo-12420730.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Modern living room with vibrant cushions' },
  { url: 'https://images.pexels.com/photos/35419459/pexels-photo-35419459.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Bright stylish living room' },
  { url: 'https://images.pexels.com/photos/10628389/pexels-photo-10628389.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Cozy living room with blue armchair' },
  { url: 'https://images.pexels.com/photos/35419462/pexels-photo-35419462.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Elegant living room with fireplace' },
];

const STEPS = [
  { emoji: '1', title: 'Snap a photo', body: 'Take a picture of any room or the outside of your home. No fancy equipment needed — your phone is perfect.' },
  { emoji: '2', title: 'Pick a paint color', body: 'Browse thousands of real colors from Sherwin-Williams, Benjamin Moore, and Behr, or enter any custom hex code.' },
  { emoji: '3', title: 'See it instantly', body: 'Our AI paints your walls, siding, trim, and doors in seconds. Compare before and after side by side.' },
  { emoji: '4', title: 'Get a free estimate', body: 'Love the look? Send your selection straight to our team and get a free, no-obligation painting estimate.' },
];

const FAQS = [
  { q: 'Is this really free to use?', a: 'Yes. Visualizing your space is completely free. You only pay if you decide to hire us for the actual painting.' },
  { q: 'Do I need to download anything?', a: 'No. Everything runs right in your browser on your phone, tablet, or computer.' },
  { q: 'How accurate are the colors?', a: 'The previews are digital approximations. Actual paint will vary based on lighting, surface texture, and sheen. We always bring real paint chips to your estimate.' },
  { q: 'Can you paint exteriors too?', a: 'Absolutely. The tool works on both interior rooms and the outside of your home. Just upload the photo you want to preview.' },
];

interface HomePageProps {
  onStart: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-page-bg text-brand-dark font-sans">
      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/ChatGPT_Image_May_14,_2026,_03_45_00_PM.png"
              alt="PaintStage Pro"
              className="h-12 w-auto object-contain"
            />
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#how" className="hover:text-brand-accent transition-colors">How it works</a>
            <a href="#gallery" className="hover:text-brand-accent transition-colors">Gallery</a>
            <a href="#faq" className="hover:text-brand-accent transition-colors">FAQ</a>
          </nav>
          <button
            onClick={onStart}
            className="px-5 py-2.5 bg-brand-accent hover:bg-brand-accenthover text-white rounded-xl font-bold text-sm shadow-sm transition-all hover:shadow-md"
          >
            Try it free
          </button>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Beautifully painted living room"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/70 to-brand-dark/30" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full pt-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-semibold mb-6 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Free • No signup required
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] mb-6">
              See your home painted<br />
              <span className="text-brand-accent">before you commit</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-200 leading-relaxed mb-8 max-w-xl">
              Upload a photo of any room or the outside of your home, pick a real paint color, and watch AI transform it in seconds. No guesswork, no regrets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onStart}
                className="px-8 py-4 bg-brand-accent hover:bg-brand-accenthover text-white rounded-2xl font-black text-base shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group"
              >
                Visualize my home now
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <a
                href="#how"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white rounded-2xl font-bold text-base transition-all flex items-center justify-center"
              >
                See how it works
              </a>
            </div>
            <div className="flex items-center gap-6 mt-10 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                1,700+ real colors
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Interior & exterior
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Results in seconds
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:block">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '1,700+', label: 'Real paint colors' },
            { value: 'Seconds', label: 'To see your result' },
            { value: '100%', label: 'Free to try' },
            { value: '0', label: 'Apps to install' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-2xl sm:text-3xl font-black text-brand-dark">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-bold text-brand-accent uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-dark mb-4">From photo to painted in four steps</h2>
            <p className="text-lg text-slate-500">No design skills needed. If you can take a photo, you can use PaintStage Pro.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="relative bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-accent text-white flex items-center justify-center font-black text-lg mb-4 shadow-sm">
                  {step.emoji}
                </div>
                <h3 className="font-bold text-brand-dark text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.body}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-slate-200" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-dark hover:bg-black text-white rounded-2xl font-bold text-base shadow-md transition-all hover:scale-[1.02]"
            >
              Start visualizing — it's free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── Split feature: interior ────────────────────────── */}
      <section className="bg-white border-y border-slate-200 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-bold text-brand-accent uppercase tracking-widest mb-3">Interior painting</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-dark mb-4 leading-tight">
              Try every color on your walls before opening a single can
            </h2>
            <p className="text-lg text-slate-500 mb-6 leading-relaxed">
              Wondering if Agreeable Gray or Naval is right for your living room? Stop guessing from tiny paint chips. Upload a photo and see exactly how each color looks on your walls, with your lighting and your furniture.
            </p>
            <ul className="space-y-3 mb-8">
              {['Paint walls, trim, and doors separately', 'Compare before and after with a drag slider', 'Search real colors by name or code'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onStart}
              className="px-6 py-3 bg-brand-accent hover:bg-brand-accenthover text-white rounded-xl font-bold text-sm shadow-sm transition-all"
            >
              Visualize a room
            </button>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative rounded-3xl overflow-hidden shadow-xl group">
              <img
                src={ROLLER_IMG}
                alt="Painting a wall with a roller"
                className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Split feature: exterior ────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="relative rounded-3xl overflow-hidden shadow-xl group">
              <img
                src={EXTERIOR_IMG}
                alt="Beautifully painted home exterior"
                className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 to-transparent" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-brand-accent uppercase tracking-widest mb-3">Exterior painting</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-dark mb-4 leading-tight">
              See your whole house repainted before we ever set up a ladder
            </h2>
            <p className="text-lg text-slate-500 mb-6 leading-relaxed">
              A new exterior color is a big decision. Upload a photo of your home and preview how different siding colors look in real time. Love it? Request a free estimate and we'll bring real samples to confirm.
            </p>
            <ul className="space-y-3 mb-8">
              {['Works on siding, stucco, brick, and more', 'Preserves roof, trim, and landscaping', 'Try bold colors risk-free'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onStart}
              className="px-6 py-3 bg-brand-accent hover:bg-brand-accenthover text-white rounded-xl font-bold text-sm shadow-sm transition-all"
            >
              Visualize my home
            </button>
          </div>
        </div>
      </section>

      {/* ── Gallery ────────────────────────────────────────── */}
      <section id="gallery" className="bg-white border-y border-slate-200 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-bold text-brand-accent uppercase tracking-widest mb-3">Inspiration</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-dark mb-4">Imagine the possibilities</h2>
            <p className="text-lg text-slate-500">A few spaces ready for a fresh coat. Yours could be next.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {GALLERY.map((img, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden shadow-md group cursor-pointer"
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full aspect-[3/4] object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 inset-x-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-xs font-semibold">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-brand-accent uppercase tracking-widest mb-3">Questions</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-dark mb-4">Frequently asked</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-bold text-brand-dark text-sm sm:text-base">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? '200px' : '0px' }}
                >
                  <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="bg-brand-dark py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 leading-tight">
            Ready to see your home<br />in a whole new color?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
            It's free, it's fast, and there's nothing to install. Just upload a photo and pick a color.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-10 py-5 bg-brand-accent hover:bg-brand-accenthover text-white rounded-2xl font-black text-lg shadow-xl transition-all hover:scale-[1.03]"
          >
            Start now — it's free
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-brand-dark border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <img
              src="/ChatGPT_Image_May_14,_2026,_03_45_00_PM.png"
              alt="PaintStage Pro"
              className="h-12 w-auto object-contain opacity-80"
            />
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#how" className="hover:text-white transition-colors">How it works</a>
              <a href="#gallery" className="hover:text-white transition-colors">Gallery</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <button onClick={onStart} className="text-brand-accent font-bold hover:text-brand-accenthover transition-colors">Try it free</button>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-slate-400 text-xs leading-relaxed max-w-xl mx-auto">
              AI color visualizations are approximate previews. Actual results may vary based on lighting, surface texture, and paint sheen.
            </p>
            <p className="text-slate-500 text-xs mt-4">
              {COMPANY_NAME} · {COMPANY_PHONE} · Powered by{' '}
              <a href="https://PaintStagePro.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors underline underline-offset-2">PaintStagePro.com</a>
            </p>
            <p className="text-slate-600 text-xs mt-4 max-w-2xl mx-auto leading-relaxed">
              PaintStage Pro is an independent tool and is not affiliated with, endorsed by, or sponsored by Sherwin-Williams, Benjamin Moore, Behr, or any paint manufacturer. All paint brand names, color names, and color codes are trademarks or property of their respective owners and are used here for identification and reference purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
