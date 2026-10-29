'use client';

import * as React from 'react';

/*
 * ماركة رقيب v3 — «RAQIB بالبلوك»:
 * كلمة RAQIB بحروف مدورة سميكة، والحرف الأخير B داخل بلوك صلب مُفرَّغ أبيض —
 * بدون أي شِعار جانبي (slogan). كحل ترابي (terracotta) هو لون العلامة الوحيد.
 * النسخة المختصرة (favicon/navbar صغير) = البلوك وحده.
 */

type Tone = 'ink' | 'light' | 'gold';

type MarkProps = {
  className?: string;
  tone?: Tone;
  framed?: boolean;
};

const TERRA = '#C4552F';

const LETTERS: Record<Tone, string> = {
  ink: TERRA,
  light: '#F7F1E3',
  gold: '#C8A24B',
};

const BLOCK: Record<Tone, string> = {
  ink: TERRA,
  light: TERRA,
  gold: '#C8A24B',
};

/* حرف B داخل البلوك — يُرسم بالأبيض عبر الأنساق كلها */
const BLOCK_B = (
  <>
    <path d="M25.5 46V18" stroke="#ffffff" strokeWidth="6.2" strokeLinecap="round" />
    <path
      d="M25.5 18h10a7 7 0 1 1 0 14h-10"
      stroke="#ffffff"
      strokeWidth="6.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M25.5 32h12a7 7 0 1 1 0 14h-12"
      stroke="#ffffff"
      strokeWidth="6.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
);

/** الحروف RAQI — خطوط سميكة بأطراف مدوّرة (لون حسب النبرة) */
const RAQI_PATHS = [
  'M8 15V49',
  'M8 15h14a11.5 11.5 0 1 1 0 23H8',
  'M22 38L32.5 49',
  'M50 49L60 15L70 49',
  'M54.5 35H65.5',
] as const;

/**
 * رمز رقيب المختصر: بلوك B صلب (أو B خطوط مفتوحة عند framed=false).
 * أبعاد ثابتة 64×64 ويُقاس بالكلاس.
 */
export function LogoMark({ className, tone = 'ink', framed = true }: MarkProps) {
  const blockColor = BLOCK[tone];

  if (!framed) {
    return (
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label="RAQIB"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          fill="none"
          stroke={LETTERS[tone]}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 48V16" />
          <path d="M20 16h11a7.5 7.5 0 1 1 0 15h-11" />
          <path d="M20 31h13a7.5 7.5 0 1 1 0 17h-13" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="RAQIB"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="4" width="56" height="56" rx="15" fill={blockColor} />
      {BLOCK_B}
    </svg>
  );
}

/** نسخة مدمجة للكروم الكثيف وحالات الأيفون/الفافيكون */
export function LogoMarkLite({ className }: { className?: string }) {
  return <LogoMark className={className} tone="ink" framed />;
}

/** الكلمة كاملة: RAQI حروف + بلوك B — مفردة SVG واحدة */
export function LogoWordmark({ className, tone = 'ink' }: { className?: string; tone?: Tone }) {
  const color = LETTERS[tone];
  return (
    <svg
      viewBox="0 0 190 64"
      role="img"
      aria-label="RAQIB"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fill="none"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {RAQI_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
        <circle cx="98" cy="31.5" r="16.5" />
        <path d="M106.5 43.5L114 50.5" />
        <path d="M128 15V49" />
      </g>
      <rect x="141" y="10" width="44" height="44" rx="12" fill={BLOCK[tone]} />
      <g stroke="#ffffff" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M154 44V20" />
        <path d="M154 20h7a6 6 0 1 1 0 12h-7" />
        <path d="M154 32h9.5a6.4 6.4 0 1 1 0 12.5h-9.5" />
      </g>
    </svg>
  );
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

export function Logo({
  className = '',
  markClassName = 'h-9 w-9',
  wordmarkClassName = 'h-3.5',
  tone = 'ink',
  showWordmark = true,
  stacked = false,
}: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${stacked ? 'flex-col gap-2' : ''} ${className}`}
      aria-label="RAQIB — رقيب"
    >
      <LogoMark className={`${markClassName} shrink-0`} tone={tone} />
      {showWordmark && (
        <LogoWordmark className={wordmarkClassName} tone={tone} />
      )}
    </span>
  );
}
