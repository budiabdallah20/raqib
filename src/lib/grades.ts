/** مقياس الدرجات الموحّد — الإجمالي من 100
 * كويزات 20 + أعمال سنة 20 + ميدترم 30 + فاينل 30 = 100
 */
export const GRADE_MAX = { QUIZ: 20, WORK: 20, MIDTERM: 30, FINAL: 30 } as const;
export const GRADE_TOTAL_MAX = 100;

export type GradeLetter = 'A' | 'A-' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

const LETTER_TABLE: { min: number; letter: GradeLetter }[] = [
  { min: 90, letter: 'A' },
  { min: 85, letter: 'A-' },
  { min: 80, letter: 'B+' },
  { min: 75, letter: 'B' },
  { min: 70, letter: 'C+' },
  { min: 65, letter: 'C' },
  { min: 60, letter: 'D' },
  { min: 0, letter: 'F' },
];

export const LETTER_POINTS: Record<GradeLetter, number> = {
  A: 4,
  'A-': 3.7,
  'B+': 3.3,
  B: 3,
  'C+': 2.5,
  C: 2,
  D: 1.3,
  F: 0,
};

export const LETTER_LABEL: Record<GradeLetter, string> = {
  A: 'ممتاز',
  'A-': 'ممتاز جداً',
  'B+': 'جيد جداً +',
  B: 'جيد جداً',
  'C+': 'جيد +',
  C: 'جيد',
  D: 'مقبول',
  F: 'راسب',
};

/** حرف التقدير من الإجمالي (من 100) */
export function letterFor(total: number): GradeLetter {
  const capped = Math.max(0, Math.min(GRADE_TOTAL_MAX, total));
  return LETTER_TABLE.find((row) => capped >= row.min)?.letter ?? 'F';
}

/** نقاط المعدل (من 4) من الإجمالي (من 100) */
export function gpaPointFor(total: number): number {
  return LETTER_POINTS[letterFor(total)];
}

/** تنقية مجموع المكونات داخل مقياس 100 */
export function totalOf(parts: { quiz?: number | null; work?: number | null; midterm?: number | null; final?: number | null }): number {
  const sum = (parts.quiz ?? 0) + (parts.work ?? 0) + (parts.midterm ?? 0) + (parts.final ?? 0);
  return Math.max(0, Math.min(GRADE_TOTAL_MAX, Math.round(sum)));
}

/** مناطق الحالة: أخضر ≥75 · ذهبي 60–74 · أحمر <60 */
export type CourseZone = 'GREEN' | 'YELLOW' | 'RED';

export function zoneFor(total: number | null): CourseZone {
  if (total === null) return 'YELLOW';
  if (total >= 75) return 'GREEN';
  if (total >= 60) return 'YELLOW';
  return 'RED';
}
