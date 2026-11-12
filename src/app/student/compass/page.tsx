'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Eye,
  Flame,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { RadialProgress } from '@/components/student/RadialProgress';
import { EmptyState } from '@/components/student/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type CompassCourse = {
  id: string;
  code: string;
  name: string;
  professor: string;
  creditHours: number;
  lectures: { total: number; past: number };
  attendance: { present: number; late: number; pct: number | null; status: 'SAFE' | 'WARNING' | 'DENIED' };
  grade: {
    quiz: number | null;
    work: number | null;
    midterm: number | null;
    final: number | null;
    total: number | null;
    letter: string | null;
    zone: 'GREEN' | 'YELLOW' | 'RED';
    enteredMax: number;
    current: number | null;
  };
  tasks: { due: number; missed: number };
  risk: { score: number; band: 'SAFE' | 'WATCH' | 'CRITICAL'; reasons: string[] };
  advice: string;
};

type CompassResponse = {
  credits: { enrolled: number; max: number };
  totalCourses: number;
  summary: { safe: number; watch: number; critical: number };
  courses: CompassCourse[];
};

const BAND = {
  SAFE: { label: 'آمن', chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700', bar: 'bg-emerald-500' },
  WATCH: { label: 'تحت الملاحظة', chip: 'border-amber-500/30 bg-amber-500/10 text-amber-800', bar: 'bg-amber-500' },
  CRITICAL: { label: 'خطر', chip: 'border-rose-500/30 bg-rose-500/10 text-rose-700', bar: 'bg-rose-500' },
} as const;

export default function StudentCompassPage() {
  const [data, setData] = React.useState<CompassResponse | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [open, setOpen] = React.useState<string | null>(null);

  const load = React.useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const result = await api<CompassResponse>('/api/student/compass');
      setData(result);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void load(true);
  }, [load]);

  const creditsPct = data ? Math.min(100, Math.round((data.credits.enrolled / data.credits.max) * 100)) : 0;

  return (
    <StudentShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold text-gold-700">
            <Compass className="h-4 w-4" /> موقفك في كل مقرر — حضور · درجات · إنذار مبكر
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-950 sm:text-3xl">بوصلة المقررات</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            عينك على الحرج قبل ما يحصل: الحضور الموزون، إيقاع درجاتك مقابل المتوقع،
            والتاسكات المتروكة — كلها في بطاقة واحدة لكل مادة.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={refreshing}>
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          تحديث
        </Button>
      </div>

      {error ? (
        <Card className="mb-6 border-rose-500/30 bg-rose-500/[0.06]">
          <CardContent className="flex items-center gap-2 py-4 text-sm font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </CardContent>
        </Card>
      ) : null}

      {/* ═══ الساعات المعتمدة + ملخص السلامة ═══ */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="flex items-center gap-4 p-4">
          <RadialProgress
            value={data?.credits.enrolled ?? null}
            max={data?.credits.max ?? 17}
            size={92}
            stroke={8}
            tone="gold"
            valueText={data ? String(data.credits.enrolled) : '…'}
            labelText={`من ${data?.credits.max ?? 17}`}
          />
          <div>
            <p className="font-display text-sm font-bold text-ink-900">الساعات المعتمدة</p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-500">
              {data
                ? data.credits.enrolled <= data.credits.max
                  ? `${data.credits.enrolled} من أصل ${data.credits.max} ساعة — ضمن الحد الأقصى.`
                  : `تجاوزت الحد الأقصى (${data.credits.max})! راجع التسجيل مع الأدمن.`
                : 'جارٍ الحساب…'}
            </p>
            <div className="mt-2 h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-ink-100">
              <div
                className={cn('h-full rounded-full transition-all duration-700', data && data.credits.enrolled > data.credits.max ? 'bg-rose-500' : 'bg-gold-400')}
                style={{ width: `${creditsPct}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="flex items-center justify-around p-4 text-center">
          {[
            { label: 'آمن', value: data?.summary.safe, cls: 'text-emerald-600' },
            { label: 'مراقبة', value: data?.summary.watch, cls: 'text-amber-600' },
            { label: 'خطر', value: data?.summary.critical, cls: 'text-rose-600' },
          ].map(({ label, value, cls }) => (
            <div key={label}>
              <p className={cn('font-display text-4xl font-extrabold tabular-nums', cls)}>
                {value ?? '…'}
              </p>
              <p className="mt-1 text-[10px] font-bold text-ink-400">{label}</p>
            </div>
          ))}
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <Sparkles className="h-8 w-8 shrink-0 text-gold-500" />
          <p className="text-[11px] leading-relaxed text-ink-600">
            <span className="font-bold text-ink-900">قاعدة البوصلة:</span> الحضور الموزون 40%،
            إيقاع الدرجات 35%، التاسكات المتروكة 25%. الأحمر يعني: انتبه دلوقتي — مش يوم الامتحان.
          </p>
        </Card>
      </div>

      {/* ═══ بطاقات المقررات — الأخطر أولًا ═══ */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl border border-brand-900/[0.08] bg-white/60" />
          ))}
        </div>
      ) : data && data.courses.length === 0 ? (
        <EmptyState
          kind="grades"
          title="لسه مش مسجّل في أي مقرر"
          sub="البوصلة تشتغل أول ما تتشال في جدول — تواصل مع الأدمن لإضافتك للمقررات."
          action={
            <Link href="/student" className="inline-flex h-10 items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/[0.08] px-4 text-sm font-bold text-gold-800 transition hover:bg-gold-500/[0.15]">
              الرئيسية
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.courses.map((course) => {
            const band = BAND[course.risk.band];
            const isOpen = open === course.id;
            return (
              <Card key={course.id} className="overflow-hidden">
                <div className="flex items-stretch">
                  {/* شريط الخطر الجانبي */}
                  <div className={cn('w-1.5 shrink-0', band.bar)} aria-hidden />
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-[10px] font-bold text-gold-700">{course.code} · {course.creditHours} ساعات</p>
                        <p className="mt-0.5 truncate text-sm font-bold text-ink-950" title={course.name}>{course.name}</p>
                        <p className="mt-0.5 truncate text-[10px] text-ink-400">د. {course.professor} · محاضرة {course.lectures.past} من {course.lectures.total} انعقدت</p>
                      </div>
                      <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-extrabold', band.chip)}>
                        {course.risk.band === 'CRITICAL' ? <Flame className="h-3 w-3" /> : course.risk.band === 'WATCH' ? <Eye className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                        {band.label} · {course.risk.score}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                      {/* حضور */}
                      <div>
                        <p className={cn(
                          'font-display text-xl font-extrabold tabular-nums',
                          course.attendance.status === 'DENIED' ? 'text-rose-600' : course.attendance.status === 'WARNING' ? 'text-amber-600' : 'text-emerald-600',
                        )}>
                          {course.attendance.pct === null ? '—' : `${Math.round(course.attendance.pct)}%`}
                        </p>
                        <p className="text-[9px] font-bold text-ink-400">الحضور الموزون</p>
                      </div>
                      {/* درجات */}
                      <div>
                        <p className="font-display text-xl font-extrabold tabular-nums text-ink-900">
                          {course.grade.total ?? '—'}
                          {course.grade.letter ? <span className={cn('ms-1 align-middle text-[10px] font-black', course.grade.zone === 'RED' ? 'text-rose-600' : course.grade.zone === 'YELLOW' ? 'text-amber-600' : 'text-emerald-600')}>{course.grade.letter}</span> : null}
                        </p>
                        <p className="text-[9px] font-bold text-ink-400">المجموع (100)</p>
                      </div>
                      {/* تاسكات */}
                      <div>
                        <p className={cn('font-display text-xl font-extrabold tabular-nums', course.tasks.missed > 0 ? 'text-rose-600' : 'text-ink-900')}>
                          {course.tasks.due === 0 ? '—' : `${course.tasks.due - course.tasks.missed}/${course.tasks.due}`}
                        </p>
                        <p className="text-[9px] font-bold text-ink-400">تاسكات مسلّمة</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-gold-500/25 bg-gold-500/[0.07] px-3 py-2 text-[10.5px] font-semibold leading-snug text-gold-900">
                      💡 {course.advice}
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : course.id)}
                      className="mt-2 flex items-center gap-1 text-[9.5px] font-bold text-ink-400 transition hover:text-ink-700"
                      aria-expanded={isOpen}
                    >
                      ليه الدرجة دي؟
                      <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen ? (
                      <ul className="mt-1 grid gap-1 text-[10px] text-ink-600">
                        {course.risk.reasons.map((reason, index) => (
                          <li key={index} className="flex items-start gap-1.5">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gold-600" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-[10px] text-ink-400">
        البوصلة حساب حتمي شفاف — مفيش أي بيانات بتخرج من خادم الجامعة.{' '}
        <Link href="/student/report" className="font-bold text-gold-700 hover:underline">التقرير الكامل ←</Link>
      </p>
    </StudentShell>
  );
}
