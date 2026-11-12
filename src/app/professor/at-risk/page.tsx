'use client';

import * as React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { DashboardShell } from '@/components/shared/DashboardShell';
import EmergencyBanner from '@/components/shared/EmergencyBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toCSV, downloadBlob } from '@/lib/exporters';
import { BAND_LABEL, type RiskBand } from '@/lib/risk';

type CourseOption = { id: string; name: string; code: string };

type OverviewCourse = {
  courseId: string;
  code: string;
  name: string;
  enrolled: number;
  safe: number;
  watch: number;
  critical: number;
  avgScore: number;
};

type RiskRow = {
  id: string;
  name: string;
  studentCode: string | null;
  group: string | null;
  level: string | null;
  attendance: { present: number; late: number; pastLectures: number; pct: number | null };
  grade: {
    current: number | null;
    enteredMax: number;
    quiz: number | null;
    work: number | null;
    midterm: number | null;
  };
  tasks: { due: number; missed: number };
  risk: {
    score: number;
    band: RiskBand;
    components: { attendance: number; grade: number; task: number };
    reasons: string[];
  };
};

type DetailResponse = {
  mode: 'detail';
  course: { id: string; code: string; name: string };
  weights: { attendance: number; grade: number; task: number };
  rows: RiskRow[];
  summary: { safe: number; watch: number; critical: number };
};

type OverviewResponse = { mode: 'overview'; courses: OverviewCourse[] };

