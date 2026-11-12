'use client';

import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';

type Trend = 'up' | 'down' | 'flat';

const TREND_META: Record<Trend, { icon: LucideIcon; tone: string }> = {
  up: { icon: ArrowUpRight, tone: 'text-emerald-400' },
  down: { icon: ArrowDownRight, tone: 'text-rose-400' },
  flat: { icon: Minus, tone: 'text-obs-text3' },
};

export function StatTile({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  trend,
  trendLabel,
  tone = 'primary',
  shine = true,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  icon: LucideIcon;
  trend?: Trend;
  trendLabel?: string;
  tone?: 'primary' | 'violet' | 'cyan' | 'ok' | 'warn' | 'danger';
  shine?: boolean;
}) {
  const toneRing: Record<string, string> = {
    primary: 'from-blue-500/25 to-blue-500/0 text-blue-300',
    violet: 'from-violet-500/25 to-violet-500/0 text-violet-300',
    cyan: 'from-cyan-500/25 to-cyan-500/0 text-cyan-300',
    ok: 'from-emerald-500/25 to-emerald-500/0 text-emerald-300',
    warn: 'from-amber-500/25 to-amber-500/0 text-amber-300',
    danger: 'from-rose-500/25 to-rose-500/0 text-rose-300',
  };

  const meta = trend ? TREND_META[trend] : null;
  const TrendIcon = meta?.icon;

  return (
    <GlassCard spotlight shine={shine} className="min-h-[112px] p-4">
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold tracking-wide text-obs-text2">{label}</p>
          <p className="mt-2 flex items-baseline gap-1 font-display text-[26px] font-extrabold leading-none tracking-[-0.03em] text-obs-text">
            {value}
            {unit ? <span className="text-[11px] font-bold text-obs-text3">{unit}</span> : null}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {TrendIcon && meta ? (
              <span className={cn('inline-flex items-center gap-0.5 text-[10.5px] font-bold', meta.tone)}>
                <TrendIcon className="h-3 w-3" aria-hidden />
                {trendLabel}
              </span>
            ) : null}
            {hint ? <span className="truncate text-[10.5px] text-obs-text3">{hint}</span> : null}
          </div>
        </div>
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-white/10 bg-gradient-to-b',
            toneRing[tone],
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </GlassCard>
  );
}
