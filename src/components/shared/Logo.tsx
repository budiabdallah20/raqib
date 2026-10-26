'use client';

import * as React from 'react';

type Tone = 'light' | 'ink' | 'gold';

type MarkProps = {
  className?: string;
  tone?: Tone;
  framed?: boolean;
};

const TILE: Record<Tone, [string, string, string]> = {
  light: ['#2a360c', '#84cc16', '#bef264'],
  ink: ['#0c1006', '#1a2408', '#2c3d10'],
  gold: ['#8a6424', '#c8a24b', '#f0dfa6'],
};

const INK: Record<Tone, string> = {
  light: '#f8fbf8',
  ink: '#eef6f1',
  gold: '#102a22',
};

/**
 * Raqib's mark: an abstract R drawn as one continuous academic ribbon,
 * orbited by a gold radar sweep. The squircle keeps it sharp at favicon
 * sizes while the ribbon stays legible on signage.
 */
export function LogoMark({ className, tone = 'light', framed = true }: MarkProps) {
  const [tileStart, tileMid, tileEnd] = TILE[tone];
  const ink = INK[tone];
  const id = tone;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="رقيب"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`raqib-tile-${id}`} x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor={tileStart} />
          <stop offset=".55" stopColor={tileMid} />
          <stop offset="1" stopColor={tileEnd} />
        </linearGradient>
        <linearGradient id={`raqib-ribbon-${id}`} x1="20" y1="16" x2="44" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor={ink} />
          <stop offset="1" stopColor={ink} stopOpacity=".82" />
        </linearGradient>
        <linearGradient id={`raqib-gold-${id}`} x1="28" y1="36" x2="49" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b8892f" />
          <stop offset=".55" stopColor="#f0dfa6" />
          <stop offset="1" stopColor="#c8a24b" />
        </linearGradient>
        <radialGradient id={`raqib-glow-${id}`} cx="0" cy="0" r="1" gradientTransform="translate(21 14) rotate(48) scale(40)">
          <stop stopColor="#ffffff" stopOpacity=".24" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {framed && (
        <>
          <rect x="1.5" y="1.5" width="61" height="61" rx="19" fill={`url(#raqib-tile-${id})`} />
          <rect x="1.5" y="1.5" width="61" height="61" rx="19" fill={`url(#raqib-glow-${id})`} />
          <rect x="1.5" y="1.5" width="61" height="61" rx="19" stroke="#ffffff" strokeOpacity=".18" />
          <rect x="4.5" y="4.5" width="55" height="55" rx="16" stroke="#ffffff" strokeOpacity=".09" />
        </>
      )}

      {!framed && (
        <circle cx="32" cy="32" r="29.5" fill={`url(#raqib-tile-${id})`} />
      )}

      <ellipse
        cx="32"
        cy="32"
        rx="24.5"
        ry="11.6"
        transform="rotate(-34 32 32)"
        fill="none"
        stroke={`url(#raqib-gold-${id})`}
        strokeWidth="1.25"
        opacity=".72"
      />
      <circle cx="50.2" cy="17.6" r="2.05" fill="#f0dfa6" />
      <circle cx="50.2" cy="17.6" r="3.6" fill="none" stroke="#f0dfa6" strokeOpacity=".32" strokeWidth=".9" />

      <path
        d="M22.4 47V17.8h10.9c6.5 0 10.7 3.8 10.7 9.5 0 5.7-4.2 9.6-10.7 9.6H22.4"
        fill="none"
        stroke={`url(#raqib-ribbon-${id})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33.1 37.3 45.2 47"
        fill="none"
        stroke={`url(#raqib-gold-${id})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path d="M22.4 23.4h9.8" stroke={ink} strokeOpacity=".22" strokeWidth="1.1" strokeLinecap="round" />

      <path d="M51 45.5v3.5M49.25 47.25h3.5" stroke="#f0dfa6" strokeOpacity=".55" strokeWidth="1" strokeLinecap="round" />
      <path d="M13 18.5v-3.5M11.25 16.75h3.5" stroke={ink} strokeOpacity=".24" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** Compact tile for dense chrome / favicon-like contexts. */
export function LogoMarkLite({ className }: { className?: string }) {
  return <LogoMark className={className} tone="light" framed />;
}

type LogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  tone?: Tone;
  showWordmark?: boolean;
  stacked?: boolean;
  showEnglish?: boolean;
};

const WORD: Record<Tone, string> = {
  light: 'text-ink-950',
  ink: 'text-ink-950',
  gold: 'text-gold-gradient',
};

export function Logo({
  className = '',
  markClassName = 'h-10 w-10',
  wordmarkClassName = '',
  tone = 'light',
  showWordmark = true,
  stacked = false,
  showEnglish = true,
}: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${stacked ? 'flex-col items-start gap-1.5' : ''} ${className}`}
      aria-label="رقيب — RAQIB"
    >
      <LogoMark className={`${markClassName} shrink-0 drop-shadow-[0_6px_18px_rgba(163,230,53,0.28)]`} tone={tone} />
      {showWordmark && (
        <span className={`flex flex-col ${stacked ? 'items-start' : 'items-start leading-none'} ${wordmarkClassName}`}>
          <span className={`font-display text-[1.42rem] font-bold leading-none tracking-[-0.03em] ${WORD[tone]}`}>
            رقيب
          </span>
          {showEnglish && (
            <span className="mt-1 flex items-center gap-1.5 font-latin text-[0.52rem] font-semibold uppercase tracking-[0.34em] text-ink-500/80">
              RAQIB
              <span className="inline-block h-1 w-1 rounded-full bg-gold-500" />
            </span>
          )}
        </span>
      )}
    </span>
  );
}
