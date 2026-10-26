import { prisma } from './db';

/* ── إعدادات سياسة الحضور — قابلة للتعديل من الأدمن عبر AppSetting ── */
export type AttendancePolicy = {
  attendanceThreshold: number; // 75 — أقل نسبة تُعدّ إنذار
  maxAbsence: number;          // 25 — أكبر نسبة غياب قبل الحرمان
  lateCountsAs: number;        // 0.5 — وزن التأخير (0.5 حاضر نصف)
};

export async function getPolicy(): Promise<AttendancePolicy> {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ['attendanceThreshold', 'maxAbsence', 'lateCountsAs'] } },
  });
  const map = new Map(settings.map((s) => [s.key, Number(s.value)]));
  return {
    attendanceThreshold: isFinite(map.get('attendanceThreshold') ?? NaN) ? map.get('attendanceThreshold')! : 75,
    maxAbsence: isFinite(map.get('maxAbsence') ?? NaN) ? map.get('maxAbsence')! : 25,
    lateCountsAs: isFinite(map.get('lateCountsAs') ?? NaN) ? map.get('lateCountsAs')! : 0.5,
  };
}

/** حالة الطالب في مادة وفق السياسة */
export type AttendanceStatus = 'SAFE' | 'WARNING' | 'DENIED';

export function gradeStatus(attendancePct: number, policy: AttendancePolicy): AttendanceStatus {
  if (attendancePct < 100 - policy.maxAbsence) return 'DENIED'; // الغياب تجاوز الحد
  if (attendancePct < policy.attendanceThreshold) return 'WARNING';
  return 'SAFE';
}

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  SAFE: 'آمن',
  WARNING: 'مخاطرة',
  DENIED: 'محروم',
};

/** إحصاءة مادة واحدة لطالب واحد — تُبنى من سجلات الحضور + عدد المحاضرات */
export function computeStudentCourseStats(
  present: number,
  late: number,
  totalLectures: number,
  policy: AttendancePolicy,
) {
  const attended = present + policy.lateCountsAs * late;
  const pct = totalLectures > 0 ? Math.round((attended / totalLectures) * 1000) / 10 : 100;
  return {
    present, late, totalLectures,
    attendancePct: pct,
    status: gradeStatus(pct, policy),
  };
}
