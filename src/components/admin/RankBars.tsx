'use client';

import * as React from 'react';

type RankRow = {
  course: { code: string; name: string };
  presentCount: number;
  pct: number | null;
};

/** أعمدة أفقية بسيطة بـ CSS يدوي */
export function RankBars({ rows, tone = 'gold' }: { rows: RankRow[]; tone?: 'gold' | 'ember' }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-400">لا يوجد بيانات كافية بعد</p>;
  }
  const max = Math.max(1, ...rows.map((r) => r.pct ?? 0));
  const bar = tone === 'gold' ? 'bg-gold-sheen' : 'bg-ember-500/80';

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.course.code}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-ink-700">
              <span className="font-latin font-bold text-gold-700">{row.course.code}</span>
              {' — '}
              {row.course.name}
            </span>
            <span className="shrink-0 font-display font-bold text-ink-950">
              {row.pct === null ? '—' : `${row.pct}%`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-900/10">
            <div
              className={`h-full rounded-full ${bar}`}
              style={{ width: `${Math.round(((row.pct ?? 0) / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
