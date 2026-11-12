'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ProgressRing — used for attendance %, credit hours, course completion.
 * Conic ring + glow arc. No dependencies.
 */
export function ProgressRing({
  value,
  max = 100,
  size = 120,
  stroke = 9,
  label,
  caption,
  tone = 'primary',
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  caption?: string;
  tone?: 'primary' | 'ok' | 'warn' | 'danger' | 'violet';
  className?: string;
}) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  const tones: Record<string, { from: string; to: string; glow: string }> = {
    primary: { from: '#60A5FA', to: '#2563EB', glow: 'rgba(59,130,246,.55)' },
    violet: { from: '#C4B5FD', to: '#7C3AED', glow: 'rgba(139,92,246,.55)' },
    ok: { from: '#6EE7B7', to: '#059669', glow: 'rgba(16,185,129,.55)' },
    warn: { from: '#FCD34D', to: '#D97706', glow: 'rgba(245,158,11,.55)' },
    danger: { from: '#FCA5A5', to: '#DC2626', glow: 'rgba(239,68,68,.55)' },
  };
  const t = tones[tone];
  const gradientId = React.useId().replace(/:/g, '');

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={t.from} />
              <stop offset="100%" stopColor={t.to} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,.07)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            style={{
              filter: `drop-shadow(0 0 8px ${t.glow})`,
              transition: 'stroke-dasharray .6s cubic-bezier(.22,1,.36,1)',
            }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-lg font-extrabold leading-none text-obs-text">
              {label ?? `${Math.round(pct)}%`}
            </p>
            {caption ? <p className="mt-1 text-[9.5px] font-semibold text-obs-text3">{caption}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
