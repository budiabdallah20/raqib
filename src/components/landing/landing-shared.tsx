'use client';

/**
 * Shared landing primitives — types, constants, hooks and small leaf components.
 * Split out of the former LandingPage monolith (perf refactor, Phase 1):
 * sections import only what they need, and periodic state (metrics polling,
 * clocks, scroll flags) lives in small leaves instead of the page root.
 */

import * as React from 'react';
import {
  BarChart3,
  BellRing,
  BookOpen,
  Calendar,
  Clock3,
  Fingerprint,
  GraduationCap,
  LayoutDashboard,
  QrCode,
  ScanLine,
  Zap,
} from 'lucide-react';

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const WORD_LETTERS = ['ر', 'ق', 'ي', 'ب'] as const;

export const NAV_ANCHORS = [
  { href: '#stack', key: 'stack' },
  { href: '#features', key: 'features' },
  { href: '#how', key: 'how' },
  { href: '#roles', key: 'roles' },
] as const;

export const FEATURE_ICONS = [QrCode, LayoutDashboard, BarChart3, BellRing, ScanLine, GraduationCap, Calendar, BookOpen];

export const STEP_ICONS = [Fingerprint, ScanLine, Zap];

export const PORTAL_ICON_COMPONENTS = {
  student: GraduationCap,
  professor: BookOpen,
  admin: LayoutDashboard,
} as const;

export const ROLE_META = [
  { key: 'student' as const, accent: '#FFB45C', ring: '#FFB45C', tint: 'from-cyan-500/16', chip: 'border-cyan-400/40 bg-cyan-500/[0.09] text-cyan-200' },
  { key: 'professor' as const, accent: '#c8a96b', ring: '#FFB45C', tint: 'from-amber-500/16', chip: 'border-amber-400/40 bg-amber-500/[0.09] text-amber-200' },
  { key: 'admin' as const, accent: '#a69af5', ring: '#a69af5', tint: 'from-violet-500/16', chip: 'border-violet-400/40 bg-violet-500/[0.09] text-violet-200' },
] as const;

export type Metrics = {
  students: number;
  professors: number;
  courses: number;
  lectures: number;
  scans: number;
  attendancePct: number;
};

export type PublicMetrics = {
  metrics: Metrics;
  departments?: string[];
  updatedAt?: string;
  platformStatus?: 'ONLINE' | 'MAINTENANCE';
  dbAvailable?: boolean;
};

/** CSS-driven reveal (globals.css .stagger-item) — no per-element JS observers. */
export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 26 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' as const },
    transition: { duration: 0.72, delay, ease: EASE },
  };
}

/* ------------------------------------------------------------------ */
/* Isolated data hooks — keep polling/scroll state out of page roots  */
/* ------------------------------------------------------------------ */

/** Polls public metrics in a leaf component only. Never mounted at page root. */
export function usePublicMetrics(intervalMs = 30_000) {
  const [metrics, setMetrics] = React.useState<PublicMetrics | null>(null);

  React.useEffect(() => {
    let alive = true;
    const load = () => {
      fetch('/api/public/metrics', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('metrics'))))
        .then((data: PublicMetrics) => {
          if (alive) setMetrics(data);
        })
        .catch(() => {
          /* graceful: keep last values; UI shows dashes until next tick */
        });
    };
    load();
    const id = window.setInterval(load, intervalMs);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return metrics;
}

