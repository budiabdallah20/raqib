/**
 * 🎯 محرك مخاطر الطالب — حتمي 100% (بدون ML وبدون شبكة)
 *
 * يجمع ثلاث إشارات موزونة إلى درجة خطر 0..100:
 *   • الحضور      (وزن افتراضي 40%) — كلما قل الحضور زاد الخطر
 *   • الدرجة الموزونة مقابل الإيقاع المتوقع (35%) — ينبني على ما نُشر فعلاً من درجات
 *   • التسليمات المتأخرة/المتروكة (25%)
 *
 * كل شيء pure: نفس المدخلات ⇒ نفس المخرجات، وقابل للاختبار في vitest.
 * لا يُرسل أي شيء لأي جهة خارجية. الأوزان قابلة للضبط عبر AppSetting
 * (risk_w_attendance / risk_w_grade / risk_w_task) ليطغى ما يضبطه الأدمن.
 */

export const RISK_WEIGHTS_DEFAULT = {
  attendance: 0.4,
  grade: 0.35,
  task: 0.25,
} as const;

export type RiskWeights = { attendance: number; grade: number; task: number };
export type RiskBand = 'SAFE' | 'WATCH' | 'CRITICAL';

export type RiskInput = {
  /** نسبة الحضور الموزونة 0..100 (مع احتساب تأخر ككسر). null = لا توجد محاضرات مسجلة بعد */
  attendancePct: number | null;
  /** مجموع درجات الطالب في المكونات المُدخلة (كويز+أعمال+ميدترم) */
  gradeCurrent: number | null;
  /** أقصى مجموع ممكن لنفس المكونات المُدخلة (بحد أقصى 70 بدون النهائي) */
  gradeEnteredMax: number;
  /** عدد التاسكات المطلوب تسليمها ومرّ موعدها */
  tasksDue: number;
  /** عدد ما لم يسلّمه من تلك التاسكات */
  tasksMissed: number;
};

export type RiskResult = {
  /** 0..100 — أعلى = أخطار */
  score: number;
  band: RiskBand;
  components: { attendance: number; grade: number; task: number };
  /** أسباب مقروءة توضح لماذا ارتفعت الدرجة (عربي) */
  reasons: string[];
};

const PASS_MARK = 60;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

/** خطر الحضور: غياب 100% ⇒ خطر 100 */
export function attendanceRiskComponent(attendancePct: number | null): number {
  if (attendancePct === null || Number.isNaN(attendancePct)) return 30; // لا بيانات ⇒ خطر خفيف
  return clamp(100 - attendancePct);
}

/**
 * خطر الدرجة: يقارن ما حققه الطالب من «أقصى ما دخل فعلاً من مكونات» بالحد الأدنى المتوقع للنجاح (60).
 * مثال: أدخل الأستاذ كويز (20) + أعمال (20) = 40 كحد أقصى، الإيقاع المتوقع = 60% من 40 = 24.
 * لو الطالب جمع 10 ⇒ الخطر = (24-10)/24 ≈ 58.
 */
export function gradeRiskComponent(gradeCurrent: number | null, gradeEnteredMax: number): number {
  if (gradeCurrent === null || gradeEnteredMax <= 0) return 25; // لا توجد درجات بعد ⇒ خطر خفيف
  const expected = (PASS_MARK / 100) * gradeEnteredMax;
  if (expected <= 0) return 25;
  const shortfall = ((expected - clamp(gradeCurrent, 0, gradeEnteredMax)) / expected) * 100;
  return clamp(shortfall);
}

/** خطر التسليمات: نسبة التاسكات المتروكة من المستحقة */
export function taskRiskComponent(tasksDue: number, tasksMissed: number): number {
  if (tasksDue <= 0) return 0; // لا توجد تاسكات مستحقة ⇒ لا خطر
  return clamp((tasksMissed / tasksDue) * 100);
}

export function normalizeWeights(weights?: Partial<RiskWeights>): RiskWeights {
  const raw = {
    attendance: weights?.attendance ?? RISK_WEIGHTS_DEFAULT.attendance,
    grade: weights?.grade ?? RISK_WEIGHTS_DEFAULT.grade,
    task: weights?.task ?? RISK_WEIGHTS_DEFAULT.task,
  };
  const sum = raw.attendance + raw.grade + raw.task;
  if (!Number.isFinite(sum) || sum <= 0) return { ...RISK_WEIGHTS_DEFAULT };
  return { attendance: raw.attendance / sum, grade: raw.grade / sum, task: raw.task / sum };
}

export function bandForScore(score: number): RiskBand {
  if (score >= 65) return 'CRITICAL';
  if (score >= 35) return 'WATCH';
  return 'SAFE';
}

export const BAND_LABEL: Record<RiskBand, string> = {
  SAFE: 'آمن',
  WATCH: 'تحت الملاحظة',
  CRITICAL: 'خطر',
};

export function computeRiskScore(input: RiskInput, weights?: Partial<RiskWeights>): RiskResult {
  const w = normalizeWeights(weights);
  const attendance = attendanceRiskComponent(input.attendancePct);
  const grade = gradeRiskComponent(input.gradeCurrent, input.gradeEnteredMax);
  const task = taskRiskComponent(input.tasksDue, input.tasksMissed);

  const score = Math.round(attendance * w.attendance + grade * w.grade + task * w.task);
  const band = bandForScore(score);

  const reasons: string[] = [];
  if (input.attendancePct !== null && input.attendancePct < 75) {
    reasons.push(`حضور ${Math.round(input.attendancePct)}% أقل من الحد الأدنى (75%)`);
  } else if (input.attendancePct === null) {
    reasons.push('لا توجد محاضرات مسجلة بعد لحساب الحضور');
  }
  if (input.gradeCurrent !== null && input.gradeEnteredMax > 0) {
    const expected = (PASS_MARK / 100) * input.gradeEnteredMax;
    if (expected > 0 && input.gradeCurrent < expected) {
      reasons.push(`مجموع ${Math.round(input.gradeCurrent)} من ${Math.round(input.gradeEnteredMax)} أقل من الإيقاع المتوقع للنجاح (${Math.round(expected)})`);
    }
  } else if (input.gradeCurrent === null) {
    reasons.push('لا توجد درجات مُدخلة بعد');
  }
  if (input.tasksDue > 0 && input.tasksMissed > 0) {
    reasons.push(`${input.tasksMissed} من ${input.tasksDue} تاسك مستحق لم يُسلَّم`);
  }
  if (reasons.length === 0) reasons.push('مؤشرات مستقرة — استمر هكذا');

  return {
    score,
    band,
    components: { attendance: Math.round(attendance), grade: Math.round(grade), task: Math.round(task) },
    reasons,
  };
}
