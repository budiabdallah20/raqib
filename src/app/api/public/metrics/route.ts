/**
 * PERIARE — أرقام عامة للـ Landing
 * GET /api/public/metrics — بلا مصادقة. كل الرقم محسوب فعليًا من الـDB،
 * وعند وجود تسجيلات وهمية (Demo Mode) نوضح ذلك بوضوح على الواجهة.
 * §4.1: عدّادات الهبوط الرسمية: طلاب · دكاترة · مواد · محاضرات — ولا رقم مُلفَّق.
 */
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [studentCount, professorCount, courseCount, lectureCount, scanCount, attendanceAgg, platformStatusSetting, departmentsRows] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'PROFESSOR', isActive: true, approvedAt: { not: null } } }),
      prisma.course.count(),
      prisma.lecture.count(),
      prisma.attendance.count(),
      prisma.attendance.groupBy({ by: ['status'], _count: true }),
      // حالة المنصة (ONLINE/MAINTENANCE) — يتحكم فيها الأدمن من لوحة الإعدادات
      prisma.appSetting.findUnique({ where: { key: 'platformStatus' } }),
      // أقسام حقيقية من المواد المبنية في القاعدة — تغذي اختيار «القسم» في التسجيل
      prisma.course.findMany({
        select: { department: true },
        distinct: ['department'],
        orderBy: { department: 'asc' },
        take: 12,
      }),
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
        professors: professorCount,
        courses: courseCount,
        lectures: lectureCount,
        scans: scanCount,
        attendancePct: attendanceRatio,
      },
      departments: departmentsRows
        .map((row) => row.department)
        .filter((department): department is string => Boolean(department)),
      demoMode: false,
      platformStatus: platformStatusSetting?.value === 'MAINTENANCE' ? 'MAINTENANCE' : 'ONLINE',
      dbAvailable: true,
      updatedAt: new Date().toISOString(),
    }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    // القاعدة غير متاحة (بيئة عرض بلا DATABASE_URL) — صفر نزيهة بدل 500،
    // والواجهة صُمّمت لتُقرأ جميلة قبل وصول الأرقام.
    return Response.json({
      metrics: { students: 0, professors: 0, courses: 0, lectures: 0, scans: 0, attendancePct: 0 },
      departments: [],
      demoMode: false,
      dbAvailable: false,
      updatedAt: new Date().toISOString(),
    }, { headers: { 'cache-control': 'no-store' } });
  }
}
