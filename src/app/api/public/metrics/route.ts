/**
 * PERIARE — أرقام عامة للـ Landing
 * GET /api/public/metrics — بلا مصادقة. كل الرقم محسوب فعليًا من الـDB،
 * وعند وجود تسجيلات وهمية (Demo Mode) نوضح ذلك بوضوح على الواجهة.
 */
import { prisma } from '@/lib/db';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [studentCount, lectureCount, scanCount, attendanceAgg, demoModeSetting] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.lecture.count(),
      prisma.attendance.count(),
      prisma.attendance.groupBy({ by: ['status'], _count: true }),
      prisma.appSetting.findUnique({ where: { key: 'demoMode' } }),
    ]);

    const present = attendanceAgg.find((a) => a.status === 'PRESENT')?._count ?? 0;
    const late = attendanceAgg.find((a) => a.status === 'LATE')?._count ?? 0;
    // نسبة الحضور = (حاضر + 0.5·متأخر) / كل المسحات
    const attendanceRatio = scanCount > 0
      ? Math.round(((present + 0.5 * late) / scanCount) * 1000) / 10
      : 0;

    return Response.json({
      metrics: {
        students: studentCount,
        lectures: lectureCount,
        scans: scanCount,
        attendancePct: attendanceRatio,
      },
      demoMode: demoModeSetting?.value === '1',
      updatedAt: new Date().toISOString(),
    }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return jsonError('تعذر حساب الأرقام حاليًا', 500);
  }
}
