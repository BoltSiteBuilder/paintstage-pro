import React, { useCallback, useEffect, useRef, useState } from 'react';

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Tailwind aspect ratio class for the frame, e.g. "aspect-[4/5]". */
  aspectClassName?: string;
  className?: string;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Draggable before/after comparison. Pointer, touch and keyboard driven.
 * Standalone on purpose — the studio has its own slider and the two should be
 * free to diverge.
 */
const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  before,
  after,
  beforeAlt,
  afterAlt,
  beforeLabel = 'Before',
  afterLabel = 'After',
  aspectClassName = 'aspect-[4/5]',
  className = '',
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(64);
  const [dragging, setDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Settle to the middle once mounted so the control reads as draggable.
  useEffect(() => {
    const timer = window.setTimeout(() => setPosition(50), 650);
    return () => window.clearTimeout(timer);
  }, []);

  const positionFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0) return;
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setHasInteracted(true);
    positionFromClientX(event.clientX);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    positionFromClientX(event.clientX);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const stride = event.shiftKey ? 10 : 3;
    let next: number | null = null;
    if (event.key === 'ArrowLeft') next = position - stride;
    if (event.key === 'ArrowRight') next = position + stride;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = 100;
    if (next === null) return;
    event.preventDefault();
    setHasInteracted(true);
    setPosition(clamp(next));
  };

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`relative ${aspectClassName} w-full overflow-hidden rounded-3xl bg-slate-200 shadow-2xl ring-1 ring-black/5 select-none touch-none cursor-ew-resize ${className}`}
    >
      <img
        src={after}
        alt={afterAlt}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 ${100 - position}% 0 0)`,
          transition: dragging ? 'none' : 'clip-path 550ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <img
          src={before}
          alt={beforeAlt}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-brand-dark/85 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-brand-accent px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
        {afterLabel}
      </span>

      {/* Divider + handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 bg-white shadow-[0_0_18px_rgba(0,0,0,0.35)]"
        style={{
          left: `${position}%`,
          transition: dragging ? 'none' : 'left 550ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Reveal the painted version"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% before, ${100 - Math.round(position)}% after`}
        onKeyDown={onKeyDown}
        className="absolute top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-black/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/60"
        style={{
          left: `${position}%`,
          transition: dragging ? 'none' : 'left 550ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <svg className="h-5 w-5 text-brand-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l-5 6 5 6M15 6l5 6-5 6" />
        </svg>
      </div>

      {!hasInteracted && (
        <span className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          Drag to compare
        </span>
      )}
    </div>
  );
};

export default BeforeAfterSlider;
