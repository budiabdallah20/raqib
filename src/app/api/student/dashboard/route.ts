import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { SCHED_PERIODS } from '@/lib/constants';

// ───────────────────────────────────────────────────────
// GET /api/student/dashboard — بيانات داشبورد الطالب (جلسة الطالب فقط)
// ───────────────────────────────────────────────────────
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

    const [lectureCount, attendedLectures, lateTasks, midtermAgg, lastGrades] =
      await Promise.all([
        // إجمالي المحاضرات لمواده المسجلة
        prisma.lecture.count({ where: { courseId: { in: courseIds } } }),
        // سجلات الحضور المقبولة (حاضر/متأخر) لمواده
        prisma.attendance.count({
          where: {
            studentId: user.id,
            status: { in: ['PRESENT', 'LATE'] },
            lecture: { courseId: { in: courseIds } },
          },
        }),
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
            course: { select: { name: true, code: true } },
          },
        }),
      ]);

    // يوم اليوم بترميز الجريد: getDay 0=الأحد..6=السبت → 1..7
    // الأيام الدراسية في الجريد الرسمي 2..5 فقط، غير ذلك مفيش محاضرات
    const day = new Date().getDay() + 1;
    const isStudyDay = day >= 2 && day <= 5;

    const slots =
      isStudyDay && courseIds.length
        ? await prisma.scheduleSlot.findMany({
            where: {
              group: me.group || 'A',
              day,
              courseId: { in: courseIds },
            },
            orderBy: { period: 'asc' },
            select: {
              period: true,
              kind: true,
              room: true,
              isVip: true,
              course: {
                select: { name: true, professor: { select: { name: true } } },
              },
            },
          })
        : [];

    const todayLectures = slots.map((slot) => ({
      period: slot.period,
      title: slot.course.name,
      time: SCHED_PERIODS[slot.period - 1]?.time ?? '',
      kind: slot.kind,
      room: slot.room,
      isVip: slot.isVip,
      professor: slot.course.professor?.name ?? 'غير محدد',
    }));

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
      stats: {
        courses: courseIds.length,
        attendancePct:
          lectureCount > 0
            ? Math.round((attendedLectures / lectureCount) * 100)
            : null,
        lateTasks,
        midtermScores:
          midtermAgg._avg.midterm === null || midtermAgg._avg.midterm === undefined
            ? null
            : Math.round(midtermAgg._avg.midterm * 10) / 10,
      },
      todayLectures,
      lastGrades: lastGrades.map((grade) => ({
        course: { name: grade.course.name, code: grade.course.code },
        quiz: grade.quiz,
        work: grade.work,
        midterm: grade.midterm,
        total: (grade.quiz ?? 0) + (grade.work ?? 0) + (grade.midterm ?? 0),
      })),
      unread: 0,
    });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
