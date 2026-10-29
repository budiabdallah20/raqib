'use client';

/**
 * 💚 مؤشر الصحة الأكاديمية — درجة مركبة من 0..100:
 * حضور وزن ٥٠٪ + متوسط درجات المواد المكتملة وزن ٥٠٪ — مع مستويات مستقرة.
 */
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradientRing } from './MiniCharts';
import { AnimatedNumber, useCountUp } from './AnimatedNumber';

type Tier = 'excellent' | 'safe' | 'watch' | 'risk';

const TIER_META: Record<Tier, { label: string; emoji: string; hint: string; color: string; colorHex: string }> = {
  excellent: { label: 'أداء ممتاز', emoji: '🎓', hint: 'أنت في المنطقة الذهبية — حافظ على النبض ده', color: 'text-brand-700', colorHex: '#2c8f84' },
  safe: { label: 'منطقة آمنة', emoji: '🛡️', hint: 'أنت مستقر — لمسة إضافية ترفعك للممتاز', color: 'text-brand-600', colorHex: '#3aa69a' },
  watch: { label: 'تحت المراقبة', emoji: '🧭', hint: 'فيه فجوة استحقاق — الرادار تحت بيقول فين بالظبط', color: 'text-gold-700', colorHex: '#c8a24b' },
  risk: { label: 'خطر حرمان', emoji: '⚠️', hint: 'نسبة مقرراتك في المنطقة الحرجة — تحرك بسرعة', color: 'text-ember-600', colorHex: '#c84a5a' },
};

export function healthScore(attendancePct: number | null, gradesPct: number | null): number | null {
  if (attendancePct == null && gradesPct == null) return null;
  const att = attendancePct ?? gradesPct ?? 0;
  const grades = gradesPct ?? attendancePct ?? 0;
  return Math.round(att * 0.5 + grades * 0.5);
}

export function tierFor(score: number): Tier {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'safe';
  if (score >= 55) return 'watch';
  return 'risk';
}

export function HealthIndex({
  attendancePct,
  gradesPct,
}: {
  attendancePct: number | null;
  gradesPct: number | null;
}) {
  const score = healthScore(attendancePct, gradesPct);
  const tier = score === null ? null : tierFor(score);
  const meta = tier ? TIER_META[tier] : null;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>مؤشر الصحة الأكاديمية</CardTitle>
        <span className="flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/[0.07] px-2.5 py-1 text-[10px] font-bold text-brand-700">
          <Sparkles className="h-3 w-3" />
          حضور ٥٠٪ + درجات ٥٠٪
        </span>
      </CardHeader>
      <CardContent>
        {score === null || !meta ? (
          <p className="py-6 text-center text-sm text-ink-400">
            أول ما يتحسب حضور ودرجات هيظهر المؤشر
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-5">
            <GradientRing id="ahi" pct={score} from={meta.colorHex} to={tier === 'excellent' ? '#4db8ae' : meta.colorHex} size={128}>
              <AnimatedNumber value={score} className="font-display text-3xl font-black text-ink-950" />
              <span className="mt-0.5 text-[9px] font-bold text-ink-400">من 100</span>
            </GradientRing>
            <div className="min-w-[190px] flex-1 space-y-2.5">
              <motion.p
                key={tier}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`font-display text-xl font-bold ${meta.color}`}
              >
                {meta.label} {meta.emoji}
              </motion.p>
              <p className="text-xs leading-relaxed text-ink-500">{meta.hint}</p>
              <div className="space-y-1.5">
                <MetricRow label="حضور موزون" pct={attendancePct} />
                <MetricRow label="متوسط الدرجات" pct={gradesPct} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, pct }: { label: string; pct: number | null }) {
  const pulse = useCountUp(pct ?? 0);
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-24 shrink-0 font-bold text-ink-500">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-900/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-l from-brand-600 to-brand-400 transition-[width] duration-700"
          style={{ width: `${Math.max(2, pulse)}%` }}
        />
      </div>
      <span className="w-10 text-right font-bold text-ink-700" dir="ltr">
        {pct === null ? '—' : `${Math.round(pulse)}%`}
      </span>
    </div>
  );
}
