import * as React from 'react';

type GateMarkProps = {
  className?: string;
  tone?: 'gold' | 'ivory' | 'ink';
  decorative?: boolean;
};

const COLORS = { gold: '#C8A96B', ivory: '#F4EFE5', ink: '#111A26' } as const;

/** An original R monogram: reading arch, open aperture and forward knowledge path. */
export function AcademicGateMark({ className, tone = 'gold', decorative = false }: GateMarkProps) {
  const color = COLORS[tone];
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'رقيب — بوابة المعرفة'}
      aria-hidden={decorative || undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 59V26C7 13 17 5 32 5s25 8 25 21v33" stroke={color} strokeWidth="2" opacity=".72" />
      <path d="M14 59V27c0-10 7-16 18-16s18 6 18 16v32" stroke={color} strokeWidth="1" opacity=".42" />
      <path d="M23 53V23h13c6 0 10 4 10 10s-4 10-10 10H23m12 0 12 10" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 59h28" stroke={color} strokeWidth="2" opacity=".7" />
      <path d="M32 3v-3" stroke={color} strokeWidth="2" opacity=".6" />
    </svg>
  );
}

export function AcademicGateLogo({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <AcademicGateMark className={compact ? 'h-8 w-8' : 'h-11 w-11'} />
      {!compact && <span className="font-display text-xl font-black text-[var(--theater-ivory)]">رقيب</span>}
    </span>
  );
}
