'use client';

import * as React from 'react';

/*
 * ماركة رقيب الجديدة — «الختم الأكاديمي»:
 * درع وحيد بحدود ذهبية شامبانيا على بلاطة حبر داكنة،
 * بداخله عين مسح (aperture) بنقطة ذهبية — لغة «المراقب الواقي».
 * لا أخضر ليموني إطلاقًا: ذهب + حبر + كريمي فقط.
 */

type Tone = 'ink' | 'light' | 'gold';

type MarkProps = {
  className?: string;
  tone?: Tone;
  framed?: boolean;
};

const SURFACES: Record<
  Tone,
  { tile: [string, string]; stroke: string; shieldFill: string; guide: string; chip: string }
> = {
  ink: {
    tile: ['#243020', '#0d1107'],
    stroke: 'rgba(200,162,75,0.30)',
    shieldFill: 'rgba(200,162,75,0.10)',
    guide: '#c8a24b',
    chip: '#f0dfa6',
  },
  light: {
    tile: ['#fffdf5', '#f1e9d3'],
    stroke: 'rgba(136,99,44,0.35)',
    shieldFill: 'rgba(136,99,44,0.07)',
    guide: '#88632c',
    chip: '#88632c',
  },
  gold: {
    tile: ['#f0dfa6', '#c8a24b'],
    stroke: 'rgba(90,66,35,0.45)',
    shieldFill: 'rgba(90,66,35,0.10)',
    guide: '#5a4223',
    chip: '#5a4223',
  },
};

export function LogoMark({ className, tone = 'ink', framed = true }: MarkProps) {
  const s = SURFACES[tone];
  const uid = tone;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="رقيب"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`rqb-tile-${uid}`} x1="12" y1="4" x2="52" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor={s.tile[0]} />
          <stop offset="1" stopColor={s.tile[1]} />
        </linearGradient>
        <linearGradient id={`rqb-iris-${uid}`} x1="26" y1="26" x2="40" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4e6b6" />
          <stop offset=".5" stopColor="#d8b45a" />
          <stop offset="1" stopColor="#aa8137" />
        </linearGradient>
        <radialGradient id={`rqb-sheen-${uid}`} cx="0.5" cy="0" r="1" gradientTransform="translate(32 2) scale(34 26)">
          <stop stopColor="#ffffff" stopOpacity=".14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {framed ? (
        <>
          <rect x="1.5" y="1.5" width="61" height="61" rx="20" fill={`url(#rqb-tile-${uid})`} />
          <rect x="1.5" y="1.5" width="61" height="61" rx="20" fill={`url(#rqb-sheen-${uid})`} />
          <rect x="1.5" y="1.5" width="61" height="61" rx="20" stroke={s.stroke} />
          <rect x="5" y="5" width="54" height="54" rx="16.5" fill="none" stroke={s.stroke} strokeOpacity=".55" strokeDasharray="1.5 3.5" />
        </>
      ) : (
        <circle cx="32" cy="32" r="30" fill={`url(#rqb-tile-${uid})`} />
      )}

      {/* الدرع — حدود رمزية بذهب هادئ */}
      <path
        d="M32 11.5 50 18.2v14.1c0 10.6-7.5 17.4-18 20.7-10.5-3.3-18-10.1-18-20.7V18.2Z"
        fill={s.shieldFill}
        stroke={s.guide}
        strokeWidth="2.1"
        strokeLinejoin="round"
      />

      {/* خطوط مرافقة داخل الدرع (تلميع صامت) */}
      <path d="M24.8 21.5h14.4" stroke={s.guide} strokeOpacity=".38" strokeWidth="1" strokeLinecap="round" />
      <path d="M23.6 43.8c4.6 2.4 12.2 2.4 16.8 0" stroke={s.guide} strokeOpacity=".22" strokeWidth="1" strokeLinecap="round" />

      {/* العين — aperture للمسح والرصد */}
      <path
        d="M20.6 33.2c3.2-4.4 7-6.6 11.4-6.6s8.2 2.2 11.4 6.6c-3.2 4.4-7 6.6-11.4 6.6s-8.2-2.2-11.4-6.6Z"
        fill="none"
        stroke={s.guide}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="33.2" r="4.35" fill={`url(#rqb-iris-${uid})`} />
      <circle cx="30.6" cy="31.9" r="1.05" fill="#fbf6e6" fillOpacity=".9" />
      <circle cx="32" cy="33.2" r="6.4" fill="none" stroke={s.chip} strokeOpacity=".28" strokeWidth=".9" />

      {/* بريق ذهبي صغير أعلى الدرع */}
      <path
        d="M47.4 13.4l.62 1.78 1.78.62-1.78.62-.62 1.78-.62-1.78-1.78-.62 1.78-.62Z"
        fill="#f4e6b6"
        fillOpacity=".92"
      />
    </svg>
  );
}

/** نسخة مدمجة للكروم الكثيف وحالات الأيفون/الفافيكون */
export function LogoMarkLite({ className }: { className?: string }) {
  return <LogoMark className={className} tone="ink" framed />;
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
  ink: 'text-ink-950',
  light: 'text-ink-950',
  gold: 'text-gold-gradient',
};

export function Logo({
  className = '',
  markClassName = 'h-10 w-10',
  wordmarkClassName = '',
  tone = 'ink',
  showWordmark = true,
  stacked = false,
  showEnglish = true,
}: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${stacked ? 'flex-col items-start gap-1.5' : ''} ${className}`}
      aria-label="رقيب — RAQIB"
    >
      <LogoMark className={`${markClassName} shrink-0 drop-shadow-[0_6px_16px_rgba(111,84,34,0.22)]`} tone={tone} />
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