/** rAF-throttled boolean scroll flag — renders only on threshold crossings. */
export function useScrollFlag(threshold: number) {
  const [flag, setFlag] = React.useState(false);

  React.useEffect(() => {
    let raf = 0;
    let queued = false;
    const update = () => {
      queued = false;
      setFlag(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return flag;
}

/* ------------------------------------------------------------------ */
/* Small leaf components                                              */
/* ------------------------------------------------------------------ */

export function LetterMedallion({ char, compact = false }: { char: string; compact?: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 select-none items-center justify-center rounded-[14px] border border-gold-500/35 bg-[linear-gradient(145deg,#fffdf6,#f7edcf)] font-display font-extrabold text-gold-700 shadow-[0_10px_26px_-12px_rgba(200,162,75,.5),inset_0_1px_0_rgba(255,255,255,.85)] ${
        compact ? 'h-8 w-8 rounded-[11px] text-[15px]' : 'h-11 w-11 text-[20px]'
      }`}
      title={`حرف ${char} — كلمة رقيب`}
    >
      {char}
      <span aria-hidden className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-gold-500/80" />
    </span>
  );
}

/** Counts up to `value` with one rAF tween per change — reduced-motion aware. */
export function NumberTicker({
  value,
  decimals = 0,
  suffix = '',
}: {
  value: number | null | undefined;
  decimals?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = React.useState(0);
  const fromRef = React.useRef(0);

  React.useEffect(() => {
    if (value == null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    if (from === value) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const duration = 900;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = window.requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [value]);

  if (value == null) return <span className="text-[#b8abb2]/50">—</span>;
  const text = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('en-US');
  return (
    <span className="tabular-nums">
      {text}
      {suffix && <span className="text-[0.55em] font-semibold text-[#FFB45C]/80">{suffix}</span>}
    </span>
  );
}

const QR_SIZE = 21;

function qrModuleOn(row: number, col: number) {
  const finderZones = [
    [0, 0],
    [0, QR_SIZE - 7],
    [QR_SIZE - 7, 0],
  ];
  for (const [r0, c0] of finderZones) {
    const dr = row - r0;
    const dc = col - c0;
    if (dr >= 0 && dr < 7 && dc >= 0 && dc < 7) {
      const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
      if (ring === 3) return true;
      if (ring <= 1) return true;
      return false;
    }
  }
  if (row < 8 && col < 8) return false;
  if (row < 8 && col > QR_SIZE - 9) return false;
  if (row > QR_SIZE - 9 && col < 8) return false;
  const mixed = (row * 17 + col * 31 + row * col * 7 + (row ^ col) * 13) % 29;
  return mixed < 13 || (row * 3 + col * 5) % 11 === 0;
}

const QR_CELLS = Array.from({ length: QR_SIZE * QR_SIZE }, (_, i) => {
  const row = Math.floor(i / QR_SIZE);
  const col = i % QR_SIZE;
  return { row, col, on: qrModuleOn(row, col) };
});

export function QrArt({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative grid aspect-square w-full rounded-[14px] bg-white p-2.5 shadow-[0_18px_45px_-24px_rgba(8,22,17,.45)] ${className}`}
      style={{ gridTemplateColumns: `repeat(${QR_SIZE}, minmax(0, 1fr))` }}
      role="img"
      aria-label="رمز حضور رقيب"
    >
      {QR_CELLS.map((cell) => (
        <span
          key={`${cell.row}-${cell.col}`}
          className={`aspect-square rounded-[1.5px] ${cell.on ? 'bg-[#101608]' : 'bg-transparent'}`}
        />
      ))}
      <span aria-hidden className="pointer-events-none absolute inset-2 rounded-[10px] border border-brand-500/0" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-2 h-8 animate-scan rounded-full bg-[linear-gradient(180deg,rgba(103,216,234,0),rgba(103,216,234,.5),rgba(200,162,75,.2),rgba(103,216,234,0))] blur-[1px]"
      />
      <span aria-hidden className="pointer-events-none absolute left-1.5 top-1.5 h-4 w-4 rounded-tl-[6px] border-l-2 border-t-2 border-gold-500/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-1.5 right-1.5 h-4 w-4 rounded-br-[6px] border-b-2 border-r-2 border-gold-500/70" />
    </div>
  );
}

export function ClockChip() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F28C28]/30 bg-[#F28C28]/[0.09] px-2.5 py-1.5 font-latin text-[10px] font-semibold tracking-[0.12em] text-gold-200 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-md">
      <Clock3 className="h-3 w-3 text-[#FFB45C]" />
      <span dir="ltr">{now ? now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
      <span className="h-1 w-1 rounded-full bg-[#FFB45C]/80" />
    </span>
  );
}

export function DateChip() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => setNow(new Date()), []);
  return (
    <span className="hidden items-center gap-1.5 rounded-full border border-[#F28C28]/25 bg-[#F28C28]/[0.07] px-2.5 py-1.5 font-latin text-[10px] font-semibold tracking-[0.12em] text-[#FFF8F0] backdrop-blur-md 2xl:inline-flex">
      <Calendar className="h-3 w-3 text-[#FFB45C]" />
      <span dir="ltr">{now ? now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}</span>
    </span>
  );
}

export type StatusTone = 'ONLINE' | 'MAINTENANCE' | 'OFFLINE' | 'UNKNOWN';

const STATUS_TONE_META: Record<StatusTone, { dot: string; ping: boolean; dark: string; light: string }> = {
  ONLINE: { dot: 'bg-brand-500', ping: true, dark: 'border-brand-300/20 bg-white/[0.06] text-brand-100', light: 'border-brand-500/20 bg-white/60 text-brand-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]' },
  MAINTENANCE: { dot: 'bg-gold-500', ping: false, dark: 'border-gold-400/25 bg-white/[0.06] text-gold-200', light: 'border-gold-500/25 bg-white/60 text-gold-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]' },
  OFFLINE: { dot: 'bg-ember-500', ping: false, dark: 'border-ember-400/25 bg-white/[0.06] text-ember-200', light: 'border-ember-500/25 bg-white/60 text-ember-600 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]' },
  UNKNOWN: { dot: 'bg-zinc-400', ping: false, dark: 'border-white/10 bg-white/[0.06] text-[#b8abb2]', light: 'border-white/15 bg-white/60 text-[#64748B] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]' },
};

export function StatusPill({
  dark = false,
  tone = 'UNKNOWN',
  label = '…',
}: {
  dark?: boolean;
  tone?: StatusTone;
  label?: string;
}) {
  const meta = STATUS_TONE_META[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-latin text-[9px] font-bold uppercase tracking-[0.18em] backdrop-blur-md ${
        dark ? meta.dark : meta.light
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {meta.ping && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${meta.dot}/60`} />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${meta.dot} ${meta.ping ? '' : 'opacity-90'}`} />
      </span>
      {label}
    </span>
  );
}

/* Re-export unused-looking icon imports that sections need by name */
export { BarChart3, BellRing, BookOpen, Fingerprint, LayoutDashboard, QrCode, ScanLine, Zap };
