'use client';

/**
 * 📄 تقريري الشخصي — ملخص الأداء في صفحة واحدة:
 * بطاقات الملخص + جدول الدرجات + جدول الحضور، مع تصدير CSV يفتح في Excel
 * وطابعة بعناوين أنيقة (print-area) — كل الحساب على جهاز الطالب.
 */
import * as React from 'react';
import { motion } from 'framer-motion';
import { Award, CalendarCheck2, FileDown, GraduationCap, Printer, Target } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/components/student/PortalAgent';
import { EmptyState } from '@/components/student/EmptyState';
import { GridSkeleton } from '@/components/student/Skeletons';
import { downloadBlob, toCSV } from '@/lib/exporters';

type ProfileData = {
  profile: { name: string; studentCode: string | null; group: string | null; level: string | null };
  gpa: {
    term: number | null;
    cumulative: number | null;
    gradedCredits: number;
    maxTotal: number;
  };
  levelRank: { rank: number; of: number } | null;
  courses: {
    code: string;
    name: string;
    creditHours: number;
    components: { quiz: number | null; work: number | null; midterm: number | null; final: number | null } | null;
    total: number | null;
    letter: string | null;
    graded: boolean;
  }[];
};

type SummaryData = {
  policy: { attendanceThreshold: number; lateCountsAs: number };
  summary: {
    course: { code: string; name: string };
    present: number;
    late: number;
    totalLectures: number;
    attendancePct: number | null;
    status: 'SAFE' | 'WARNING' | 'DENIED';
    statusLabel: string;
  }[];
};

const STATUS_TONE: Record<SummaryData['summary'][number]['status'], string> = {
  SAFE: 'border-brand-500/35 bg-brand-500/[0.10] text-brand-700',
  WARNING: 'border-gold-400/40 bg-gold-400/[0.10] text-gold-800',
  DENIED: 'border-ember-500/40 bg-ember-500/[0.08] text-ember-600',
};

