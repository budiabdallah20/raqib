/**
 * اختبارات قواعد التسجيل — حتمية وبلا أي خدمة خارجية.
 */
import { describe, it, expect } from 'vitest';
import {
  creditsOf,
  canAddCourse,
  findSlotConflicts,
  describeConflict,
  effectiveCandidateSlots,
  DEFAULT_CREDIT_LIMIT,
} from '@/lib/enrollment';

describe('creditsOf', () => {
  it('يجمع الساعات مع معاملة null كـ 3', () => {
    expect(creditsOf([{ creditHours: 3 }, { creditHours: 4 }, { creditHours: null }])).toBe(10);
  });
  it('قائمة فارغة ⇒ صفر', () => {
    expect(creditsOf([])).toBe(0);
  });
});

describe('canAddCourse (حد 17 ساعة)', () => {
  it('بالضبط على الحد ⇒ مقبول', () => {
    expect(canAddCourse(14, { creditHours: 3 }, DEFAULT_CREDIT_LIMIT).ok).toBe(true); // 17
  });
  it('تجاوز بساعة ⇒ مرفوض مع رسالة', () => {
    const r = canAddCourse(15, { creditHours: 3 }, DEFAULT_CREDIT_LIMIT); // 18
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('CREDIT_LIMIT');
  });
  it('معاملة null كـ 3 ساعات', () => {
    expect(canAddCourse(15, { creditHours: null }, DEFAULT_CREDIT_LIMIT).ok).toBe(false);
    expect(canAddCourse(14, { creditHours: null }, DEFAULT_CREDIT_LIMIT).ok).toBe(true);
  });
  it('حد مخصص (13 مثلًا) يُحترم', () => {
    expect(canAddCourse(12, { creditHours: 3 }, 13).ok).toBe(false);
  });
  it('صفر ساعات مسجلة ⇒ أي مقرر يسع', () => {
    expect(canAddCourse(0, { creditHours: 4 }, DEFAULT_CREDIT_LIMIT).ok).toBe(true);
  });
});

describe('findSlotConflicts', () => {
  const mySlots = [
    { day: 2, period: 1, courseId: 'MAT201' },
    { day: 3, period: 2, courseId: 'COM201' },
  ];
  it('لا تعارض عند اختلاف اليوم أو الحصة', () => {
    const conflicts = findSlotConflicts(mySlots, [{ day: 2, period: 2, courseId: 'MAT203' }], 'MAT203');
    expect(conflicts).toHaveLength(0);
  });
  it('تعارض في نفس (اليوم، الحصة)', () => {
    const conflicts = findSlotConflicts(mySlots, [{ day: 2, period: 1, courseId: 'MAT305' }], 'MAT305');
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.myCourseId).toBe('MAT201');
  });
  it('تعارضان يعتبران تعارضين مميزين بلا تكرار لنفس الخانة', () => {
    const conflicts = findSlotConflicts(
      [...mySlots, { day: 2, period: 1, courseId: 'MAT201b' }],
      [
        { day: 2, period: 1, courseId: 'X' },
        { day: 2, period: 1, courseId: 'X' },
      ],
      'X',
    );
    expect(conflicts).toHaveLength(1); // نفس الخانة تُبلَّغ مرة واحدة
  });
  it('مرشح له عدة أوقات — كل تعارض يُبلَّغ وكذلك الأوقات السليمة تُهمل', () => {
    const conflicts = findSlotConflicts(
      mySlots,
      [
        { day: 2, period: 1, courseId: 'Y' },
        { day: 3, period: 2, courseId: 'Y' },
        { day: 4, period: 4, courseId: 'Y' },
      ],
      'Y',
    );
    expect(conflicts).toHaveLength(2);
  });
  it('describeConflict ينتج وصفًا عربيًا مقروءًا', () => {
    const [c] = findSlotConflicts(mySlots, [{ day: 2, period: 1, courseId: 'X' }], 'X');
    expect(describeConflict(c!)).toContain('الإثنين');
    expect(describeConflict(c!)).toContain('1');
  });
});

describe('effectiveCandidateSlots', () => {
  const slots = [
    { day: 2, period: 1, courseId: 'X', group: 'A' },
    { day: 3, period: 1, courseId: 'X', group: 'B' },
  ];
  it('لو للمقرر شعبة لجروب الطالب تُرجع تلك فقط', () => {
    const result = effectiveCandidateSlots(slots, 'A');
    expect(result).toHaveLength(1);
    expect(result[0]!.group).toBe('A');
  });
  it('لو لا شعبة لجروب الطالب تُرجع كل الشعب (التي سيضطر للالتحاق بها)', () => {
    const onlyB = [{ day: 2, period: 1, courseId: 'X', group: 'B' }];
    expect(effectiveCandidateSlots(onlyB, 'A')).toEqual(onlyB);
  });
  it('لا شعب للمقرر إطلاقًا ⇒ قائمة فارغة', () => {
    expect(effectiveCandidateSlots([], 'A')).toEqual([]);
  });
});

describe('cross-group slot conflict (شعبة بغروب آخر بنفس الوقت)', () => {
  const mySlots = [{ day: 2, period: 1, courseId: 'MAT201', group: 'A' }];
  it('مقرر يُعقد للجروب الآخر فقط بنفس اليوم/الحصة ⇒ تعارض حتمي', () => {
    const candidate = effectiveCandidateSlots([{ day: 2, period: 1, courseId: 'MAT305', group: 'B' }], 'A');
    const conflicts = findSlotConflicts(mySlots, candidate, 'MAT305');
    expect(conflicts).toHaveLength(1);
  });
  it('مقرر له شعبة بجروب الطالب في وقت آخر ⇒ بلا تعارض', () => {
    const candidate = effectiveCandidateSlots(
      [
        { day: 2, period: 1, courseId: 'MAT305', group: 'B' },
        { day: 4, period: 2, courseId: 'MAT305', group: 'A' },
      ],
      'A',
    );
    expect(findSlotConflicts(mySlots, candidate, 'MAT305')).toHaveLength(0);
  });
});
