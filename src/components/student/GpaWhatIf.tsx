'use client';

/**
 * 🧮 حاسبة المعدل التنبؤية — لو رديت الفاينل بإكس، معدل الترم يطلع كلام؟
 * كل مادة فيها شريط تقدير فاينل، والناتج يتحدث لحظيًا بالمعدل المزون بالساعات.
 */
import * as React from 'react';
import { FlaskConical, RotateCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from './Skeletons';
import { AnimatedNumber } from './AnimatedNumber';
import { GRADE_MAX, gpaPointFor, letterFor } from '@/lib/grades';
import { toneOf, type GpaCourse } from './GpaWhatIf.helpers';

export type { GpaCourse };

export function GpaWhatIf({
  courses,
  currentTermGpa,
  loading,
}: {
  courses: GpaCourse[];
  currentTermGpa: number | null;
  loading?: boolean;
}) {
  const [estimates, setEstimates] = React.useState<Record<string, number>>({});

  // قيم ابتدائية ذكية: نسبة أفضل الكويز+وأعمال+ميدترم تكبّرها على ٣٠
  React.useEffect(() => {
    if (!courses.length) return;
    setEstimates(Object.fromEntries(courses.map((course) => [course.code, projectFinal(course)])));
  }, [courses]);

  const perCourse = courses.map((course) => {
    const finalEst = estimates[course.code] ?? 0;
    const base =
      (course.components?.quiz ?? 0) +
      (course.components?.work ?? 0) +
      (course.components?.midterm ?? 0);
    const projected = Math.max(0, Math.min(100, Math.round(base + finalEst)));
    const letter = letterFor(projected);
    return { course, finalEst, projected, letter, points: gpaPointFor(projected), credits: course.creditHours || 3 };
  });

  const creditSum = perCourse.reduce((acc, row) => acc + row.credits, 0);
  const projectedGpa = creditSum
    ? perCourse.reduce((acc, row) => acc + row.points * row.credits, 0) / creditSum
    : 0;
  const maxGpa = creditSum
    ? perCourse.reduce((acc, row) => acc + gpaPointFor(Math.min(100, (row.course.components?.quiz ?? 0) + (row.course.components?.work ?? 0) + (row.course.components?.midterm ?? 0) + GRADE_MAX.FINAL)) * row.credits, 0) / creditSum
    : 0;
  const delta = currentTermGpa === null ? 0 : projectedGpa - currentTermGpa;
  const sorted = [...perCourse].sort((a, b) => a.course.name.localeCompare(b.course.name, 'ar'));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>حاسبة المعدل التنبؤية</CardTitle>
        </CardHeader>
        <CardContent>
          <CardSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>حاسبة المعدل التنبؤية</CardTitle>
        <span className="flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/[0.08] px-2.5 py-1 text-[10px] font-bold text-gold-800">
          <FlaskConical className="h-3 w-3" />
          لو رديت الفاينل؟
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {!courses.length ? (
          <p className="py-6 text-center text-sm text-ink-400">مفيش مقررات مسجلة اتحسب عليها</p>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-brand-900/10 bg-white/70 p-4">
              <div>
                <p className="text-[10px] font-bold text-ink-400">معدل الترم المتوقع</p>
                <p className="flex items-baseline gap-1">
                  <AnimatedNumber value={Math.round(projectedGpa * 100) / 100} decimals={2} className="font-display text-3xl font-black text-ink-950" />
                  <span className="text-xs text-ink-400" dir="ltr">/ 4.00</span>
                </p>
                <p className="mt-0.5 text-[10.5px] text-ink-400">
                  أقصى ممكن بكتابة ٣٠/٣٠ فيكل فاينل:{' '}
                  <span className="font-bold text-gold-700" dir="ltr">{maxGpa.toFixed(2)}</span>
                </p>
              </div>
              {currentTermGpa !== null ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                      delta > 0.01
                        ? 'border-brand-500/30 bg-brand-500/[0.10] text-brand-700'
                        : delta < -0.01
                          ? 'border-ember-500/30 bg-ember-500/[0.08] text-ember-600'
                          : 'border-brand-900/10 bg-white/70 text-ink-500'
                    }`}
                  >
                    {delta > 0.01 ? <TrendingUp className="h-3.5 w-3.5" /> : delta < -0.01 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                    <span dir="ltr">{delta > 0 ? '+' : ''}{delta.toFixed(2)}</span>
                    عن معدلك الحالي
                  </span>
                  <button
                    type="button"
                    onClick={() => setEstimates(Object.fromEntries(sorted.map((row) => [row.course.code, projectFinal(row.course)])))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-900/10 bg-white/70 text-ink-400 transition hover:text-gold-700"
                    title="إعادة القياسات الافتراضية"
                    aria-label="إعادة القياسات الافتراضية"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {sorted.map((row) => {
                const tone = toneOf(row.projected);
                return (
                  <div key={row.course.code} className="rounded-2xl border border-brand-900/10 bg-white/60 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-xs font-bold text-ink-800">
                        {row.course.name}
                        <span className="ms-2 text-[10px] text-ink-300" dir="ltr">{row.course.code}</span>
                      </p>
                      <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${tone.cls}`}>
                        {row.projected} · {row.letter}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={30}
                        step={1}
                        value={row.finalEst}
                        onChange={(event) =>
                          setEstimates((prev) => ({ ...prev, [row.course.code]: Number(event.target.value) }))
                        }
                        className="range-gold flex-1"
                        aria-label={`تقدير فاينل ${row.course.name}`}
                        dir="ltr"
                      />
                      <span className="w-14 shrink-0 text-center text-[10.5px] font-bold text-ink-500" dir="ltr">
                        {row.finalEst}/30
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** تقدير افتراضي: نسبة ما تحقق من المكونات المعروفة تنعكس على الفاينل (من ٣٠) */
function projectFinal(course: GpaCourse): number {
  const c = course.components;
  if (!c) return 0;
  if (c.final != null) return Math.min(30, Math.round(c.final));
  const knownMax =
    (c.quiz != null ? GRADE_MAX.QUIZ : 0) +
    (c.work != null ? GRADE_MAX.WORK : 0) +
    (c.midterm != null ? GRADE_MAX.MIDTERM : 0);
  if (!knownMax) return 0;
  const base = (c.quiz ?? 0) + (c.work ?? 0) + (c.midterm ?? 0);
  const rate = base / knownMax;
  return Math.round(Math.max(0, Math.min(30, rate * GRADE_MAX.FINAL)));
}
