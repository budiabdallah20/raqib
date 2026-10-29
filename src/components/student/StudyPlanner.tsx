'use client';

/**
 * 📚 مخطط الراجعة الأسبوعي — توصية ساعات راجعة لكل مادة من الساعات المعتمدة،
 * باين تيك بعلامات تسمية أسبوعية محفوظة محليًا + عدّاد أسبوع متواصل.
 */
import * as React from 'react';
import { Check, Flame, TimerReset } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from './EmptyState';
import { weekKey, togglePlannerItem, bumpPlannerStreak, usePortalPrefs } from '@/lib/portal-prefs';
import { AnimatedNumber } from './AnimatedNumber';

export type PlannerCourse = { code: string; name: string; creditHours: number };

/** توصية ساعات الراجعة: الساعات المعتمدة × ٢٫٥ — دائماً ٢ على الأقل */
export function recommendedHours(creditHours: number): number {
  return Math.max(2, Math.round(creditHours * 2.5 * 2) / 2);
}

export function StudyPlanner({ courses }: { courses: PlannerCourse[] }) {
  const prefs = usePortalPrefs();
  const week = weekKey();
  const keys = courses.map((course) => course.code);
  const totalHours = courses.reduce((acc, course) => acc + recommendedHours(course.creditHours), 0);

  const doneCount = keys.filter((key) => prefs.plannerDone[key]).length;
  const progress = keys.length ? Math.round((doneCount / keys.length) * 100) : 0;

  // ترقية أسبوع التواصل أول ما يعدي الـ ٦٠٪
  React.useEffect(() => {
    bumpPlannerStreak(week, progress);
  }, [week, progress]);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>مخطط الراجعة الأسبوعي</CardTitle>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-ember-500/25 bg-ember-500/[0.07] px-2.5 py-1 text-[10.5px] font-bold text-ember-600">
            <Flame className="h-3 w-3" />
            <AnimatedNumber value={prefs.plannerStreak} className="font-display" /> أسبوع متواصل
          </span>
          <span className="rounded-full border border-brand-900/10 bg-white/70 px-2.5 py-1 text-[10.5px] text-ink-500" dir="ltr">
            {week}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!courses.length ? (
          <EmptyState kind="notes" compact title="مفيش مواد متسجلة تكتب مخطط لرهام" />
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-2xl border border-gold-400/25 bg-gold-400/[0.07] px-4 py-3">
              <TimerReset className="h-5 w-5 shrink-0 text-gold-700" />
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-bold text-gold-800">
                  التوصية الإجمالية: {roundHalf(totalHours)} ساعة راجعة هذا الأسبوع
                </p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gold-900/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-gold-600 to-gold-400 transition-[width] duration-700"
                    style={{ width: `${Math.max(2, progress)}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 font-display text-lg font-black text-ink-950" dir="ltr">{progress}%</span>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {courses.map((course) => {
                const key = `${week}:${course.code}`;
                const done = Boolean(prefs.plannerDone[key]);
                return (
                  <label
                    key={course.code}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                      done
                        ? 'border-brand-500/30 bg-brand-500/[0.07]'
                        : 'border-brand-900/10 bg-white/60 hover:border-gold-400/35 hover:bg-gold-400/[0.05]'
                    }`}
                  >
                    <input type="checkbox" className="sr-only" checked={done} onChange={() => togglePlannerItem(course.code)} />
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                        done ? 'border-brand-500/50 bg-brand-500 text-white' : 'border-brand-900/15 bg-white'
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-xs font-bold ${done ? 'text-brand-700 line-through' : 'text-ink-800'}`}>
                        {course.name}
                      </span>
                      <span className="block text-[10px] text-ink-400" dir="ltr">{course.code}</span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-white/75 px-2 py-1 text-[10.5px] font-bold text-ink-600">
                      {recommendedHours(course.creditHours)} ساعة
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] leading-relaxed text-ink-300">
              المعادلة: ساعات المقرر × ٢٫٥ أسبوعيًا (مستمده من أرصدة الجدول الأكاديمي) — علاماتك الكليك محفوظة على جهازك
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function roundHalf(value: number) {
  return Math.round(value * 2) / 2;
}
