'use client';

/**
 * 🧿 رادار الحرمان — لكل مادة: كم غياب باقي قبل المخاطرة بالحرمان
 * محسوب من سياسة الأدمن (النسبة + احتساب التأخير) نفس حاسبة الداشبورد.
 */
import * as React from 'react';
import { Radar, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from './EmptyState';
import { RowsSkeleton } from './Skeletons';

export type RadarRow = {
  code: string;
  name: string;
  totalLectures: number;
  present: number;
  late: number;
  status: 'SAFE' | 'WARNING' | 'DENIED';
  attendancePct: number | null;
};

export type RadarPolicy = {
  attendanceThreshold: number;
  lateCountsAs: number;
};

/** كم غياب فعّالي باقي لهاد مادة (نفس منطق الداشبورد لكل مادة) */
export function absencesLeft(row: RadarRow, policy: RadarPolicy): number | null {
  const attended = row.totalLectures;
  if (attended <= 0) return null;
  const lateWeight = policy.lateCountsAs > 0 ? 0.5 : 0;
  const missed = attended - row.present - row.late * lateWeight;
  const allowed = Math.floor(attended * (1 - policy.attendanceThreshold / 100));
  return Math.max(0, allowed - Math.ceil(missed - 1e-9));
}

const STATUS_META = {
  SAFE: { icon: ShieldCheck, cls: 'border-brand-500/30 bg-brand-500/[0.08] text-brand-700', label: 'آمنة' },
  WARNING: { icon: ShieldAlert, cls: 'border-gold-400/40 bg-gold-400/[0.10] text-gold-800', label: 'قريبة من الخط' },
  DENIED: { icon: ShieldX, cls: 'border-ember-500/40 bg-ember-500/[0.09] text-ember-600 animate-pulse-ring', label: 'منطقة حرمان' },
} as const;

export function AbsenceRadar({
  rows,
  policy,
  loading,
}: {
  rows: RadarRow[];
  policy: RadarPolicy | null;
  loading?: boolean;
}) {
  const monitored = rows.filter((row) => row.totalLectures > 0);
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>رادار الحرمان</CardTitle>
        {policy ? (
          <span className="flex items-center gap-1.5 rounded-full border border-brand-900/10 bg-white/70 px-2.5 py-1 text-[10px] font-bold text-ink-500">
            <Radar className="h-3 w-3 text-brand-600" />
            سياسة الحضور ≥ {policy.attendanceThreshold}%
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading ? (
          <RowsSkeleton rows={3} />
        ) : monitored.length === 0 ? (
          <EmptyState
            kind="lectures"
            compact
            title="لسه مفيش محاضرات مسجلة للرصد"
            sub="أول ما تبدأ محاضرات مقرراتك يظهر رداره هنا"
          />
        ) : (
          <div className="space-y-2.5">
            {monitored.map((row) => {
              const left = policy ? absencesLeft(row, policy) : null;
              const meta = STATUS_META[row.status];
              const Icon = meta.icon;
              return (
                <div
                  key={row.code}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition ${meta.cls} ${row.status === 'DENIED' ? 'bg-ember-500/[0.06]' : ''}`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.cls} !bg-white/70`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900">{row.name}</p>
                    <p className="text-[10.5px] text-ink-400" dir="ltr">
                      {row.code} · {Math.round(row.attendancePct ?? 0)}%
                    </p>
                  </div>
                  {row.status !== 'DENIED' && left !== null ? (
                    <span className="shrink-0 rounded-xl border border-brand-900/10 bg-white/70 px-2.5 py-1 text-[11px] font-bold text-ink-700">
                      باقي <span className={left <= 2 ? 'text-ember-600' : 'text-brand-700'} dir="ltr">{left}</span> غياب
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-xl bg-ember-500/[0.10] px-2.5 py-1 text-[11px] font-bold text-ember-600">
                      {meta.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
