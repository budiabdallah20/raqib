'use client';

/** أنواع ومساعدات حاسبة المعدل التنبؤية */

import { cn } from '@/lib/utils';

export type GpaCourse = {
  code: string;
  name: string;
  creditHours: number;
  components: { quiz: number | null; work: number | null; midterm: number | null; final: number | null } | null;
  total: number | null;
  graded: boolean;
  complete: boolean;
};

export function toneOf(total: number) {
  if (total >= 75)
    return { cls: cn('border-brand-500/30 bg-brand-500/[0.10] text-brand-700'), tone: 'brand' as const };
  if (total >= 60)
    return { cls: cn('border-gold-400/40 bg-gold-400/[0.10] text-gold-800'), tone: 'gold' as const };
  return { cls: cn('border-ember-500/30 bg-ember-500/[0.08] text-ember-600'), tone: 'ember' as const };
}