const BAND_STYLE: Record<RiskBand, { chip: string; bar: string; dot: string }> = {
  SAFE: { chip: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  WATCH: { chip: 'bg-amber-500/10 text-amber-800 border-amber-500/30', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  CRITICAL: { chip: 'bg-rose-500/10 text-rose-700 border-rose-500/25', bar: 'bg-rose-500', dot: 'bg-rose-500' },
};

type Filter = 'ALL' | RiskBand;

export default function ProfessorAtRiskPage() {
  const [courses, setCourses] = React.useState<CourseOption[]>([]);
  const [overview, setOverview] = React.useState<OverviewCourse[]>([]);
  const [selected, setSelected] = React.useState<string>('');
  const [detail, setDetail] = React.useState<DetailResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [filter, setFilter] = React.useState<Filter>('ALL');
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState<string | null>(null);

  // التحميل الأولي: قائمة المقررات + نظرة عامة
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [courseData, overviewData] = await Promise.all([
          api<{ courses: CourseOption[] }>('/api/courses'),
          api<OverviewResponse>('/api/professor/at-risk'),
        ]);
        if (cancelled) return;
        setCourses(courseData.courses);
        setOverview(overviewData.courses);
        if (courseData.courses.length > 0) setSelected(courseData.courses[0]!.id);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // تحميل تفاصيل مقرر بعينه
  React.useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setError('');
        const data = await api<DetailResponse>(`/api/professor/at-risk?courseId=${encodeURIComponent(selected)}`);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const rows = React.useMemo(() => {
    if (!detail) return [];
    const needle = query.trim();
    return detail.rows.filter((row) => {
      if (filter !== 'ALL' && row.risk.band !== filter) return false;
      if (!needle) return true;
      return (
        row.name.includes(needle) ||
        (row.studentCode || '').includes(needle) ||
        (row.group || '').includes(needle)
      );
    });
  }, [detail, filter, query]);

  function exportCsv() {
    if (!detail) return;
    const header = [
      'الكود', 'الاسم', 'الجروب', 'الحضور %',
      'كويز', 'أعمال', 'ميدترم', 'المجموع',
      'تاسكات مستحقة', 'تاسكات متروكة', 'درجة الخطر', 'التصنيف', 'الأسباب',
    ];
    const body = detail.rows.map((row) => [
      row.studentCode ?? '',
      row.name,
      row.group ?? '',
      row.attendance.pct ?? '—',
      row.grade.quiz ?? '',
      row.grade.work ?? '',
      row.grade.midterm ?? '',
      row.grade.current ?? '',
      row.tasks.due,
      row.tasks.missed,
      row.risk.score,
      BAND_LABEL[row.risk.band],
      row.risk.reasons.join(' · '),
    ]);
    downloadBlob(
      `at-risk-${detail.course.code}-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8',
      toCSV([header, ...body]),
    );
  }

  return (
    <DashboardShell>
      <EmergencyBanner />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold text-gold-700">
            <Activity className="h-4 w-4" /> إنذار مبكر · حساب حتمي شفاف — بدون أي بيانات تغادر الخادم
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
            لوحة المخاطر المبكرة
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            ترتيب طلابك حسب احتمال التعثر قبل الامتياز النهائي — بناءً على الحضور الموزون،
            الدرجات المُدخلة، والتسليمات المتروكة. تتدخل بدري، مش بدري على الأوان.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!detail || detail.rows.length === 0}>
          <Download className="h-4 w-4" />
          تصدير CSV
        </Button>
      </div>

      {error ? (
        <Card className="mb-6 border-rose-500/30 bg-rose-500/[0.06]">
          <CardContent className="flex items-center gap-2 py-4 text-sm font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </CardContent>
        </Card>
      ) : null}

      {/* اختيار المقرر — كروت نظرة عامة */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overview.map((course) => {
          const active = selected === course.courseId;
          const total = course.enrolled || 1;
          return (
            <button
              key={course.courseId}
              type="button"
              onClick={() => setSelected(course.courseId)}
              aria-pressed={active}
              className={`group rounded-2xl border p-4 text-right transition duration-300 ${
                active
                  ? 'border-gold-500/50 bg-gold-500/[0.10] shadow-gold-soft ring-1 ring-gold-500/40'
                  : 'border-brand-900/10 bg-white/60 hover:border-gold-400/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-xs font-bold text-gold-700">{course.code}</p>
                <span className="flex items-center gap-1 text-[10px] font-bold text-ink-400">
                  <Users className="h-3 w-3" /> {course.enrolled}
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm font-semibold text-ink-900">{course.name}</p>
              <div
                className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
                title={`آمن ${course.safe} · مراقبة ${course.watch} · خطر ${course.critical}`}
              >
                <span className="bg-emerald-500" style={{ width: `${(course.safe / total) * 100}%` }} />
                <span className="bg-amber-500" style={{ width: `${(course.watch / total) * 100}%` }} />
                <span className="bg-rose-500" style={{ width: `${(course.critical / total) * 100}%` }} />
              </div>
              <p className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-ink-400">
                <span>
                  {course.critical > 0 ? (
                    <span className="text-rose-600">{course.critical} في خطر</span>
                  ) : (
                    'لا أحد في خطر'
                  )}
                </span>
                <span>متوسط {course.avgScore}</span>
              </p>
            </button>
          );
        })}
        {!loading && overview.length === 0 ? (
          <Card className="sm:col-span-2 xl:col-span-4">
            <CardContent className="py-10 text-center text-sm text-ink-400">
              لا توجد مقررات مسندة إليك بعد — تواصل مع الأدمن لإسناد المقررات.
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* فلاتر + عدّادات */}
      {detail ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(
              [
                { key: 'ALL', label: `الكل (${detail.rows.length})`, icon: Users },
                { key: 'CRITICAL', label: `خطر (${detail.summary.critical})`, icon: Flame },
                { key: 'WATCH', label: `تحت الملاحظة (${detail.summary.watch})`, icon: Eye },
                { key: 'SAFE', label: `آمن (${detail.summary.safe})`, icon: ShieldCheck },
              ] as { key: Filter; label: string; icon: typeof Users }[]
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                  filter === key
                    ? 'border-gold-500/50 bg-gold-500/[0.12] text-gold-800 ring-1 ring-gold-500/40'
                    : 'border-brand-900/10 bg-white/60 text-ink-500 hover:text-ink-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالاسم أو الكود…"
              className="h-9 max-w-xs"
              aria-label="بحث في الطلاب"
            />
          </div>

          {/* جدول الخطر */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-gold-700" />
                ترتيب طلاب {detail.course.code} حسب الخطر
              </CardTitle>
              <span className="text-[10px] font-semibold text-ink-400">
                يظهر الأعلى خطورة أولًا · انقر أي صف للتفاصيل
              </span>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 pb-2">
              <table className="w-full min-w-[860px] text-right text-xs">
                <thead>
                  <tr className="border-b border-brand-900/10 text-[10px] uppercase tracking-wide text-ink-400">
                    <th className="px-4 py-2.5">الطالب</th>
                    <th className="px-3 py-2.5">الحضور</th>
                    <th className="px-3 py-2.5">الدرجات (المتاح)</th>
                    <th className="px-3 py-2.5">المهام</th>
                    <th className="px-3 py-2.5">درجة الخطر</th>
                    <th className="px-3 py-2.5">التصنيف</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const style = BAND_STYLE[row.risk.band];
                    const isOpen = expanded === row.id;
                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          className="cursor-pointer border-b border-brand-900/5 transition hover:bg-brand-500/[0.04]"
                          onClick={() => setExpanded(isOpen ? null : row.id)}
                        >
                          <td className="px-4 py-2.5">
                            <p className="font-bold text-ink-900">{row.name}</p>
                            <p className="text-[10px] text-ink-400">
                              {row.studentCode || 'بدون كود'} · جروب {row.group || '—'}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`font-bold ${
                                row.attendance.pct === null
                                  ? 'text-ink-400'
                                  : row.attendance.pct >= 75
                                    ? 'text-emerald-700'
                                    : row.attendance.pct >= 50
                                      ? 'text-amber-700'
                                      : 'text-rose-700'
                              }`}
                            >
                              {row.attendance.pct === null ? '—' : `${Math.round(row.attendance.pct)}%`}
                            </span>
                            <p className="text-[9.5px] text-ink-400">
                              {row.attendance.present} حاضر · {row.attendance.late} متأخر
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-ink-900">
                              {row.grade.current === null ? '—' : row.grade.current}
                            </span>
                            <span className="text-ink-400"> / {row.grade.enteredMax || '—'}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            {row.tasks.due === 0 ? (
                              <span className="text-ink-400">—</span>
                            ) : row.tasks.missed === 0 ? (
                              <span className="flex items-center gap-1 font-bold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" /> {row.tasks.due}/{row.tasks.due}
                              </span>
                            ) : (
                              <span className="font-bold text-rose-700">
                                {row.tasks.missed}/{row.tasks.due} فائتة
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                                <div
                                  className={`h-full rounded-full ${style.bar} transition-all duration-500`}
                                  style={{ width: `${row.risk.score}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] font-bold text-ink-800">
                                {row.risk.score}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold ${style.chip}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                              {BAND_LABEL[row.risk.band]}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <ChevronDown
                              className={`h-4 w-4 text-ink-300 transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </td>
                        </tr>
                        {isOpen ? (
                          <tr className="border-b border-brand-900/5 bg-gold-500/[0.05]">
                            <td colSpan={7} className="px-4 py-3">
                              <p className="mb-1.5 text-[10px] font-bold text-gold-800">لماذا هذه الدرجة؟</p>
                              <ul className="grid gap-1 text-[11px] text-ink-600 sm:grid-cols-2">
                                {row.risk.reasons.map((reason, index) => (
                                  <li key={index} className="flex items-start gap-1.5">
                                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gold-600" />
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-2 text-[9.5px] text-ink-400">
                                الأوزان: حضور {Math.round(detail.weights.attendance * 100)}% · درجات{' '}
                                {Math.round(detail.weights.grade * 100)}% · مهام{' '}
                                {Math.round(detail.weights.task * 100)}% — يقدر الأدمن يضبطها من الإعدادات
                                (risk_w_attendance / risk_w_grade / risk_w_task).
                              </p>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-400">
                        لا توجد نتائج مطابقة {filter !== 'ALL' || query ? 'للفلتر الحالي' : 'لهذا المقرر بعد'}.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : !loading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-ink-400">
            اختر مقررًا من الأعلى لعرض لوحة المخاطر.
          </CardContent>
        </Card>
      ) : null}
    </DashboardShell>
  );
}
