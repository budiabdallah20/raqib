import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError } from '@/lib/security';
import { attemptDeadline } from '@/lib/exam';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────
// GET /api/student/exams — الامتحانات المتاحة/السابقة لمقرراتي + وضع محاولتي
// ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireUser(['STUDENT']);
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id, status: 'ACTIVE' },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((row) => row.courseId);
    if (courseIds.length === 0) return Response.json({ exams: [] });

    const now = new Date();
    const exams = await prisma.exam.findMany({
      where: {
        courseId: { in: courseIds },
        OR: [{ status: 'PUBLISHED' }, { status: 'CLOSED', resultsVisible: true }],
      },
      orderBy: [{ status: 'desc' }, { startsAt: 'desc' }],
      select: {
        id: true,
        title: true,
        instructions: true,
        status: true,
        startsAt: true,
        endsAt: true,
        durationMinutes: true,
        totalMarks: true,
        resultsVisible: true,
        course: { select: { id: true, code: true, name: true } },
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId: user.id },
          select: {
            id: true,
            status: true,
            startedAt: true,
            submittedAt: true,
            score: true,
            maxScore: true,
          },
          take: 1,
        },
      },
    });

    return Response.json({
      exams: exams.map((exam) => {
        const mine = exam.attempts[0] ?? null;
        const opensAt = exam.startsAt ? new Date(exam.startsAt) : null;
        const closesAt = exam.endsAt ? new Date(exam.endsAt) : null;
        const inWindow = (!opensAt || now >= opensAt) && (!closesAt || now <= closesAt);
        return {
          id: exam.id,
          title: exam.title,
          instructions: exam.instructions,
          status: exam.status,
          startsAt: exam.startsAt,
          endsAt: exam.endsAt,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          questions: exam._count.questions,
          resultsVisible: exam.resultsVisible,
          course: exam.course,
          inWindow,
          myAttempt: mine
            ? {
                id: mine.id,
                status: mine.status,
                startedAt: mine.startedAt,
                submittedAt: mine.submittedAt,
                deadline: attemptDeadline(
                  { endsAt: closesAt, durationMinutes: exam.durationMinutes },
                  new Date(mine.startedAt),
                ).toISOString(),
                // لا نكشف الدرجة إلا بعد نشر النتائج (Rule 10)
                ...(exam.resultsVisible ? { score: mine.score, maxScore: mine.maxScore } : {}),
              }
            : null,
        };
      }),
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل الامتحانات');
  }
}
