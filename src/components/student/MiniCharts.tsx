'use client';

/**
 * 📊 رسوم مصغّرة يدوية (بدون مكتبات) — أعمدة وخطوط SVG بألوان الهوية.
 */
import { cn } from '@/lib/utils';
import { useCountUp } from './AnimatedNumber';

export function MiniBars({
  items,
  showValue = true,
}: {
  items: { label: string; sub?: string; pct: number | null; tone?: 'brand' | 'gold' | 'ember' }[];
  showValue?: boolean;
}) {
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-ink-400">لا بيانات للعرض بعد</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const pct = Math.max(0, Math.min(100, item.pct ?? 0));
        const tone = item.tone ?? (pct >= 75 ? 'brand' : pct >= 60 ? 'gold' : 'ember');
        return (
          <div key={`${item.label}-${index}`} className="group">
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-bold text-ink-700">{item.label}</span>
                {item.sub ? <span className="shrink-0 text-ink-300">{item.sub}</span> : null}
              </span>
              {showValue ? (
                <span className={cn('shrink-0 font-bold', toneClassText(tone))} dir="ltr">
                  {item.pct === null ? '—' : `${String(Math.round(pct))}%`}
                </span>
              ) : null}
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-brand-900/[0.08]">
              <div
                className={cn(
                  'h-full rounded-full bg-gradient-to-l transition-[width] duration-700 ease-out',
                  tone === 'brand' && 'from-brand-600 to-brand-400',
                  tone === 'gold' && 'from-gold-600 to-gold-400',
                  tone === 'ember' && 'from-ember-700 to-ember-500',
                )}
                style={{ width: `${Math.max(2, pct)}%`, transitionDelay: `${index * 60}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function toneClassText(tone: 'brand' | 'gold' | 'ember') {
  if (tone === 'brand') return 'text-brand-700';
  if (tone === 'ember') return 'text-ember-600';
  return 'text-gold-800';
}

export function Sparkline({
  values,
  height = 40,
  className,
}: {
  values: number[];
  height?: number;
  className?: string;
}) {
  const valid = values.filter((v) => Number.isFinite(v));
  if (valid.length < 2) return null;
  const w = 100;
  const h = height;
  const pad = 4;
  const min = Math.min(...valid);
  const max = Math.max(...valid, min + 1);
  const xs = valid.map((_, i) => pad + (i * (w - 2 * pad)) / (valid.length - 1));
  const ys = valid.map((v) => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad));
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i]!.toFixed(1)}`).join(' ');
  const rising = ys[valid.length - 1]! <= ys[0]!;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn('w-full', className)} style={{ height }}>
      <path
        d={`${line} L${w - pad},${h} L${pad},${h} Z`}
        className={rising ? 'fill-brand-500/[0.10]' : 'fill-ember-500/[0.10]'}
      />
      <path
        d={line}
        fill="none"
        className={rising ? 'stroke-brand-500' : 'stroke-ember-500'}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** حلقة تقدم دائرية بمسار متدرج — تُستخدم في مؤشر الصحة والبومودورو */
export function GradientRing({
  pct,
  size = 128,
  stroke = 10,
  from,
  to,
  children,
  id,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  /** لون بداية التدرج (hex) */
  from: string;
  /** لون نهاية التدرج (hex) */
  to: string;
  children?: React.ReactNode;
  id: string;
}) {
  const animated = useCountUp(Math.max(0, Math.min(100, pct)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={to} />
            <stop offset="100%" stopColor={from} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-brand-900/[0.08]" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - animated / 100)}
          style={{ transition: 'stroke-dashoffset 120ms linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