export default function StudentReportPage() {
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [summary, setSummary] = React.useState<SummaryData | null>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      api<ProfileData>('/api/student/profile'),
      api<SummaryData>('/api/attendance/summary').catch(() => null),
    ])
      .then(([p, s]) => {
        setProfile(p);
        setSummary(s);
      })
      .catch((err) => {
        setError((err as Error).message);
        setProfile(null);
      });
  }, []);

  const overallPct = React.useMemo(() => {
    const rows = summary?.summary.filter((row) => row.totalLectures > 0) ?? [];
    return rows.length
      ? Math.round(rows.reduce((acc, row) => acc + (row.attendancePct ?? 0), 0) / rows.length)
      : null;
  }, [summary]);

  const exportGrades = () => {
    if (!profile) return;
    const headers = ['المقرر', 'الكود', 'كويز (20)', 'أعمال (20)', 'ميدترم (30)', 'فاينل (30)', 'الإجمالي (100)', 'التقدير'];
    const rows: (string | number | null)[][] = [headers];
    for (const course of profile.courses) {
      rows.push([
        course.name,
        course.code,
        course.components?.quiz ?? '',
        course.components?.work ?? '',
        course.components?.midterm ?? '',
        course.components?.final ?? '',
        course.total ?? '',
        course.letter ?? '',
      ]);
    }
    downloadBlob('raqib-grades.csv', 'text/csv;charset=utf-8', toCSV(rows));
    toast('نزّلت درجاتك CSV 📊');
  };

  const exportAttendance = () => {
    if (!summary) return;
    const rows: (string | number | null)[][] = [
      ['المقرر', 'الكود', 'حاضر', 'متأخر', 'إجمالي المحاضرات', 'النسبة %', 'الحالة'],
    ];
    for (const row of summary.summary) {
      rows.push([
        row.course.name,
        row.course.code,
        row.present,
        row.late,
        row.totalLectures,
        row.attendancePct ?? '',
        row.statusLabel,
      ]);
    }
    downloadBlob('raqib-attendance.csv', 'text/csv;charset=utf-8', toCSV(rows));
    toast('نزّلت سجل حضورك CSV 📅');
  };

  const printableHeader = profile
    ? `RAQiB · رقيب — تقرير الطالب ${profile.profile.name}${
        profile.profile.studentCode ? ` (${profile.profile.studentCode})` : ''
      } · ${new Date().toLocaleDateString('ar-EG')}`
    : '';

  if (error) {
    return (
      <StudentShell>
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-ink-950">تقريري الشخصي</h1>
        </div>
        <EmptyState
          kind="grades"
          title="تعذر تجهيز التقرير"
          sub={error}
          action={
            <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
          }
        />
      </StudentShell>
    );
  }

  if (!profile) {
    return (
      <StudentShell>
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-ink-950">تقريري الشخصي</h1>
        </div>
        <GridSkeleton cards={4} />
      </StudentShell>
    );
  }

  return (
    <StudentShell>
      {/* رأس الطباعة — يظهر فقط عند الطباعة */}
      <div className="print-only mb-2 text-center text-sm font-bold">{printableHeader}</div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950">تقريري الشخصي</h1>
          <p className="mt-1 text-ink-500">
            {profile.profile.name} · جروب {profile.profile.group ?? '—'} · الفرقة {profile.profile.level ?? '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={printReport}>
            <Printer className="h-4 w-4" />
            اطبع التقرير
          </Button>
          <Button variant="outline" onClick={exportGrades}>
            <FileDown className="h-4 w-4" />
            CSV الدرجات
          </Button>
          <Button variant="outline" onClick={exportAttendance} disabled={!summary}>
            <FileDown className="h-4 w-4" />
            CSV الحضور
          </Button>
        </div>
      </div>

      <div className="print-area">
        {/* بطاقات الملخص */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              {
                icon: GraduationCap,
                label: 'معدل الترم',
                value: profile.gpa.term === null ? '—' : profile.gpa.term.toFixed(2),
                tone: 'text-gold-700',
              },
              {
                icon: Award,
                label: 'المعدل التراكمي',
                value: profile.gpa.cumulative === null ? '—' : profile.gpa.cumulative.toFixed(2),
                tone: 'text-brand-700',
              },
              {
                icon: Target,
                label: 'ترتيبك بالفرقة',
                value: profile.levelRank ? `${profile.levelRank.rank}/${profile.levelRank.of}` : '—',
                tone: 'text-gold-700',
              },
              {
                icon: CalendarCheck2,
                label: 'حضوري العام',
                value: overallPct === null ? '—' : `${overallPct}%`,
                tone: (overallPct ?? 0) >= 75 ? 'text-brand-700' : (overallPct ?? 0) >= 60 ? 'text-gold-800' : 'text-ember-600',
              },
            ] as const
          ).map((tile, index) => {
            const Icon = tile.icon;
            return (
              <motion.div
                key={tile.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
              >
                <Card className="border-glow">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="rounded-xl bg-gold-400/15 p-2.5 text-gold-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-xl font-black text-ink-950" dir="ltr">
                        {tile.value}
                      </span>
                      <span className="block text-[10.5px] text-ink-400">{tile.label}</span>
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* جدول الدرجات */}
        <Card className="mt-6">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>درجات المقررات</CardTitle>
            <span className="text-[10.5px] text-ink-400">
              الإجمالي من {profile.gpa.maxTotal} · {profile.gpa.gradedCredits} ساعات مقيّمة
            </span>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {profile.courses.length ? (
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-brand-900/[0.08] text-xs text-ink-400">
                    <th className="px-4 py-3 text-right font-bold">المقرر</th>
                    <th className="px-4 py-2 font-bold">كويز</th>
                    <th className="px-4 py-2 font-bold">أعمال</th>
                    <th className="px-4 py-2 font-bold">ميدترم</th>
                    <th className="px-4 py-2 font-bold">فاينل</th>
                    <th className="px-4 py-2 font-bold">الإجمالي</th>
                    <th className="px-4 py-3 font-bold">التقدير</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.courses.map((course) => (
                    <tr key={course.code} className="border-b border-brand-900/[0.06] transition hover:bg-white/50">
                      <td className="px-4 py-2.5">
                        <span className="block font-bold text-ink-900">{course.name}</span>
                        <span className="block text-[10.5px] text-ink-400" dir="ltr">
                          {course.code} · {course.creditHours} ساعات
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-ink-600">{course.components?.quiz ?? '—'}</td>
                      <td className="px-4 py-2.5 text-center text-ink-600">{course.components?.work ?? '—'}</td>
                      <td className="px-4 py-2.5 text-center text-ink-600">{course.components?.midterm ?? '—'}</td>
                      <td className="px-4 py-2.5 text-center text-ink-600">{course.components?.final ?? '—'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`font-display text-base font-black ${
                            course.total === null ? 'text-ink-300' : course.total >= 75 ? 'text-brand-700' : course.total >= 60 ? 'text-gold-700' : 'text-ember-600'
                          }`}
                        >
                          {course.total ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {course.letter ? (
                          <span className="rounded-lg border border-gold-400/30 bg-gold-400/10 px-2.5 py-1 text-xs font-bold text-gold-800">
                            {course.letter}
                          </span>
                        ) : (
                          <span className="text-[10.5px] text-ink-300">قيد التقييم</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState kind="grades" compact title="لسه مفيش درجات متسجلة" />
            )}
          </CardContent>
        </Card>

        {/* جدول الحضور */}
        {summary ? (
          <Card className="mt-6">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>سجل الحضور بالمقررات</CardTitle>
              <span className="text-[10.5px] text-ink-400">
                الإنذار أقل من {summary.policy.attendanceThreshold}% · التأخير = {summary.policy.lateCountsAs} حاضر
              </span>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {summary.summary.length ? (
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-brand-900/[0.08] text-xs text-ink-400">
                      <th className="px-4 py-3 text-right font-bold">المقرر</th>
                      <th className="px-4 py-2 font-bold">حاضر</th>
                      <th className="px-4 py-2 font-bold">متأخر</th>
                      <th className="px-4 py-2 font-bold">المحاضرات</th>
                      <th className="px-4 py-2 font-bold">النسبة</th>
                      <th className="px-4 py-3 font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.summary.map((row) => (
                      <tr key={row.course.code} className="border-b border-brand-900/[0.06] transition hover:bg-white/50">
                        <td className="px-4 py-2.5">
                          <span className="block font-bold text-ink-900">{row.course.name}</span>
                          <span className="block text-[10.5px] text-ink-400" dir="ltr">{row.course.code}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-brand-700 font-bold">{row.present}</td>
                        <td className="px-4 py-2.5 text-center text-gold-700 font-bold">{row.late}</td>
                        <td className="px-4 py-2.5 text-center text-ink-600">{row.totalLectures}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="font-display font-black text-ink-950">
                            {row.attendancePct === null ? '—' : `${row.attendancePct}%`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${STATUS_TONE[row.status]}`}>
                            {row.statusLabel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState kind="lectures" compact title="لسه مفيش محاضرات لحساب الحضور" />
              )}
            </CardContent>
          </Card>
        ) : null}

        <p className="mt-6 text-center text-[10px] text-ink-300">
          RAQiB Report — التقرير مُجمَّع من بيانات حسابك؛ الشيتات تفتح مباشرة في Excel
        </p>
      </div>
    </StudentShell>
  );
}

function printReport() {
  toast('جهّزنا نسخة الطباعة — اختر «حفظ كـ PDF» لو حابب');
  window.setTimeout(() => window.print(), 350);
}
