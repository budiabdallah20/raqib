/**
 * اختبارات سياسة الحضور — WP8: العتبة/الحرمان/وزن التأخير
 */
import { describe, it, expect } from 'vitest';
import { gradeStatus, computeStudentCourseStats, type AttendancePolicy } from '@/lib/attendance-policy';

const policy: AttendancePolicy = { attendanceThreshold: 75, maxAbsence: 25, lateCountsAs: 0.5 };

describe('gradeStatus', () => {
  it('آمن فوق العتبة', () => {
    expect(gradeStatus(90, policy)).toBe('SAFE');
    expect(gradeStatus(75, policy)).toBe('SAFE');
  });
  it('مخاطرة تحت العتبة قبل منطقة الحرمان (حالة عتبة أعلى من الحرمان)', () => {
    const p: AttendancePolicy = { attendanceThreshold: 80, maxAbsence: 25, lateCountsAs: 0.5 };
    expect(gradeStatus(78, p)).toBe('WARNING');
    expect(gradeStatus(50, p)).toBe('DENIED');
  });
  it('محروم تحت الحد الأدنى (<75% أي غياب >25%)', () => {
    expect(gradeStatus(74, policy)).toBe('DENIED');
    expect(gradeStatus(20, policy)).toBe('DENIED');
  });
});

describe('computeStudentCourseStats', () => {
  it('نسبة صحيحة بكامل المحاضرات', () => {
    const s = computeStudentCourseStats(8, 2, 10, policy);
    // (8 + 0.5×2)/10 = 90%
    expect(s.attendancePct).toBe(90);
    expect(s.status).toBe('SAFE');
  });

  it('التأخير يعادل نصف حاضر', () => {
    const s = computeStudentCourseStats(0, 10, 10, policy);
    expect(s.attendancePct).toBe(50);
    expect(s.status).toBe('DENIED');
  });

  it('صفر محاضرات → 100% (بدون تعنيف ظني)', () => {
    const s = computeStudentCourseStats(0, 0, 0, policy);
    expect(s.attendancePct).toBe(100);
    expect(s.status).toBe('SAFE');
  });

  it('طالب مقرب للحرم يعود بمسح محاضر إضافي', () => {
    // 7 حاضر من 14 = 50% محروم؛ بمسح حضورها 6 محاضرات إضافي → 13/14 = 92.9% أمنة
    const before = computeStudentCourseStats(7, 0, 14, policy);
    expect(before.status).toBe('DENIED');
    const after = computeStudentCourseStats(13, 0, 14, policy);
    expect(after.status).toBe('SAFE');
  });
});
