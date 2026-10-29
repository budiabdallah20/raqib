'use client';

/**
 * 📉 سجل حضور الطالب الكامل — WP2
 * ملخص لكل مادة + فلترة + رسم شريطي بسيط + حالة سياسة الحرمان.
 */
import * as React from 'react';
import { StudentShell } from '@/components/student/StudentShell';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { MiniBars } from '@/components/student/MiniCharts';
import { RowsSkeleton } from '@/components/student/Skeletons';
import { motion } from 'framer-motion';

type Summary = {
  policy: { attendanceThreshold: number; maxAbsence: number; lateCountsAs: number };
  summary: {
    course: { id: string; code: string; name: string; englishName: string | null };
    present: number;
    late: number;
    totalLectures: number;
    attendancePct: number;
    status: 'SAFE' | 'WARNING' | 'DENIED';
    statusLabel: string;
  }[];
};

type RecordItem = {
  id: string;
  status: string;
  scannedAt: string;
  lecture: { title: string; location: string | null; startsAt: string; course: { name: string; code: string } };
};

const STATUS_BAR: Record<string, string> = {
  SAFE: 'from-brand-400 to-brand-600',
  WARNING: 'from-amber-400 to-amber-600',
  DENIED: 'from-rose-400 to-rose-600',
};
const STATUS_ICON = {
  SAFE: ShieldCheck,
  WARNING: ShieldAlert,
  DENIED: ShieldX,
};
const STATUS_COLOR: Record<string, string> = {
  SAFE: 'text-brand-700',
  WARNING: 'text-gold-800',
  DENIED: 'text-ember-600',
};

export default function StudentAttendancePage() {
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [records, setRecords] = React.useState<RecordItem[]>([]);
  const [filter, setFilter] = React.useState('ALL');
  const [error, setError] = React.useState('');
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      api<Summary>('/api/attendance/summary'),
      api<{ records: RecordItem[] }>('/api/attendance'),
    ])
      .then(([s, r]) => {
        setSummary(s);
        setRecords(r.records);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <StudentShell>
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-ink-950">سجلي في الحضور</h1>
        </div>
        <RowsSkeleton rows={4} />
      </StudentShell>
    );
  }

  const courses = summary?.summary ?? [];
  const filtered = filter === 'ALL' ? records : records.filter((r) => r.lecture.course.code === filter);
  const overall = courses.length
    ? Math.round((courses.reduce((s, c) => s + c.attendancePct, 0) / courses.length) * 10) / 10
    : 0;
  const denied = courses.filter((c) => c.status === 'DENIED').length;
  const warning = courses.filter((c) => c.status === 'WARNING').length;
  const bars = courses
    .filter((c) => c.totalLectures > 0)
    .map((c) => ({ label: c.course.code, sub: c.course.name, pct: c.attendancePct }));

  return (
    <StudentShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-950">سجلي في الحضور</h1>
        <p className="mt-1 text-sm text-ink-500">
          الإنذار عند أقل من {summary?.policy.attendanceThreshold}% · الحرمان عند تجاوز غياب {summary?.policy.maxAbsence}% · التأخير = {summary?.policy.lateCountsAs} حاضر
        </p>
      </div>

      {error && <p className="mb-4 rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-4 py-3 text-sm text-ember-600">{error}</p>}

      {/* الملخص العام */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gold-500/20 bg-gold-500/[0.06] p-5">
          <p className="text-xs text-ink-400">معدل حضوري العام</p>
          <p className="font-display text-3xl font-extrabold text-gold-700">{overall}%</p>
        </div>
        <div className="rounded-2xl border border-brand-500/15 bg-brand-500/[0.05] p-5">
          <p className="text-xs text-ink-400">مقررات آمنة</p>
          <p className="font-display text-3xl font-extrabold text-brand-700">{courses.length - warning - denied}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-5">
          <p className="text-xs text-ink-400">تحت الإنذار</p>
          <p className="font-display text-3xl font-extrabold text-gold-800">{warning}</p>
        </div>
        <div className="rounded-2xl border border-ember-500/15 bg-ember-500/[0.05] p-5">
          <p className="text-xs text-ink-400">محروم</p>
          <p className="font-display text-3xl font-extrabold text-ember-600">{denied}</p>
        </div>
      </div>

      {/* أعمدة الحضور السريعة بالمقرر */}
      {bars.length ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="mb-8">
            <CardContent className="p-5">
              <p className="mb-3 text-xs font-bold text-ink-500">نسبة حضورك بالمقرر — بنظرة واحدة</p>
              <MiniBars items={bars} />
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* الملخص لكل مادة */}
      <div className="mb-8 grid gap-3 md:grid-cols-2">
        {courses.map((c) => {
          const Icon = STATUS_ICON[c.status];
          return (
            <Card key={c.course.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.course.code} — {c.course.name}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {c.present} حاضر · {c.late} متأخر · {c.totalLectures} محاضرة
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs font-bold ${STATUS_COLOR[c.status]}`}>
                      <Icon className="h-3.5 w-3.5" /> {c.statusLabel}
                    </span>
                    <span className="font-display text-xl font-extrabold text-ink-900">{c.attendancePct}%</span>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                  <div
                    className={`h-full rounded-full bg-gradient-to-l ${STATUS_BAR[c.status]}`}
                    style={{ width: `${Math.min(100, c.attendancePct)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* فلترة الماده */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-400">فلترة بالمادة:</span>
        <button
          onClick={() => setFilter('ALL')}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === 'ALL' ? 'bg-gold-500 text-black' : 'bg-white/60 text-ink-500 hover:bg-brand-500/10'}`}
        >
          الكل
        </button>
        {courses.map((c) => (
          <button
            key={c.course.id}
            onClick={() => setFilter(c.course.code)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === c.course.code ? 'bg-gold-500 text-black' : 'bg-white/60 text-ink-500 hover:bg-brand-500/10'}`}
          >
            {c.course.code}
          </button>
        ))}
      </div>

      {/* السجل الزمني */}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-brand-900/[0.08] text-xs text-ink-400">
                <th className="px-4 py-3 text-right font-medium">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium">المحاضرة</th>
                <th className="px-4 py-3 text-right font-medium">المادة</th>
                <th className="px-4 py-3 text-right font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 80).map((r) => (
                <tr key={r.id} className="border-b border-brand-900/[0.06] transition hover:bg-white/65">
                  <td className="px-4 py-2.5 text-ink-500" dir="ltr">
                    {new Date(r.scannedAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} · {new Date(r.scannedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-2.5 font-semibold">{r.lecture.title}</td>
                  <td className="px-4 py-2.5 text-ink-500">{r.lecture.course.code}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${r.status === 'PRESENT' ? 'bg-brand-500/15 text-brand-700' : 'bg-gold-400/15 text-gold-800'}`}>
                      {r.status === 'PRESENT' ? 'حاضر' : 'متأخر'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-ink-400">لا سجلات في هذا النطاق</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </StudentShell>
  );
}
