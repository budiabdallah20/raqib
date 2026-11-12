import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pulse — غرفة العمليات الحية
 * مؤشرات لحظية + شذوذ تلقائي (deterministic) بدون أي خدمة خارجية مدفوعة.
 */
export async function GET() {
  try {
    await requireUser(['ADMIN']);

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // زمن استجابة قاعدة البيانات — قياس داخلي بحت
    const dbPingStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbPingStart;

    const [
      students,
      professors,
      courses,
      lecturesToday,
      lecturesOpen,
      lecturesCancelled30d,
      openTasks,
      ungradedSubmissions,
      lockedAccounts,
      failedLogins,
      enrollments,
      recentAudit,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'PROFESSOR' } }),
      prisma.course.count(),
      prisma.lecture.count({ where: { startsAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.lecture.count({ where: { isOpen: true, cancelledAt: null } }),
      prisma.lecture.count({ where: { cancelledAt: { not: null }, startsAt: { gte: thirtyDaysAgo } } }),
      prisma.task.count({ where: { status: 'OPEN', deadline: { gte: now } } }),
      prisma.taskSubmission.count({ where: { score: null } }),
      prisma.user.count({ where: { lockedUntil: { gt: now } } }),
      prisma.user.count({ where: { failedLoginAttempts: { gte: 3 } } }),
      prisma.enrollment.findMany({ where: { status: 'ACTIVE' }, select: { studentId: true, courseId: true } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          action: true,
          entity: true,
          userRole: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
    ]);

    // المحاضرات الماضية في آخر 30 يوم + حضورها (للنسب)
    const pastLectures = await prisma.lecture.findMany({
      where: { startsAt: { gte: thirtyDaysAgo, lt: now }, cancelledAt: null, isOpen: false },
      select: {
        id: true,
        title: true,
        courseId: true,
        startsAt: true,
        course: { select: { code: true, name: true } },
        _count: { select: { attendances: true } },
      },
    });

    const enrolledByCourse = new Map<string, number>();
    for (const row of enrollments) {
      enrolledByCourse.set(row.courseId, (enrolledByCourse.get(row.courseId) ?? 0) + 1);
    }

    // (أ) أضعف 5 محاضرات من حيث نسبة الحضور (معاملها ≥ 5 طلاب متوقع)
    const weakestLectures = pastLectures
      .map((lecture) => {
        const expected = enrolledByCourse.get(lecture.courseId) ?? 0;
        const attended = lecture._count.attendances;
        const pct = expected > 0 ? Math.round((attended / expected) * 100) : null;
        return {
          id: lecture.id,
          title: lecture.title,
          courseCode: lecture.course.code,
          startsAt: lecture.startsAt.toISOString(),
          attended,
          expected,
          pct,
        };
      })
      .filter((row) => row.expected >= 5 && row.pct !== null && row.pct < 60)
      .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))
      .slice(0, 5);

    // (ب) الطلاب الأقرب للحرمان: غياب متوقع − فعلي عبر كل مقرراتهم (آخر 30 يوم)
    const lecturesByCourse = new Map<string, number>();
    for (const lecture of pastLectures) {
      lecturesByCourse.set(lecture.courseId, (lecturesByCourse.get(lecture.courseId) ?? 0) + 1);
    }
    const expectedByStudent = new Map<string, number>();
    for (const row of enrollments) {
      expectedByStudent.set(
        row.studentId,
        (expectedByStudent.get(row.studentId) ?? 0) + (lecturesByCourse.get(row.courseId) ?? 0),
      );
    }
    const attendedRows = await prisma.attendance.groupBy({
      by: ['studentId'],
      where: { lecture: { startsAt: { gte: thirtyDaysAgo, lt: now }, cancelledAt: null } },
      _count: { _all: true },
    });
    const attendedByStudent = new Map(attendedRows.map((row) => [row.studentId, row._count._all]));
    const riskStudentIds = [...expectedByStudent.entries()]
      .filter(([, expected]) => expected >= 3)
      .map(([studentId, expected]) => {
        const attended = attendedByStudent.get(studentId) ?? 0;
        const absencePct = Math.round(((expected - attended) / expected) * 100);
        return { studentId, expected, attended, absencePct };
      })
      .filter((row) => row.absencePct >= 50)
      .sort((a, b) => b.absencePct - a.absencePct)
      .slice(0, 5);
    const riskStudentUsers = riskStudentIds.length
      ? await prisma.user.findMany({
          where: { id: { in: riskStudentIds.map((row) => row.studentId) } },
          select: { id: true, name: true, studentCode: true },
        })
      : [];
    const userMap = new Map(riskStudentUsers.map((user) => [user.id, user]));
    const absenceRisk = riskStudentIds.map((row) => ({
      id: row.studentId,
      name: userMap.get(row.studentId)?.name ?? '—',
      studentCode: userMap.get(row.studentId)?.studentCode ?? null,
      absencePct: row.absencePct,
      missed: row.expected - row.attended,
      expected: row.expected,
    }));

    // (ج) مقررات لم تُعقد فيها محاضرة منذ 14 يومًا
    const latestLectureByCourse = await prisma.lecture.groupBy({
      by: ['courseId'],
      _max: { startsAt: true },
    });
    const latestMap = new Map(latestLectureByCourse.map((row) => [row.courseId, row._max.startsAt]));
    const allCourses = await prisma.course.findMany({ select: { id: true, code: true, name: true } });
    const silentCourses = allCourses
      .filter((course) => {
        const latest = latestMap.get(course.id);
        return !latest || latest < fourteenDaysAgo;
      })
      .slice(0, 8)
      .map((course) => ({
        id: course.id,
        code: course.code,
        name: course.name,
        lastLectureAt: latestMap.get(course.id)?.toISOString() ?? null,
      }));

    // شذوذ موحّد للعرض — كل بطاقة تشرح نفسها
    const anomalies: { id: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; title: string; detail: string; href?: string }[] = [];
    for (const lecture of weakestLectures) {
      if (lecture.pct !== null && lecture.pct < 40) {
        anomalies.push({
          id: `lecture-${lecture.id}`,
          severity: 'HIGH',
          title: `حضور ضعيف جدًا في ${lecture.courseCode}`,
          detail: `«${lecture.title}» — حضر ${lecture.attended} من ${lecture.expected} (${lecture.pct}%)`,
          href: '/admin/schedule',
        });
      }
    }
    if (absenceRisk.length > 0) {
      anomalies.push({
        id: 'absence-risk',
        severity: absenceRisk.some((row) => row.absencePct >= 75) ? 'HIGH' : 'MEDIUM',
        title: `${absenceRisk.length} طالب/طلاب يقتربون من الحرمان`,
        detail: 'غياب ≥ 50% من المحاضرات الماضية (آخر 30 يوم) عبر كل المقررات',
        href: '/admin/students',
      });
    }
    if (silentCourses.length > 0) {
      anomalies.push({
        id: 'silent-courses',
        severity: 'MEDIUM',
        title: `${silentCourses.length} مقرر بلا محاضرات منذ 14 يوم`,
        detail: silentCourses.map((course) => course.code).join('، '),
        href: '/admin/courses',
      });
    }
    if (ungradedSubmissions > 0) {
      anomalies.push({
        id: 'ungraded',
        severity: 'LOW',
        title: `${ungradedSubmissions} تسليم بانتظار التصحيح`,
        detail: 'تسليمات بدون درجة — يُنصح بالتنبيه على الدكاترة',
        href: '/admin/reports',
      });
    }
    if (lockedAccounts > 0 || failedLogins > 0) {
      anomalies.push({
        id: 'auth-locks',
        severity: lockedAccounts > 0 ? 'HIGH' : 'MEDIUM',
        title: `${lockedAccounts} حساب مقفول مؤقتًا · ${failedLogins} بحساب محاولات فاشلة`,
        detail: 'ربما محاولات دخول مشبوهة — راجع سجل التدقيق',
        href: '/admin/audit',
      });
    }
    if (lecturesCancelled30d > 0) {
      anomalies.push({
        id: 'cancelled',
        severity: 'LOW',
        title: `${lecturesCancelled30d} محاضرة أُلغيت خلال 30 يوم`,
        detail: 'الإلغاء لا يحذف السجل — طبيعي، لكن يستاهل نظرة',
        href: '/admin/schedule',
      });
    }

    return Response.json({
      generatedAt: now.toISOString(),
      db: { ok: true, latencyMs: dbLatencyMs },
      counts: {
        students,
        professors,
        courses,
        lecturesToday,
        lecturesOpen,
        lecturesCancelled30d,
        openTasks,
        ungradedSubmissions,
        lockedAccounts,
        failedLogins,
      },
      weakestLectures,
      absenceRisk,
      silentCourses,
      anomalies,
      recentAudit: recentAudit.map((row) => ({
        id: row.id,
        action: row.action,
        entity: row.entity,
        role: row.userRole,
        actor: row.user?.name ?? 'النظام',
        at: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل نبض المنصة');
  }
}
