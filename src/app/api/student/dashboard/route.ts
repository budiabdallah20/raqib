import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { SCHED_PERIODS } from '@/lib/constants';

// ───────────────────────────────────────────────────────────────
// GET /api/student/dashboard — بيانات داشبورد الطالب (جلسة الطالب فقط)
// ───────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireUser(['STUDENT']);

    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        studentCode: true,
        group: true,
        level: true,
        phone: true,
        avatarUrl: true,
        birthDate: true,
        enrollments: { select: { courseId: true } },
      },
    });
    if (!me) return jsonError('الحساب غير موجود', 404);

    const { enrollments, ...meFields } = me;
    const courseIds = enrollments.map((item) => item.courseId);
    const now = new Date();

    // الترم النشط: T1 هو المعتمد حتى تاريخ فتح T2 الرسمي (2 فبراير 2027)
    const secondTermSetting = await prisma.appSetting.findUnique({ where: { key: 'secondTermStart' } });
    const secondTermStart = secondTermSetting ? new Date(`${secondTermSetting.value}T00:00:00`) : null;
    const activeTerm = secondTermStart && now >= secondTermStart ? 'T2' : 'T1';

    const [lectureCount, presentCount, lateCount, pastLectureCount, cancelledLectureCount, lateTasks, midtermAgg, lastGrades, slots] =
      await Promise.all([
        // إجمالي المحاضرات لمواده المسجلة
        prisma.lecture.count({ where: { courseId: { in: courseIds } } }),
        // حاضر لمواده
        prisma.attendance.count({
          where: { studentId: user.id, status: 'PRESENT', lecture: { courseId: { in: courseIds } } },
        }),
        // متأخر لمواده (يحسب نصف حاضِر وفق السياسة)
        prisma.attendance.count({
          where: { studentId: user.id, status: 'LATE', lecture: { courseId: { in: courseIds } } },
        }),
        // محاضرات ماضية لمواده
        prisma.lecture.count({ where: { courseId: { in: courseIds }, startsAt: { lt: now } } }),
        // محاضرات ملغاة لمواده
        prisma.lecture.count({ where: { courseId: { in: courseIds }, cancelledAt: { not: null } } }),
        // تاسكات موعد انتهائها فات ولم يسلمها
        prisma.task.count({
          where: {
            courseId: { in: courseIds },
            deadline: { lt: now },
            submissions: { none: { studentId: user.id } },
          },
        }),
        // متوسط درجات الميدترم المسجلة
        prisma.grade.aggregate({
          where: { studentId: user.id, midterm: { not: null } },
          _avg: { midterm: true },
        }),
        // آخر 3 درجات مسجلة
        prisma.grade.findMany({
          where: { studentId: user.id },
          orderBy: { updatedAt: 'desc' },
          take: 3,
          select: {
            quiz: true,
            work: true,
            midterm: true,
            final: true,
            course: { select: { name: true, code: true } },
          },
        }),
        // جدول جروبي للترم النشط — لاستخراج المحاضرة القادمة
        prisma.scheduleSlot.findMany({
          where: { group: meFields.group || 'A', term: activeTerm, courseId: { in: courseIds } },
          orderBy: [{ day: 'asc' }, { period: 'asc' }],
          select: {
            day: true,
            period: true,
            kind: true,
            room: true,
            isVip: true,
            teacherName: true,
            course: {
              select: { code: true, name: true, professor: { select: { name: true } } },
            },
          },
        }),
      ]);

    // يوم اليوم بترميز الجريد: getDay 0=الأحد..6=السبت → 1..7
    const day = new Date().getDay() + 1;
    const isStudyDay = day >= 2 && day <= 5;

    const todayLectures = (isStudyDay ? slots.filter((slot) => slot.day === day) : slots.slice(0, 0)).map(
      (slot) => ({
        period: slot.period,
        title: slot.course.name,
        code: slot.course.code,
        time: SCHED_PERIODS[slot.period - 1]?.time ?? '',
        kind: slot.kind,
        room: slot.room,
        isVip: slot.isVip,
        teacher: slot.teacherName ?? slot.course.professor?.name ?? 'غير محدد',
      }),
    );

    // ── المحاضرة القادمة: أول خانة متاحة (اليوم بعد وقته، وإلا باقي الأسبوع، وإلا أول أسبوع قادم)
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const periodFrom = (period: number) => {
      const [h, m] = (SCHED_PERIODS[period - 1]?.from ?? '08:30').split(':').map(Number);
      return h * 60 + m;
    };
    type SlotRow = (typeof slots)[number];
    const buildUpcoming = (slot: SlotRow, offsetDays: number) => {
      const at = new Date(now);
      at.setDate(at.getDate() + offsetDays);
      const [h, m] = (SCHED_PERIODS[slot.period - 1]?.from ?? '08:30').split(':').map(Number);
      at.setHours(h, m, 0, 0);
      return {
        day: slot.day,
        period: slot.period,
        title: slot.course.name,
        code: slot.course.code,
        kind: slot.kind,
        room: slot.room,
        isVip: slot.isVip,
        teacher: slot.teacherName ?? slot.course.professor?.name ?? 'غير محدد',
        time: SCHED_PERIODS[slot.period - 1]?.time ?? '',
        nextAt: at.toISOString(),
        daysUntil: offsetDays,
      };
    };

    let upcoming: ReturnType<typeof buildUpcoming> | null = null;
    for (const slot of slots) {
      if (slot.day < day) continue;
      if (slot.day === day && periodFrom(slot.period) <= minutesNow) continue;
      upcoming = buildUpcoming(slot, slot.day - day);
      break;
    }
    if (!upcoming && slots.length) {
      upcoming = buildUpcoming(slots[0]!, slots[0]!.day + (7 - day));
    }

    return Response.json({
      me: {
        name: meFields.name,
        studentCode: meFields.studentCode,
        group: meFields.group,
        level: meFields.level,
        phone: meFields.phone,
        avatarUrl: meFields.avatarUrl,
        birthDate: meFields.birthDate ? meFields.birthDate.toISOString() : null,
      },
      activeTerm,
      stats: {
        courses: courseIds.length,
        attendancePct:
          lectureCount > 0 ? Math.round(((presentCount + lateCount) / lectureCount) * 100) : null,
        lateTasks,
        midtermScores:
          midtermAgg._avg.midterm === null || midtermAgg._avg.midterm === undefined
            ? null
            : Math.round(midtermAgg._avg.midterm * 10) / 10,
      },
      attendance: {
        total: lectureCount,
        past: pastLectureCount,
        cancelled: cancelledLectureCount,
        present: presentCount,
        late: lateCount,
        // الغياب = محاضرات ماضية غير ملغاة بلا سجل حضور
        absent: Math.max(0, pastLectureCount - cancelledLectureCount - presentCount - lateCount),
        // الحضور الموزون وفق سياسة المنصة: المتأخر نصف حاضِر
        weightedPct: ((): number | null => {
          const denom = pastLectureCount - cancelledLectureCount;
          if (denom <= 0) return null;
          return Math.max(0, Math.min(100, Math.round(((presentCount + lateCount * 0.5) / denom) * 100)));
        })(),
      },
      todayLectures,
      upcoming,
      lastGrades: lastGrades.map((grade) => ({
        course: { name: grade.course.name, code: grade.course.code },
        quiz: grade.quiz,
        work: grade.work,
        midterm: grade.midterm,
        final: grade.final,
        total: (grade.quiz ?? 0) + (grade.work ?? 0) + (grade.midterm ?? 0) + (grade.final ?? 0),
      })),
      unread: 0,
    });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
