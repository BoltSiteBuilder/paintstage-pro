import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  applyPaintColor,
  applyTrimColor,
  applyDoorColor,
  tweakPaintedImage,
} from './services/geminiService';

// ============================================================
// CONFIGURATION — Customize these for Matt's business
// ============================================================
const COMPANY_NAME = 'DB Painting';
const COMPANY_PHONE = '(864) 555-0000'; // TODO: Replace with Matt's actual phone number
const CONTRACTOR_EMAIL = 'rwarfieldjr@gmail.com';

// EmailJS Configuration
// ─────────────────────────────────────────────────────────────
// 1. Go to emailjs.com and create a free account (200 emails/month free)
// 2. Add an Email Service (connect your Gmail or other email)
// 3. Create an Email Template with these variables:
//      {{from_name}}, {{from_email}}, {{phone}}, {{paint_brand}},
//      {{color_name}}, {{hex_code}}, {{notes}}, {{to_email}}
// 4. Paste your Service ID, Template ID, and Public Key below
// 5. Also paste your Public Key in index.html where it says YOUR_PUBLIC_KEY_HERE
// ─────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // e.g. 'template_xyz789'
// ============================================================

// Extend window type for EmailJS CDN
declare global {
  interface Window {
    emailjs?: {
      send: (
        serviceId: string,
        templateId: string,
        params: Record<string, string>
      ) => Promise<{ status: number; text: string }>;
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Paint brand data
// ─────────────────────────────────────────────────────────────
const PAINT_BRANDS = ['Sherwin Williams', 'Benjamin Moore', 'Behr'] as const;
type PaintBrand = (typeof PAINT_BRANDS)[number];

interface ColorSwatch {
  name: string;
  hex: string;
  code: string;
}

const BRAND_COLORS: Record<PaintBrand, ColorSwatch[]> = {
  'Sherwin Williams': [
    { name: 'Agreeable Gray',   hex: '#B9B5A9', code: 'SW 7029' },
    { name: 'Accessible Beige', hex: '#D4C8B0', code: 'SW 7036' },
    { name: 'Alabaster',        hex: '#F2EFE4', code: 'SW 7008' },
    { name: 'Repose Gray',      hex: '#C0BCBB', code: 'SW 7015' },
    { name: 'Naval',            hex: '#4B5D72', code: 'SW 6244' },
    { name: 'Evergreen Fog',    hex: '#8F9E8E', code: 'SW 9130' },
    { name: 'Cavern Clay',      hex: '#BC6B4A', code: 'SW 7701' },
    { name: 'Mindful Gray',     hex: '#B7B3AE', code: 'SW 7016' },
  ],
  'Benjamin Moore': [
    { name: 'White Dove',       hex: '#F3F1E7', code: 'OC-17'   },
    { name: 'Pale Oak',         hex: '#D9CDB9', code: 'OC-20'   },
    { name: 'Revere Pewter',    hex: '#C3BAA5', code: 'HC-172'  },
    { name: 'Chantilly Lace',   hex: '#F5F3EC', code: 'OC-65'   },
    { name: 'Simply White',     hex: '#F6F3E8', code: 'OC-117'  },
    { name: 'Blue Note',        hex: '#5B7B9C', code: '2129-30' },
    { name: 'Hale Navy',        hex: '#4A5A6B', code: 'HC-154'  },
    { name: 'Newburyport Blue', hex: '#5B7A8A', code: 'HC-155'  },
  ],
  'Behr': [
    { name: 'Swiss Coffee',     hex: '#F0EAD6', code: 'PPU5-12'  },
    { name: 'Polar Bear',       hex: '#F3F1EA', code: 'PPU18-06' },
    { name: 'Silver Drop',      hex: '#C8C5BB', code: 'N520-2'   },
    { name: 'Gentle Dove',      hex: '#D5D0CA', code: 'GR-W15'   },
    { name: 'Blueprint',        hex: '#5B7CA0', code: 'S510-5'   },
    { name: 'Mossy Hillside',   hex: '#8FA07A', code: 'S390-5'   },
    { name: 'Canyon Dusk',      hex: '#C4906B', code: 'S200-5'   },
    { name: 'Dark Pewter',      hex: '#8C8880', code: 'N520-5'   },
  ],
};

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

// Compress image for email attachment (keeps it under 100KB)
const compressImage = (dataUrl: string, maxWidth = 640, quality = 0.65): Promise<string> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });

const downloadImage = (dataUrl: string, filename: string) => {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// ─────────────────────────────────────────────────────────────
// Before/After Comparison Slider
// ─────────────────────────────────────────────────────────────
const BeforeAfterSlider: React.FC<{ before: string; after: string }> = ({ before, after }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden select-none border border-slate-200 shadow-lg"
      style={{ aspectRatio: '4/3', cursor: 'ew-resize' }}
      onMouseDown={e  => { isDragging.current = true; updatePos(e.clientX); }}
      onMouseMove={e  => { if (isDragging.current) updatePos(e.clientX); }}
      onMouseUp={() => { isDragging.current = false; }}
      onMouseLeave={() => { isDragging.current = false; }}
      onTouchStart={e  => { isDragging.current = true; updatePos(e.touches[0].clientX); }}
      onTouchMove={e   => { if (isDragging.current) updatePos(e.touches[0].clientX); }}
      onTouchEnd={() => { isDragging.current = false; }}
    >
      {/* After (painted) — base layer, always fully visible */}
      <img
        src={after}
        alt="After painting"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Before — clipped to show only the left portion */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img
          src={before}
          alt="Before painting"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Divider line + handle */}
      <div
        className="absolute top-0 bottom-0 z-10 pointer-events-none"
        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/90 shadow-md" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-3 3 3 3M16 9l3 3-3 3" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 z-20 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full tracking-wide">BEFORE</span>
      <span className="absolute top-3 right-3 z-20 bg-brand-accent text-white text-xs font-bold px-2.5 py-1 rounded-full tracking-wide">AFTER</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Paint Roller Animation
// ─────────────────────────────────────────────────────────────
const Spinner: React.FC<{ size?: string }> = () => (
  <div className="roller-scene">
    {/* Paint trail on the wall */}
    <div className="roller-trail" />
    {/* The roller itself bobs up/down */}
    <div className="roller-bob">
      <svg width="80" height="52" viewBox="0 0 80 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Handle rod — horizontal */}
        <rect x="44" y="22" width="32" height="6" rx="3" fill="#94a3b8" />
        {/* Elbow — vertical */}
        <rect x="38" y="4" width="6" height="24" rx="3" fill="#94a3b8" />
        {/* Roller frame */}
        <rect x="2" y="8" width="40" height="34" rx="8" fill="#e2e8f0" />
        {/* Roller cylinder */}
        <rect x="6" y="12" width="32" height="26" rx="6" fill="#2563EB" />
        {/* Shine stripe */}
        <rect x="10" y="16" width="10" height="6" rx="3" fill="rgba(255,255,255,0.4)" />
        {/* Drip */}
        <ellipse className="roller-drip" cx="20" cy="40" rx="4" ry="5" fill="#2563EB" />
      </svg>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Lightbox
// ─────────────────────────────────────────────────────────────
const Lightbox: React.FC<{ src: string; alt: string; onClose: () => void }> = ({ src, alt, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Zoomable image wrapper
// ─────────────────────────────────────────────────────────────
const ZoomableImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="relative group cursor-zoom-in w-full h-full"
        onClick={() => setOpen(true)}
      >
        <img src={src} alt={alt} className={`${className} block`} />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 rounded-none">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              <path strokeLinecap="round" d="M11 8v6M8 11h6" />
            </svg>
          </div>
        </div>
      </div>
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────
type AppStep = 'upload' | 'configure' | 'loading' | 'result';

export default function App() {
  // Image state
  const [step, setStep] = useState<AppStep>('upload');
  const [originalImage,   setOriginalImage]   = useState<string | null>(null);
  const [originalMimeType, setOriginalMimeType] = useState('image/jpeg');
  const [resultImage,     setResultImage]     = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Paint selection state
  const [selectedBrand, setSelectedBrand] = useState<PaintBrand>('Sherwin Williams');
  const [colorName,     setColorName]     = useState('Agreeable Gray');
  const [hexCode,       setHexCode]       = useState('#B9B5A9');
  const [selectedSwatch, setSelectedSwatch] = useState<string | null>('Agreeable Gray');

  // Tweak state
  const [tweakPrompt,  setTweakPrompt]  = useState('');
  const [isTweaking,   setIsTweaking]   = useState(false);
  const [tweakError,   setTweakError]   = useState<string | null>(null);

  // Trim state
  const [trimName,    setTrimName]    = useState('Pure White');
  const [trimHex,     setTrimHex]     = useState('#F5F5F0');
  const [isPaintingTrim, setIsPaintingTrim] = useState(false);
  const [trimError,   setTrimError]   = useState<string | null>(null);

  // Door state
  const [doorName,    setDoorName]    = useState('Tricorn Black');
  const [doorHex,     setDoorHex]     = useState('#1F1F1F');
  const [isPaintingDoor, setIsPaintingDoor] = useState(false);
  const [doorError,   setDoorError]   = useState<string | null>(null);

  // Lead form state
  const [formName,    setFormName]    = useState('');
  const [formEmail,   setFormEmail]   = useState('');
  const [formPhone,   setFormPhone]   = useState('');
  const [formNotes,   setFormNotes]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef      = useRef<HTMLDivElement>(null);
  const resultRef    = useRef<HTMLDivElement>(null);

  // ── File upload ──────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setOriginalImage(dataUrl);
      setOriginalMimeType(file.type || 'image/jpeg');
      setResultImage(null);
      setError(null);
      setSubmitStatus('idle');
      setStep('configure');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
    if (file) processFile(file);
  };

  // ── Color selection ──────────────────────────────────────
  const handleSwatchClick = (swatch: ColorSwatch) => {
    setColorName(swatch.name);
    setHexCode(swatch.hex);
    setSelectedSwatch(swatch.name);
  };

  const handleBrandChange = (brand: PaintBrand) => {
    setSelectedBrand(brand);
    const first = BRAND_COLORS[brand][0];
    setColorName(first.name);
    setHexCode(first.hex);
    setSelectedSwatch(first.name);
  };

  const handleHexInput = (raw: string) => {
    // Allow typing a hex value — ensure it starts with #
    const val = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
      setHexCode(val);
      setSelectedSwatch(null);
    }
  };

  // ── AI generation ────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!originalImage || !colorName || !hexCode) return;
    setStep('loading');
    setError(null);
    try {
      const base64 = originalImage.split(',')[1];
      const painted = await applyPaintColor(
        base64, originalMimeType, selectedBrand, colorName, hexCode
      );
      setResultImage(painted);
      setStep('result');
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      console.error('PaintStage error:', err);
      setError(err.message ?? 'Something went wrong. Please try again.');
      setStep('configure');
    }
  }, [originalImage, originalMimeType, selectedBrand, colorName, hexCode]);

  // Helper: extract base64 + mime from the current result data URL
  const splitDataUrl = (dataUrl: string): { mime: string; base64: string } | null => {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return { mime: match[1], base64: match[2] };
  };

  // ── Apply trim color ────────────────────────────────────
  const handleApplyTrim = useCallback(async () => {
    if (!resultImage || !trimHex || isPaintingTrim) return;
    setIsPaintingTrim(true);
    setTrimError(null);
    try {
      const parts = splitDataUrl(resultImage);
      if (!parts) throw new Error('Could not parse the current image.');
      const result = await applyTrimColor(parts.base64, parts.mime, trimName || 'Custom Trim', trimHex);
      setResultImage(result);
    } catch (err: any) {
      console.error('Trim paint error:', err);
      setTrimError(err.message ?? 'Could not apply the trim color. Try again.');
    } finally {
      setIsPaintingTrim(false);
    }
  }, [resultImage, trimName, trimHex, isPaintingTrim]);

  // ── Apply door color ────────────────────────────────────
  const handleApplyDoor = useCallback(async () => {
    if (!resultImage || !doorHex || isPaintingDoor) return;
    setIsPaintingDoor(true);
    setDoorError(null);
    try {
      const parts = splitDataUrl(resultImage);
      if (!parts) throw new Error('Could not parse the current image.');
      const result = await applyDoorColor(parts.base64, parts.mime, doorName || 'Custom Door', doorHex);
      setResultImage(result);
    } catch (err: any) {
      console.error('Door paint error:', err);
      setDoorError(err.message ?? 'Could not apply the door color. Try again.');
    } finally {
      setIsPaintingDoor(false);
    }
  }, [resultImage, doorName, doorHex, isPaintingDoor]);

  // ── Apply a tweak to the painted result ──────────────────
  const handleTweak = useCallback(async () => {
    if (!resultImage || !tweakPrompt.trim() || isTweaking) return;
    setIsTweaking(true);
    setTweakError(null);
    try {
      const parts = splitDataUrl(resultImage);
      if (!parts) throw new Error('Could not parse the current image.');
      const tweaked = await tweakPaintedImage(parts.base64, parts.mime, tweakPrompt.trim());
      setResultImage(tweaked);
      setTweakPrompt('');
    } catch (err: any) {
      console.error('Tweak error:', err);
      setTweakError(err.message ?? 'Could not apply that tweak. Try rephrasing.');
    } finally {
      setIsTweaking(false);
    }
  }, [resultImage, tweakPrompt, isTweaking]);

  // ── Lead form submit ─────────────────────────────────────
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const templateParams: Record<string, string> = {
      to_email:    CONTRACTOR_EMAIL,
      from_name:   formName,
      from_email:  formEmail,
      phone:       formPhone || 'Not provided',
      paint_brand: selectedBrand,
      color_name:  colorName,
      hex_code:    hexCode,
      notes:       formNotes || 'None',
      reply_to:    formEmail,
    };

    try {
      if (window.emailjs && EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID') {
        // Attempt to compress and include thumbnail images in the email
        try {
          const [beforeThumb, afterThumb] = await Promise.all([
            originalImage ? compressImage(originalImage, 480, 0.6) : Promise.resolve(''),
            resultImage   ? compressImage(resultImage,   480, 0.6) : Promise.resolve(''),
          ]);
          templateParams.before_image = beforeThumb;
          templateParams.after_image  = afterThumb;
        } catch {
          // Image compression failed — send without images, not a blocker
        }

        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        setSubmitStatus('success');
      } else {
        // Fallback: open the user's mail client with form data pre-filled
        const body = [
          `New Estimate Request — PaintStage Pro`,
          ``,
          `Name:  ${formName}`,
          `Email: ${formEmail}`,
          `Phone: ${formPhone || 'Not provided'}`,
          ``,
          `Paint Color Selection:`,
          `  Brand: ${selectedBrand}`,
          `  Color: ${colorName}`,
          `  Hex:   ${hexCode}`,
          ``,
          `Notes: ${formNotes || 'None'}`,
          ``,
          `— Sent via PaintStage Pro`,
        ].join('\n');

        const subject = encodeURIComponent(`Paint Estimate Request — ${colorName} (${selectedBrand})`);
        window.location.href = `mailto:${CONTRACTOR_EMAIL}?subject=${subject}&body=${encodeURIComponent(body)}`;
        setSubmitStatus('success');
      }
    } catch (err: any) {
      console.error('Email send error:', err);
      setSubmitStatus('error');
      setSubmitError(
        `Couldn't send automatically. Please call us at ${COMPANY_PHONE} or email ${CONTRACTOR_EMAIL} directly.`
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formName, formEmail, formPhone, formNotes, selectedBrand, colorName, hexCode, originalImage, resultImage]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetToUpload = () => {
    setStep('upload');
    setOriginalImage(null);
    setResultImage(null);
    setError(null);
    setSubmitStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-page-bg text-brand-dark font-sans flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/60 backdrop-blur-md border-b border-white/40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
          {/* Logo */}
          <button onClick={resetToUpload} className="group">
            <img
              src="/ChatGPT_Image_May_14,_2026,_03_35_04_PM.png"
              alt="PaintStage Pro"
              className="h-20 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </button>

          {/* Right side */}
          <div className="flex items-center gap-3">
{step === 'result' && (
              <button
                onClick={scrollToForm}
                className="px-4 py-2 bg-brand-accent hover:bg-brand-accenthover text-white rounded-lg font-bold text-sm shadow-sm transition-all"
              >
                Free Estimate
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ════════════════════════════════════════
            STEP: UPLOAD
        ════════════════════════════════════════ */}
        {step === 'upload' && (
          <div className="flex flex-col items-center">
            {/* Hero */}
            <div className="text-center max-w-2xl mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-dark leading-tight mb-4">
                See Your Home Painted<br />
                <span className="text-brand-accent">Before You Commit</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-500">
                Upload an interior or exterior photo, pick any paint color, and watch AI transform it in seconds.
              </p>
            </div>

            {/* Upload zone */}
            <div
              className="w-full max-w-2xl bg-white border-2 border-dashed border-slate-300 rounded-3xl p-10 sm:p-14 text-center cursor-pointer
                         hover:border-brand-accent hover:bg-brand-light transition-all duration-300 group shadow-sm"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              role="button"
              aria-label="Upload room photo"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-5">
                <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-10 h-10 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-bold text-brand-dark">Drop your photo here</p>
                  <p className="text-slate-500 mt-1">or click to browse</p>
                  <p className="text-sm text-slate-400 mt-4">
                    Interior or exterior • JPG, PNG, or WEBP • Works best with well-lit photos
                  </p>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-16 w-full max-w-3xl">
              <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-7">How It Works</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { emoji: '📷', title: 'Upload Your Photo',    body: 'Take a picture of the room or exterior you want painted and upload it here.' },
                  { emoji: '🎨', title: 'Choose a Paint Color', body: 'Pick from Sherwin-Williams, Benjamin Moore, or Behr — or enter any hex code.' },
                  { emoji: '✨', title: 'See It Painted',       body: "AI applies the color to your walls. Love it? Request a free estimate from Matt's team." },
                ].map(item => (
                  <div key={item.title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
                    <div className="text-4xl mb-3">{item.emoji}</div>
                    <h3 className="font-bold text-brand-dark text-base mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP: CONFIGURE
        ════════════════════════════════════════ */}
        {step === 'configure' && originalImage && (
          <div>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* ── Photo preview ── */}
              <div>
                <h2 className="text-lg font-bold text-brand-dark mb-3">Your Room</h2>
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 aspect-video flex items-center justify-center">
                  <img src={originalImage} alt="Your room" className="max-h-full max-w-full object-contain" />
                </div>
                <button
                  onClick={resetToUpload}
                  className="mt-3 text-sm text-slate-400 hover:text-brand-dark transition-colors font-medium"
                >
                  ← Use a different photo
                </button>
              </div>

              {/* ── Configuration panel ── */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-black text-brand-dark">Pick Your Paint Color</h2>
                  <p className="text-sm text-slate-400 mt-1">Choose a brand, select a popular color, or enter a custom hex code.</p>
                </div>

                {/* Brand selector */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Paint Brand</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PAINT_BRANDS.map(brand => (
                      <button
                        key={brand}
                        onClick={() => handleBrandChange(brand)}
                        className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all leading-tight ${
                          selectedBrand === brand
                            ? 'border-brand-accent bg-brand-light text-brand-accent'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {brand === 'Sherwin Williams' ? 'Sherwin-Williams' : brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular color swatches */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Popular {selectedBrand} Colors
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {BRAND_COLORS[selectedBrand].map(swatch => (
                      <button
                        key={swatch.name}
                        onClick={() => handleSwatchClick(swatch)}
                        title={`${swatch.name} (${swatch.code})`}
                        className={`flex flex-col items-center rounded-xl p-2 border-2 transition-all ${
                          selectedSwatch === swatch.name
                            ? 'border-brand-accent shadow-md scale-105'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className="w-full h-8 rounded-lg mb-1.5 shadow-sm border border-black/5"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight line-clamp-2">{swatch.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom color input */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Custom Color</p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={colorName}
                      onChange={e => { setColorName(e.target.value); setSelectedSwatch(null); }}
                      placeholder="Color name (e.g. Accessible Beige)"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm"
                    />
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="color-picker"
                        className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer shadow-sm overflow-hidden hover:border-brand-accent transition-colors"
                        style={{ backgroundColor: hexCode }}
                        title="Open color picker"
                      >
                        <input
                          id="color-picker"
                          type="color"
                          value={hexCode.length === 7 ? hexCode : '#B9B5A9'}
                          onChange={e => { setHexCode(e.target.value); setSelectedSwatch(null); }}
                          className="opacity-0 w-full h-full cursor-pointer"
                        />
                      </label>
                      <input
                        type="text"
                        value={hexCode}
                        onChange={e => handleHexInput(e.target.value)}
                        placeholder="#RRGGBB"
                        maxLength={7}
                        className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Selected color chip */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div
                    className="w-12 h-12 rounded-xl shadow-sm border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: hexCode }}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-brand-dark text-sm truncate">{colorName || 'No color selected'}</p>
                    <p className="text-xs text-slate-500 truncate">{selectedBrand}</p>
                    <p className="text-xs text-slate-400 font-mono">{hexCode}</p>
                  </div>
                </div>

                {/* Generate CTA */}
                <button
                  onClick={handleGenerate}
                  disabled={!colorName.trim() || hexCode.length < 4}
                  className="w-full py-4 bg-brand-accent hover:bg-brand-accenthover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base shadow-md transition-all flex items-center justify-center gap-3 mt-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-4a2 2 0 00-2 2v4a2 2 0 002 2zm0-2h12" />
                  </svg>
                  Visualize This Color on My Walls
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP: LOADING
        ════════════════════════════════════════ */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Spinner size="w-16 h-16" />
            <h2 className="text-2xl font-black text-brand-dark mt-8 mb-2">Painting your walls…</h2>
            <p className="text-lg text-slate-500 mb-1">
              Applying <span className="font-bold text-brand-accent">{colorName}</span>
            </p>
            <p className="text-sm text-slate-400">{selectedBrand} · {hexCode}</p>
            <p className="text-sm text-slate-400 mt-2">This usually takes about 15–25 seconds</p>
            {originalImage && (
              <div className="mt-10 max-w-lg w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-video flex items-center justify-center opacity-40 blur-sm">
                <img src={originalImage} alt="" className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP: RESULT
        ════════════════════════════════════════ */}
        {step === 'result' && originalImage && resultImage && (
          <div ref={resultRef} className="flex flex-col items-center gap-10">

            {/* Result heading */}
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-brand-dark leading-tight">
                Your Room in{' '}
                <span className="text-brand-accent">{colorName}</span>
              </h2>
              <p className="text-slate-500 mt-1">{selectedBrand} · {hexCode}</p>
            </div>

            {/* Comparison slider */}
            <div className="w-full max-w-3xl">
              <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">← Drag to compare →</p>
              <BeforeAfterSlider before={originalImage} after={resultImage} />
            </div>

            {/* Side-by-side download buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
              <div className="flex flex-col gap-2">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 aspect-video">
                  <ZoomableImage src={originalImage} alt="Before" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => downloadImage(originalImage, 'before-painting.jpg')}
                  className="w-full py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Before
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="rounded-2xl overflow-hidden border-2 border-brand-accent/30 shadow-md bg-slate-100 aspect-video">
                  <ZoomableImage src={resultImage} alt="After" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => downloadImage(resultImage, `after-${colorName.replace(/\s+/g, '-').toLowerCase()}.jpg`)}
                  className="w-full py-2.5 bg-brand-accent hover:bg-brand-accenthover text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download After
                </button>
              </div>
            </div>

            {/* Action row */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setStep('configure')}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
              >
                Try Another Color
              </button>
              <button
                onClick={resetToUpload}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
              >
                New Photo
              </button>
              <button
                onClick={scrollToForm}
                className="px-7 py-2.5 bg-brand-accent hover:bg-brand-accenthover text-white rounded-xl text-sm font-bold shadow-md transition-all"
              >
                Request Free Estimate →
              </button>
            </div>

            {/* ════════════════════════════════════════
                CUSTOMIZE TRIM & DOORS
            ════════════════════════════════════════ */}
            <div className="w-full max-w-2xl mt-2">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-brand-light flex-shrink-0 flex items-center justify-center">
                    <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-4a2 2 0 00-2 2v4a2 2 0 002 2zm0-2h12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-brand-dark leading-tight">Customize trim & doors</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Paint trim, baseboards, and doors separately — they stayed their original color above.
                    </p>
                  </div>
                </div>

                {/* ── TRIM ── */}
                <div className="border border-slate-200 rounded-2xl p-5 mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Trim, baseboards & frames
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <label
                      className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer shadow-sm overflow-hidden hover:border-brand-accent transition-colors relative"
                      style={{ backgroundColor: trimHex }}
                    >
                      <input
                        type="color"
                        value={trimHex.length === 7 ? trimHex : '#FFFFFF'}
                        onChange={e => setTrimHex(e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                      />
                    </label>
                    <input
                      type="text"
                      value={trimHex}
                      onChange={e => {
                        const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setTrimHex(v);
                      }}
                      maxLength={7}
                      placeholder="#RRGGBB"
                      className="w-28 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm font-mono"
                    />
                    <input
                      type="text"
                      value={trimName}
                      onChange={e => setTrimName(e.target.value)}
                      placeholder="Color name (optional)"
                      className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm"
                    />
                  </div>

                  {/* Quick trim presets */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { name: 'Pure White',  hex: '#F5F5F0' },
                      { name: 'Alabaster',   hex: '#F2EFE4' },
                      { name: 'Soft Cream',  hex: '#EDE6D3' },
                      { name: 'Light Gray',  hex: '#D5D2CC' },
                      { name: 'Charcoal',    hex: '#3D3D3D' },
                    ].map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => { setTrimName(p.name); setTrimHex(p.hex); }}
                        disabled={isPaintingTrim}
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-brand-accent transition-all disabled:opacity-50"
                      >
                        <span className="inline-block w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.hex }} />
                        {p.name}
                      </button>
                    ))}
                  </div>

                  {trimError && <p className="text-xs text-red-600 mb-2">{trimError}</p>}

                  <button
                    onClick={handleApplyTrim}
                    disabled={isPaintingTrim || !trimHex || isTweaking || isPaintingDoor}
                    className="w-full py-2.5 bg-brand-dark hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isPaintingTrim ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white spinner" />
                        Painting trim…
                      </>
                    ) : (
                      <>Apply Trim Color</>
                    )}
                  </button>
                </div>

                {/* ── DOORS ── */}
                <div className="border border-slate-200 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Doors
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <label
                      className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer shadow-sm overflow-hidden hover:border-brand-accent transition-colors relative"
                      style={{ backgroundColor: doorHex }}
                    >
                      <input
                        type="color"
                        value={doorHex.length === 7 ? doorHex : '#1F1F1F'}
                        onChange={e => setDoorHex(e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                      />
                    </label>
                    <input
                      type="text"
                      value={doorHex}
                      onChange={e => {
                        const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setDoorHex(v);
                      }}
                      maxLength={7}
                      placeholder="#RRGGBB"
                      className="w-28 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm font-mono"
                    />
                    <input
                      type="text"
                      value={doorName}
                      onChange={e => setDoorName(e.target.value)}
                      placeholder="Color name (optional)"
                      className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm"
                    />
                  </div>

                  {/* Quick door presets */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { name: 'Tricorn Black',  hex: '#1F1F1F' },
                      { name: 'Hale Navy',      hex: '#3B4A5A' },
                      { name: 'Iron Ore',       hex: '#3C3936' },
                      { name: 'Forest Green',   hex: '#3A5240' },
                      { name: 'Crisp White',    hex: '#F5F5F0' },
                      { name: 'Brick Red',      hex: '#7C2D2A' },
                    ].map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => { setDoorName(p.name); setDoorHex(p.hex); }}
                        disabled={isPaintingDoor}
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-brand-accent transition-all disabled:opacity-50"
                      >
                        <span className="inline-block w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.hex }} />
                        {p.name}
                      </button>
                    ))}
                  </div>

                  {doorError && <p className="text-xs text-red-600 mb-2">{doorError}</p>}

                  <button
                    onClick={handleApplyDoor}
                    disabled={isPaintingDoor || !doorHex || isTweaking || isPaintingTrim}
                    className="w-full py-2.5 bg-brand-dark hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isPaintingDoor ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white spinner" />
                        Painting doors…
                      </>
                    ) : (
                      <>Apply Door Color</>
                    )}
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-slate-300 text-center">
                  Each change builds on the current image — you can layer wall + trim + door colors.
                </p>
              </div>
            </div>

            {/* ════════════════════════════════════════
                TWEAK / REFINE THE RESULT
            ════════════════════════════════════════ */}
            <div className="w-full max-w-2xl mt-2">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-light flex-shrink-0 flex items-center justify-center">
                    <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-brand-dark leading-tight">Not quite right? Tweak it.</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Tell the AI what to adjust and we'll refine the image without starting over.
                    </p>
                  </div>
                </div>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    'Also paint the wall to the left of the fireplace',
                    'Make the color a little lighter',
                    'Make the color a little darker',
                    'Paint the ceiling white',
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setTweakPrompt(suggestion)}
                      disabled={isTweaking}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-brand-accent hover:text-brand-accent hover:bg-brand-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <textarea
                  value={tweakPrompt}
                  onChange={e => setTweakPrompt(e.target.value)}
                  placeholder="Describe what to change (e.g., 'Paint the wall to the left of the fireplace too')"
                  rows={2}
                  disabled={isTweaking}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm resize-none disabled:opacity-60"
                />

                {tweakError && (
                  <p className="mt-2 text-xs text-red-600 leading-relaxed">{tweakError}</p>
                )}

                <button
                  onClick={handleTweak}
                  disabled={isTweaking || !tweakPrompt.trim()}
                  className="mt-3 w-full py-3 bg-brand-accent hover:bg-brand-accenthover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isTweaking ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white spinner" />
                      Applying tweak…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Apply Tweak
                    </>
                  )}
                </button>

                <p className="mt-2 text-[11px] text-slate-300 text-center">
                  Tweaks build on the current image. Keep refining until it looks right.
                </p>
              </div>
            </div>

            {/* ════════════════════════════════════════
                LEAD CAPTURE FORM
            ════════════════════════════════════════ */}
            <div ref={formRef} className="w-full max-w-xl mt-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">

                {/* Form header */}
                <div className="bg-brand-dark px-8 py-8 text-center">
                  <h3 className="text-2xl font-black text-white mb-2">Love what you see?</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Request a free, no-obligation estimate from {COMPANY_NAME}.<br />
                    We'll bring actual paint chips to match your exact color.
                  </p>
                </div>

                <form onSubmit={handleFormSubmit} className="p-7 sm:p-8 space-y-5">

                  {/* Selected color summary — pre-filled, read-only */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div
                      className="w-12 h-12 rounded-xl shadow-sm border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: hexCode }}
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Color</p>
                      <p className="font-bold text-brand-dark text-sm truncate">{colorName}</p>
                      <p className="text-xs text-slate-500">{selectedBrand} · {hexCode}</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5">
                      Your Name <span className="text-brand-accent">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5">
                      Email Address <span className="text-brand-accent">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5">
                      Anything else? <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      placeholder="Which rooms? Rough square footage? Any other details…"
                      rows={3}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-brand-dark placeholder:text-slate-300 focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none shadow-sm resize-none"
                    />
                  </div>

                  {/* Submit / success */}
                  {submitStatus === 'success' ? (
                    <div className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center">
                      <div className="text-4xl mb-3">🎉</div>
                      <h4 className="font-bold text-green-800 text-lg">Request Sent!</h4>
                      <p className="text-green-700 text-sm mt-1 leading-relaxed">
                        We'll be in touch soon to schedule your free estimate.
                      </p>
                      <p className="text-green-500 text-xs mt-3">— {COMPANY_NAME}</p>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !formName.trim() || !formEmail.trim()}
                      className="w-full py-4 bg-brand-accent hover:bg-brand-accenthover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base shadow-md transition-all"
                    >
                      {isSubmitting ? 'Sending…' : 'Send My Free Estimate Request'}
                    </button>
                  )}

                  {submitError && (
                    <p className="text-red-600 text-xs text-center leading-relaxed">{submitError}</p>
                  )}

                  <p className="text-xs text-center text-slate-300 leading-relaxed">
                    No spam, ever. We'll only contact you about your painting estimate.
                  </p>
                </form>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="mt-16 py-10 border-t border-slate-200 text-center">
        <img
          src="/ChatGPT_Image_May_14,_2026,_03_35_04_PM.png"
          alt="PaintStage Pro"
          className="h-24 w-auto object-contain mx-auto mb-4 opacity-80"
        />
        <p className="text-slate-400 text-xs">
          AI color visualizations are approximate previews. Actual results may vary based on lighting, surface texture, and paint sheen.
        </p>
        <p className="text-slate-300 text-xs mt-2">Powered by <a href="https://AxiiumSystems.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 transition-colors underline underline-offset-2">Axiium Systems</a></p>
      </footer>

    </div>
  );
}
