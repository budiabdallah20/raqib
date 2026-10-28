'use client';

import * as React from 'react';

/** مؤشر دائري (Radial Progress) — قيمة/حد أقصى مع نص في المنتصف */
export function RadialProgress({
  value,
  max = 4,
  size = 104,
  stroke = 9,
  tone = 'gold',
  valueText,
  labelText,
  className,
}: {
  value: number | null;
  max?: number;
  size?: number;
  stroke?: number;
  tone?: 'gold' | 'lime' | 'ember' | 'brand';
  valueText?: string;
  labelText?: string;
  className?: string;
}) {
  const fraction = value === null || max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const radius = (size - stroke) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * fraction;

  const toneColor =
    tone === 'lime'
      ? 'stroke-brand-500'
      : tone === 'ember'
        ? 'stroke-ember-500'
        : tone === 'brand'
          ? 'stroke-brand-500'
          : 'stroke-gold-400';

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className ?? ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={labelText ?? `${valueText ?? ''} من ${max}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-brand-900/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          className={`${toneColor} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-ink-950">{valueText ?? '—'}</span>
        {labelText ? <span className="mt-0.5 text-[10px] font-bold text-ink-400">{labelText}</span> : null}
      </div>
    </div>
  );
}
