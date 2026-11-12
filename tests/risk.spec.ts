/**
 * اختبارات محرك مخاطر الطالب — حتمية 100% وبدون أي خدمة خارجية.
 * نفس المدخلات ⇒ نفس النتيجة في كل تشغيلة.
 */
import { describe, it, expect } from 'vitest';
import {
  attendanceRiskComponent,
  gradeRiskComponent,
  taskRiskComponent,
  normalizeWeights,
  bandForScore,
  computeRiskScore,
  RISK_WEIGHTS_DEFAULT,
} from '@/lib/risk';

describe('attendanceRiskComponent', () => {
  it('لا توجد محاضرات ⇒ خطر خفيف 30 (بدون معاقبة الطالب على غياب البيانات)', () => {
    expect(attendanceRiskComponent(null)).toBe(30);
    expect(attendanceRiskComponent(NaN)).toBe(30);
  });
  it('حضور كامل ⇒ صفر خطر، غياب كامل ⇒ خطر أقصى', () => {
    expect(attendanceRiskComponent(100)).toBe(0);
    expect(attendanceRiskComponent(0)).toBe(100);
  });
  it('يقتطع القيم خارج 0..100', () => {
    expect(attendanceRiskComponent(150)).toBe(0);
    expect(attendanceRiskComponent(-20)).toBe(100);
  });
});

describe('gradeRiskComponent', () => {
  it('لا توجد درجات مُدخلة ⇒ خطر خفيف 25', () => {
    expect(gradeRiskComponent(null, 0)).toBe(25);
  });
  it('تحقيق الإيقاع المتوقع كاملًا ⇒ صفر خطر', () => {
    // أدخل كويز+أعمال = 40 كحد أقصى ⇒ المتوقع = 24؛ حقق 24 ⇒ 0
    expect(gradeRiskComponent(24, 40)).toBe(0);
    expect(gradeRiskComponent(40, 40)).toBe(0);
  });
  it('صفر في المتوقع ⇒ خطر 100', () => {
    expect(gradeRiskComponent(0, 40)).toBe(100);
  });
  it('نص الإيقاع المتوقع ⇒ خطر ≈ 50', () => {
    expect(gradeRiskComponent(12, 40)).toBe(50);
  });
  it('مجموع يتجاوز الحد الأقصى لمكوناته يُقتطع قبل الحساب', () => {
    expect(gradeRiskComponent(999, 40)).toBe(0);
  });
});

describe('taskRiskComponent', () => {
  it('لا توجد تاسكات مستحقة ⇒ صفر خطر', () => {
    expect(taskRiskComponent(0, 0)).toBe(0);
  });
  it('الكل متروك ⇒ 100، النصف ⇒ 50', () => {
    expect(taskRiskComponent(4, 4)).toBe(100);
    expect(taskRiskComponent(4, 2)).toBe(50);
  });
});

describe('normalizeWeights', () => {
  it('بدون مدخل ⇒ الافتراضيات', () => {
    expect(normalizeWeights()).toEqual(RISK_WEIGHTS_DEFAULT);
  });
  it('يطبّع أوزانًا لا تجمع 1 إلى مجموع 1', () => {
    const w = normalizeWeights({ attendance: 2, grade: 1, task: 1 });
    expect(w.attendance).toBeCloseTo(0.5);
    expect(w.grade).toBeCloseTo(0.25);
    expect(w.task).toBeCloseTo(0.25);
  });
  it('كلها أصفار ⇒ يرجع للافتراضيات (حماية من القسمة على صفر)', () => {
    expect(normalizeWeights({ attendance: 0, grade: 0, task: 0 })).toEqual(RISK_WEIGHTS_DEFAULT);
  });
});

describe('bandForScore', () => {
  it('الحدود الفاصلة: 34/35 و64/65', () => {
    expect(bandForScore(0)).toBe('SAFE');
    expect(bandForScore(34)).toBe('SAFE');
    expect(bandForScore(35)).toBe('WATCH');
    expect(bandForScore(64)).toBe('WATCH');
    expect(bandForScore(65)).toBe('CRITICAL');
    expect(bandForScore(100)).toBe('CRITICAL');
  });
});

describe('computeRiskScore', () => {
  it('طالب منتظم: حضور ممتاز + درجات جيدة + كل التسليمات ⇒ SAFE', () => {
    const r = computeRiskScore({
      attendancePct: 95,
      gradeCurrent: 55, // على 70 متاحة — أعلى بكثير من المتوقع (42)
      gradeEnteredMax: 70,
      tasksDue: 5,
      tasksMissed: 0,
    });
    expect(r.band).toBe('SAFE');
    expect(r.score).toBeLessThan(35);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('طالب متعثر: حضور ضعيف + درجات متدنية + مهام متروكة ⇒ CRITICAL', () => {
    const r = computeRiskScore({
      attendancePct: 40,
      gradeCurrent: 8,
      gradeEnteredMax: 70,
      tasksDue: 6,
      tasksMissed: 5,
    });
    expect(r.band).toBe('CRITICAL');
    expect(r.score).toBeGreaterThanOrEqual(65);
    expect(r.reasons.some((reason) => reason.includes('حضور'))).toBe(true);
  });

  it('حتمي: نفس المدخلات تعطي نفس المخرجات دائمًا', () => {
    const input = { attendancePct: 62, gradeCurrent: 20, gradeEnteredMax: 40, tasksDue: 3, tasksMissed: 1 };
    expect(computeRiskScore(input)).toEqual(computeRiskScore(input));
  });

  it('خطر الحضور وحده لا يكفي للـ CRITICAL لو باقي المؤشرات ممتازة', () => {
    const r = computeRiskScore({
      attendancePct: 50, // attendanceRisk = 50 → مساهمة 20
      gradeCurrent: 70,
      gradeEnteredMax: 70, // gradeRisk = 0
      tasksDue: 0,
      tasksMissed: 0, // taskRisk = 0
    });
    expect(r.band).toBe('SAFE');
  });

  it('الأوزان تُحترم: تصفير وزن المهام يلغي أثر التاسكات', () => {
    const base = computeRiskScore(
      { attendancePct: 90, gradeCurrent: 60, gradeEnteredMax: 70, tasksDue: 10, tasksMissed: 10 },
      { attendance: 0.5, grade: 0.5, task: 0 },
    );
    const withTasks = computeRiskScore(
      { attendancePct: 90, gradeCurrent: 60, gradeEnteredMax: 70, tasksDue: 10, tasksMissed: 10 },
      { attendance: 1 / 3, grade: 1 / 3, task: 1 / 3 },
    );
    expect(base.score).toBeLessThan(withTasks.score);
  });

  it('المجموع يقع دائمًا داخل 0..100', () => {
    for (const attendancePct of [null, 0, 33, 66, 100]) {
      for (const gradeCurrent of [null, 0, 30, 70]) {
        const r = computeRiskScore({ attendancePct, gradeCurrent, gradeEnteredMax: 70, tasksDue: 4, tasksMissed: 3 });
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(100);
      }
    }
  });
});
