import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

function dayKey(date: Date) {
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${m}-${d}`;
}

function pct(part: number, whole: number): number | null {
  if (!whole) return null;
  return Math.round((part / whole) * 100);
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);

    const now = new Date();
    const seriesStart = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
    seriesStart.setHours(0, 0, 0, 0);

    // نافذة «المحاضرة الحية»: انطلقت قبل ساعتين كحد أقصى أو ستطلع خلال 10 دقائق
    const liveWindowStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const liveWindowEnd = new Date(now.getTime() + 10 * 60 * 1000);

    const [
      students,
      professors,
      courses,
      slots,
      taskCount,
      attendances,
      lecturesWithCourse,
      enrollGroups,
      levelGroups,
      activities,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'PROFESSOR' } }),
      prisma.course.count(),
      prisma.scheduleSlot.count(),
      prisma.task.count(),
      prisma.attendance.findMany({
        where: { scannedAt: { gte: seriesStart } },
        select: { scannedAt: true },
      }),
      prisma.lecture.findMany({
        select: { id: true, courseId: true, _count: { select: { attendances: true } } },
      }),
      prisma.enrollment.groupBy({ by: ['courseId'], _count: { _all: true } }),
      prisma.user.groupBy({
        by: ['level'],
        where: { role: 'STUDENT' },
        _count: { _all: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: { id: true, action: true, entity: true, detail: true, userRole: true, createdAt: true },
      }),
    ]);

    // ── الموجة الحية الإضافية: ملفات · تفكيك محاضرات · «حية الآن» · آخر الجلسات ──
    const [filesByKind, resourceTotal, lectureOpen, lectureCancelled, liveRows, recentLectures] =
      await Promise.all([
        prisma.resource.groupBy({ by: ['kind'], _count: { _all: true } }),
        prisma.resource.count(),
        prisma.lecture.count({ where: { isOpen: true, cancelledAt: null } }),
        prisma.lecture.count({ where: { cancelledAt: { not: null } } }),
        prisma.lecture.findMany({
          where: {
            isOpen: true,
            cancelledAt: null,
            startsAt: { gte: liveWindowStart, lte: liveWindowEnd },
          },
          orderBy: { startsAt: 'asc' },
          select: {
            id: true,
            title: true,
            location: true,
            startsAt: true,
            course: { select: { code: true, name: true } },
            _count: { select: { attendances: true } },
          },
        }),
        prisma.lecture.findMany({
          orderBy: { startsAt: 'desc' },
          take: 6,
          select: {
            id: true,
            courseId: true,
            title: true,
            location: true,
            startsAt: true,
            isOpen: true,
            cancelledAt: true,
            course: { select: { code: true, name: true } },
            _count: { select: { attendances: true } },
          },
        }),
      ]);

    // ── تجهيز خرائط: عدد المحاضرات والطلاب المسجلين لكل مقرر ──
    const lecturesByCourse = new Map<string, number>();
    for (const lecture of lecturesWithCourse) {
      lecturesByCourse.set(lecture.courseId, (lecturesByCourse.get(lecture.courseId) ?? 0) + 1);
    }
    const enrolledByCourse = new Map<string, number>();
    for (const row of enrollGroups) {
      enrolledByCourse.set(row.courseId, row._count._all);
    }

    // ── نسبة الحضور الإجمالية: سجلات الحضور الفعلية ÷ السجلات المتاحة (محاضرة × مسجلين في المقرر) ──
    const presentCount = attendances.length;
    let totalPossible = 0;
    for (const [courseId, lectureCount] of lecturesByCourse) {
      totalPossible += lectureCount * (enrolledByCourse.get(courseId) ?? 0);
    }
    const attendancePct = pct(presentCount, totalPossible);

    // ── سلسلة آخر 14 يوم (الأيام الفاضلة صفر) ──
    const countsByDay = new Map<string, number>();
    for (const row of attendances) {
      const key = dayKey(row.scannedAt);
      countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
    }
    const attendSeries: { date: string; count: number }[] = [];
    for (let i = 0; i < 14; i += 1) {
      const day = new Date(seriesStart.getTime() + i * 24 * 60 * 60 * 1000);
      const key = dayKey(day);
      attendSeries.push({ date: key, count: countsByDay.get(key) ?? 0 });
    }

    // ── توزيع الطلاب على الفرقه (نص 1..4 في السكيما) ──
    const levelMap = new Map<string, number>();
    for (const row of levelGroups) {
      if (row.level) levelMap.set(row.level, row._count._all);
    }
    const levelDist: { level: string; count: number }[] = ['1', '2', '3', '4'].map((level) => ({
      level,
      count: levelMap.get(level) ?? 0,
    }));

    // ── ترتيب المقررات حسب الحضور ──
    const attendanceByCourse = new Map<string, number>();
    for (const lecture of lecturesWithCourse) {
      const attended = lecture._count.attendances;
      if (!attended) continue;
      attendanceByCourse.set(
        lecture.courseId,
        (attendanceByCourse.get(lecture.courseId) ?? 0) + attended,
      );
    }
    const courseRows = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        lectures: { select: { id: true, _count: { select: { attendances: true } } } },
        enrollments: { select: { id: true } },
      },
    });
    const ranked = courseRows
      .map((course) => {
        const presentCountForCourse = course.lectures.reduce(
          (sum, lecture) => sum + lecture._count.attendances,
          0,
        );
        const enrolled = course.enrollments.length;
        const possible = course.lectures.length * enrolled;
        return {
          course: { code: course.code, name: course.name },
          presentCount: presentCountForCourse,
          pct: pct(presentCountForCourse, possible),
        };
      })
      .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || b.presentCount - a.presentCount);

    const canSplit = ranked.length > 3;
    const courseRank = {
      top: canSplit ? ranked.slice(0, 3) : ranked,
      bottom: canSplit ? ranked.slice(-3).reverse() : [],
    };

    // ── عدّاد الملفات الكلي بتوزيع الأنواع (Resource) ──
    const files = {
      total: resourceTotal,
      byKind: filesByKind
        .map((row) => ({ kind: row.kind, count: row._count._all }))
        .sort((a, b) => b.count - a.count),
    };

    // ── تفكيك المحاضرات: مفتوحة / مغلقة / ملغاة ──
    const lectureTotal = lecturesWithCourse.length;
    const lectures = {
      total: lectureTotal,
      open: lectureOpen,
      cancelled: lectureCancelled,
      closed: Math.max(lectureTotal - lectureOpen - lectureCancelled, 0),
    };

    // ── أكثر الجلسات الأخيرة مع توزيع المسجلين المتاحين لكل مقرر ──
    const recentSessions = recentLectures.map((lecture) => {
      const enrolled = enrolledByCourse.get(lecture.courseId) ?? 0;
      const attended = lecture._count.attendances;
      return {
        id: lecture.id,
        title: lecture.title,
        location: lecture.location,
        startsAt: lecture.startsAt.toISOString(),
        isOpen: lecture.isOpen,
        cancelled: lecture.cancelledAt !== null,
        courseCode: lecture.course.code,
        courseName: lecture.course.name,
        enrolled,
        attended,
        absent: Math.max(enrolled - attended, 0),
      };
    });

    // ── جلسات حية الآن ──
    const liveNow = liveRows.map((lecture) => ({
      id: lecture.id,
      title: lecture.title,
      location: lecture.location,
      startsAt: lecture.startsAt.toISOString(),
      courseCode: lecture.course.code,
      present: lecture._count.attendances,
    }));

    return Response.json({
      totals: { students, professors, courses, slots, taskCount },
      attendance: { presentCount, totalPossible, attendancePct },
      attendSeries,
      levelDist,
      courseRank,
      activities,
      files,
      lectures,
      liveNow,
      recentSessions,
    });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    const message = (err as Error).message || 'حدث خطأ غير متوقع';
    return jsonError(message, status);
  }
}
