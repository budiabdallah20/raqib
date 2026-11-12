/**
 * 📐 قواعد التسجيل الذاتي — دوال pure قابلة للاختبار (vitest)
 * تُفرض في الخادم داخل معاملة (Serializable) — لا اعتماد على أي تحقق من المتصفح.
 */

export type SlotLike = { day: number; period: number; courseId: string };
export type GroupSlot = SlotLike & { group: string };
export type CourseCredit = { creditHours: number | null };

export const DEFAULT_CREDIT_LIMIT = 17;
export const DEFAULT_COURSE_CREDITS = 3;

/** مجموع الساعات المعتمدة — معاملة null كـ 3 ساعات (المقرر العادي) */
export function creditsOf(courses: CourseCredit[], perCourseFallback = DEFAULT_COURSE_CREDITS): number {
  return courses.reduce((sum, course) => sum + (course.creditHours ?? perCourseFallback), 0);
}

export type EnrollmentGate =
  | { ok: true }
  | { ok: false; reason: 'CREDIT_LIMIT' | 'ALREADY_ENROLLED'; detail: string };

/** هل تتسع الساعات؟ (يُستدعى داخل المعاملة بعد قراءة مُحدّثة) */
export function canAddCourse(currentCredits: number, incomingCourse: CourseCredit, maxCredits: number): EnrollmentGate {
  const incoming = incomingCourse.creditHours ?? DEFAULT_COURSE_CREDITS;
  if (currentCredits + incoming > maxCredits) {
    return {
      ok: false,
      reason: 'CREDIT_LIMIT',
      detail: `الحد الأقصى ${maxCredits} ساعة — مسجّل حاليًا ${currentCredits}، والمقرر ${incoming}، فالمجموع ${currentCredits + incoming} يتجاوز الحد`,
    };
  }
  return { ok: true };
}

export type SlotConflict = { day: number; period: number; myCourseId: string; candidateCourseId: string };

/**
 * تعارض المواعيد لنفس الجروب في نفس الترم:
 * نفس (اليوم، الحصة) في مقرر مسجّل ومقرر مرشح ⇒ تعارض.
 */
export function findSlotConflicts(
  mySlots: SlotLike[],
  candidateSlots: SlotLike[],
  candidateCourseId: string,
): SlotConflict[] {
  const mine = new Map<string, string>(); // "day:period" → courseId
  for (const slot of mySlots) mine.set(`${slot.day}:${slot.period}`, slot.courseId);

  const conflicts: SlotConflict[] = [];
  const seen = new Set<string>();
  for (const slot of candidateSlots) {
    const key = `${slot.day}:${slot.period}`;
    const mineCourseId = mine.get(key);
    if (mineCourseId && !seen.has(key)) {
      seen.add(key);
      conflicts.push({ day: slot.day, period: slot.period, myCourseId: mineCourseId, candidateCourseId });
    }
  }
  return conflicts;
}

/**
 * الخانات الفعلية التي سيحضرها الطالب للمقرر المرشح:
 * - لو المقرر له شعبة لجروب الطالب → تلك الأوقات هي التي ستُحضر (unique محصور بـ unique([group,day,period,term]))
 * - لو المقرر يُعقد فقط لجروب آخر → الطالب يحضر تلك الشعبة → نفس الأوقات هي المرجع
 * في الحالتين المقارنة تتم زمنيًا بحت: يوم + حصة.
 */
export function effectiveCandidateSlots(allSlots: GroupSlot[], myGroup: string): GroupSlot[] {
  const mine = allSlots.filter((slot) => slot.group === myGroup);
  return mine.length > 0 ? mine : allSlots;
}

export const DAY_AR: Record<number, string> = {
  1: 'الأحد',
  2: 'الإثنين',
  3: 'الثلاثاء',
  4: 'الأربعاء',
  5: 'الخميس',
  6: 'الجمعة',
  7: 'السبت',
};

export function describeConflict(conflict: SlotConflict): string {
  return `${DAY_AR[conflict.day] ?? `يوم ${conflict.day}`} · الحصة ${conflict.period}`;
}
