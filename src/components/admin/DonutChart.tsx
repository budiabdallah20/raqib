'use client';

import * as React from 'react';

type Slice = { label: string; count: number; color: string };

/** مخطط دائري يدوي — segments عبر conic-gradient في CSS بدون مكتبات */
export function DonutChart({ slices, size = 168 }: { slices: Slice[]; size?: number }) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  let cursor = 0;
  const stops = slices.map((s) => {
    const from = (cursor / total) * 360;
    cursor += s.count;
    const to = total === 0 ? 0 : (cursor / total) * 360;
    return `${s.color} ${from}deg ${to}deg`;
  });
  const gradient = total > 0 ? `conic-gradient(${stops.join(', ')})` : 'rgba(20,121,95,0.12)';

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div
        className="relative grid place-items-center rounded-full"
        style={{ width: size, height: size }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: gradient,
            WebkitMask: 'radial-gradient(circle, transparent 55%, black 56%)',
            mask: 'radial-gradient(circle, transparent 55%, black 56%)',
          }}
        />
        {total > 0 ? (
          <span className="relative font-display text-xl font-bold text-ink-950">
            {total}
            <span className="block text-center text-[10px] font-normal text-ink-400">طالب</span>
          </span>
        ) : (
          <span className="relative text-xs text-ink-400">لا بيانات</span>
        )}
      </div>
      <ul className="space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
            <span className="text-ink-500">الفرقة {s.label}</span>
            <span className="font-bold text-ink-900">{s.count}</span>
            <span className="text-xs text-ink-400">
              {total > 0 ? `${Math.round((s.count / total) * 100)}%` : '0%'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
