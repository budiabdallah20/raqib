'use client';

/**
 * 🏛️ تقارير الكلية — أدمن (WP2) + مؤشر الوضع التجريبي WP1
 */
import * as React from 'react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { api } from '@/lib/api';
import { Download, Printer, BookOpen, Users, GraduationCap, AlertTriangle, RefreshCw } from 'lucide-react';

type CollegeReport = {
  policy: { attendanceThreshold: number; maxAbsence: number; lateCountsAs: number };
  totals: {
    courses: number;
    seats: number;
    lectures: number;
    attendancePct: number;
    belowThreshold: number;
  };
  courses: {
    id: string;
    code: string;
    name: string;
    professor: string;
    seats: number;
    lectures: number;
    present: number;
    late: number;
    attendancePct: number;
    health: string;
  }[];
};

export default function AdminReportsPage() {
  const [report, setReport] = React.useState<CollegeReport | null>(null);
  const [demoMode, setDemoMode] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const load = React.useCallback(() => {
    api<CollegeReport>('/api/admin/report')
      .then(setReport)
      .catch((e) => setError((e as Error).message));
    api<{ demoMode?: boolean }>('/api/admin/stats')
      .then((d) => setDemoMode(Boolean(d.demoMode)))
      .catch(() => {});
  }, []);

  React.useEffect(load, [load]);

  async function resetDemo() {
    setResetting(true);
    setMessage('');
    setError('');
    try {
      const res = await api<{ ok: boolean }>('/api/admin/demo/reset', { method: 'POST' });
      setMessage(res.ok ? '✅ تم إعادة توليد بيانات العرض بنجاح — قد يستغرق الانعكاس ثواني.' : 'تم');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setResetting(false);
    }
  }

  if (!report && !error) {
    return (
      <DashboardShell>
        <p className="text-ink-400">جارِ توليد تقرير الكلية…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold text-gold-gradient">
            تقارير الكلية
            {demoMode && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-amber-300">
                بيانات تجريبية · DEMO MODE
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-ink-500">ملخص حضور كل المواد — محسوب فعليًا من سجلات المنصة.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => (window.location.href = '/api/admin/report?format=csv')}
            className="inline-flex items-center gap-2 rounded-xl border border-gold-500/25 bg-gold-500/[0.08] px-4 py-2.5 text-sm font-semibold text-gold-700 transition hover:bg-gold-500/[0.15]"
          >
            <Download className="h-4 w-4" /> تصدير CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-900/10 bg-white/60 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-brand-500/10"
          >
            <Printer className="h-4 w-4" /> طباعة / PDF
          </button>
          <button
            onClick={resetDemo}
            disabled={resetting}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/[0.12] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'جارِ إعادة الضبط…' : 'إعادة ضبط بيانات العرض'}
          </button>
        </div>
      </div>

      {message && <p className="mb-4 text-brand-600 print:hidden">{message}</p>}
      {error && <p className="mb-4 text-rose-400 print:hidden">{error}</p>}

      {report ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5 print:grid-cols-5">
            <AdminStatCard title="المواد" value={String(report.totals.courses)} icon={BookOpen} />
            <AdminStatCard title="مقاعد تفاعلية" value={String(report.totals.seats)} icon={Users} />
            <AdminStatCard title="محاضرات" value={String(report.totals.lectures)} icon={GraduationCap} />
            <AdminStatCard title="متوسط الحضور" value={`${report.totals.attendancePct}%`} icon={BookOpen} hint="محسوب فعليًا" />
            <AdminStatCard title="مواد تحت العتبة" value={String(report.totals.belowThreshold)} icon={AlertTriangle} tone="ember" />
          </div>

          <Card className="print:border-0 print:bg-white">
            <CardHeader className="print:hidden">
              <CardTitle className="text-base">
                لكل مادة — عتبة {report.policy.attendanceThreshold}%، وتُحتسب النسبة بمقياس التأخير {report.policy.lateCountsAs}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[760px] text-sm print:min-w-0">
                <thead>
                  <tr className="border-b border-brand-900/[0.08] text-xs text-ink-400 print:text-black">
                    <th className="px-4 py-3 text-right font-medium">المادة</th>
                    <th className="px-4 py-3 text-right font-medium">الدكتور</th>
                    <th className="px-4 py-3 text-right font-medium">مسجلون</th>
                    <th className="px-4 py-3 text-right font-medium">محاضرات</th>
                    <th className="px-4 py-3 text-right font-medium">حاضر</th>
                    <th className="px-4 py-3 text-right font-medium">متأخر</th>
                    <th className="px-4 py-3 text-right font-medium">الحضور</th>
                  </tr>
                </thead>
                <tbody>
                  {report.courses.map((c) => (
                    <tr key={c.id} className="border-b border-brand-900/[0.06] transition hover:bg-white/605 print:text-black">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{c.code}</div>
                        <div className="text-xs text-ink-400 print:text-black/70">{c.name}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-500 print:text-black">{c.professor}</td>
                      <td className="px-4 py-3">{c.seats}</td>
                      <td className="px-4 py-3">{c.lectures}</td>
                      <td className="px-4 py-3">{c.present}</td>
                      <td className="px-4 py-3">{c.late}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`font-bold ${c.attendancePct >= report.policy.attendanceThreshold ? 'text-brand-700 print:text-lime-700' : 'text-amber-300 print:text-amber-700'}`}>
                            {c.attendancePct}%
                          </span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/60 print:hidden">
                            <div className="h-full rounded-full bg-gradient-to-l from-lime-400 to-gold-500" style={{ width: `${Math.min(100, c.attendancePct)}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </DashboardShell>
  );
}
