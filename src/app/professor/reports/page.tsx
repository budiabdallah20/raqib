'use client';

/**
 * 📊 تقارير حضور الدكتور — WP2
 * جدول الطلاب لكل مادة + حالة سياسة الحضور + تصدير CSV + PDF (طباعة بهوية رقيب).
 */
import * as React from 'react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Download, Printer, ShieldAlert, ShieldCheck, ShieldX, Users } from 'lucide-react';

type Report = {
  course: { id: string; code: string; name: string; englishName: string | null };
  lecturesCount: number;
  policy: { attendanceThreshold: number; maxAbsence: number; lateCountsAs: number };
  stats: { attendedTotal: number; seats: number; avgPct: number; denied: number; warning: number };
  rows: {
    studentId: string;
    name: string;
    studentCode: string;
    group: string;
    level: string;
    present: number;
    late: number;
    absent: number;
    attendancePct: number;
    status: 'SAFE' | 'WARNING' | 'DENIED';
    statusLabel: string;
  }[];
};

const STATUS_STYLES: Record<string, string> = {
  SAFE: 'bg-lime-500/15 text-brand-700',
  WARNING: 'bg-amber-500/15 text-amber-300',
  DENIED: 'bg-rose-500/15 text-rose-300',
};

export default function ProfessorReportsPage() {
  const [courses, setCourses] = React.useState<{ id: string; code: string; name: string }[]>([]);
  const [courseId, setCourseId] = React.useState('');
  const [report, setReport] = React.useState<Report | null>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api<{ courses: typeof courses }>('/api/courses')
      .then((d) => {
        setCourses(d.courses);
        if (d.courses[0]) setCourseId(d.courses[0].id);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  React.useEffect(() => {
    if (!courseId) return;
    setReport(null);
    api<Report>(`/api/attendance/report?courseId=${encodeURIComponent(courseId)}`)
      .then(setReport)
      .catch((e) => setError((e as Error).message));
  }, [courseId]);

  function downloadCsv() {
    if (!report) return;
    window.location.href = `/api/attendance/report?courseId=${encodeURIComponent(courseId)}&format=csv`;
  }

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold-gradient">تقارير الحضور</h1>
          <p className="mt-1 text-ink-500 text-sm">احسب حالة كل طالب وفق سياسة الكلية، وصدر التقارير.</p>
        </div>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="h-11 min-w-64 rounded-xl border border-brand-900/10 bg-white/60 px-4 text-sm"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id} className="text-black">{c.code} — {c.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-rose-400 print:hidden">{error}</p>}

      {report ? (
        <>
          {/* بطاقات الملخص */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4">
            <div className="rounded-2xl border border-gold-500/20 bg-gold-500/[0.06] p-5">
              <p className="text-xs text-ink-400 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> مسجل في المادة</p>
              <p className="font-display text-3xl font-extrabold text-ink-900">{report.stats.seats}</p>
            </div>
            <div className="rounded-2xl border border-gold-500/20 bg-gold-500/[0.06] p-5">
              <p className="text-xs text-ink-400">متوسط الحضور</p>
              <p className="font-display text-3xl font-extrabold text-gold-700">{report.stats.avgPct}%</p>
            </div>
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-5">
              <p className="text-xs text-ink-400 flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> تحت الإنذار</p>
              <p className="font-display text-3xl font-extrabold text-amber-300">{report.stats.warning}</p>
            </div>
            <div className="rounded-2xl border border-rose-500/15 bg-rose-500/[0.05] p-5">
              <p className="text-xs text-ink-400 flex items-center gap-1.5"><ShieldX className="h-3.5 w-3.5" /> محرومون ({'>'}{report.policy.maxAbsence}%)</p>
              <p className="font-display text-3xl font-extrabold text-rose-300">{report.stats.denied}</p>
            </div>
          </div>

          {/* أزرار التصدير */}
          <div className="mb-4 flex gap-3 print:hidden">
            <button onClick={downloadCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-gold-500/25 bg-gold-500/[0.08] px-4 py-2.5 text-sm font-semibold text-gold-700 transition hover:bg-gold-500/[0.15]">
              <Download className="h-4 w-4" /> تصدير CSV
            </button>
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-900/10 bg-white/60 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-brand-500/10">
              <Printer className="h-4 w-4" /> طباعة / حفظ PDF
            </button>
            <span className="self-center text-xs text-ink-400">سياسة: حضور ≥ {report.policy.attendanceThreshold}% · التأخير = {report.policy.lateCountsAs} حاضر</span>
          </div>

          {/* الجدول */}
          <Card className="print:border-0 print:bg-white print:text-black">
            <CardHeader className="print:hidden">
              <CardTitle className="text-base">{report.course.code} — {report.course.name} · {report.lecturesCount} محاضرة</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[720px] text-sm print:min-w-0">
                <thead>
                  <tr className="border-b border-brand-900/[0.08] text-xs text-ink-400 print:text-black">
                    <th className="px-4 py-3 text-right font-medium">الكود</th>
                    <th className="px-4 py-3 text-right font-medium">الاسم</th>
                    <th className="px-4 py-3 text-right font-medium">فرقة</th>
                    <th className="px-4 py-3 text-right font-medium">جروب</th>
                    <th className="px-4 py-3 text-right font-medium">حاضر</th>
                    <th className="px-4 py-3 text-right font-medium">متأخر</th>
                    <th className="px-4 py-3 text-right font-medium">غائب</th>
                    <th className="px-4 py-3 text-right font-medium">النسبة</th>
                    <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r) => (
                    <tr key={r.studentId} className="border-b border-brand-900/[0.06] transition hover:bg-white/65 print:text-black">
                      <td className="px-4 py-2.5 text-ink-500 print:text-black" dir="ltr">{r.studentCode}</td>
                      <td className="px-4 py-2.5 font-semibold" dir="rtl">{r.name}</td>
                      <td className="px-4 py-2.5 text-ink-500 print:text-black">{r.level}</td>
                      <td className="px-4 py-2.5 text-ink-500 print:text-black">{r.group}</td>
                      <td className="px-4 py-2.5">{r.present}</td>
                      <td className="px-4 py-2.5">{r.late}</td>
                      <td className="px-4 py-2.5">{r.absent}</td>
                      <td className={`px-4 py-2.5 font-bold ${r.attendancePct < report.policy.attendanceThreshold ? 'text-amber-300 print:text-amber-700' : 'text-brand-700 print:text-lime-700'}`}>
                        {r.attendancePct}%
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[r.status]}`}>
                          {r.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : (
        !error && <p className="text-ink-400 print:hidden">جارِ توليد التقرير…</p>
      )}
    </DashboardShell>
  );
}
