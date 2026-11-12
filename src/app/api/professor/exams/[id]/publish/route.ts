import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { getOwnedExam } from '@/lib/exam';
import { notifyUsers } from '@/lib/notify';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action: z.enum(['publish', 'close', 'show-results', 'hide-results']),
});

// ─────────────────────────────────────────────────────────────
// POST /api/professor/exams/[id]/publish — دورة حياة الامتحان (Rule 10)
// publish: DRAFT→PUBLISHED (بشرط سؤال واحد على الأقل)
// close:   PUBLISHED→CLOSED
// show-results / hide-results — نشر/إخفاء الدرجات للطلاب + إشعار
// ─────────────────────────────────────────────────────────────
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const { id } = await params;
    const exam = await getOwnedExam(id, user.id);
    if (!exam) return jsonError('الامتحان غير موجود أو ليس من مقرراتك', 404);

    const body = await request.json().catch(() => null);
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return jsonError('إجراء غير معروف', 400);
    const { action } = parsed.data;

    if (action === 'publish') {
      if (exam.status !== 'DRAFT') return jsonError('الامتحان منشور بالفعل أو مغلق', 409);
      const questionCount = await prisma.question.count({ where: { examId: id } });
      if (questionCount === 0) return jsonError('أضف سؤالًا واحدًا على الأقل قبل النشر', 409);
      if (exam.totalMarks <= 0) return jsonError('مجموع الدرجات صفر — راجع درجات الأسئلة', 409);
      await prisma.exam.update({ where: { id }, data: { status: 'PUBLISHED' } });

      // إشعار الطلاب المسجلين في المقرر
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: exam.courseId, status: 'ACTIVE' },
        select: { studentId: true },
      });
      if (enrollments.length > 0) {
        await notifyUsers({
          userIds: enrollments.map((row) => row.studentId),
          title: `امتحان جديد: ${exam.title}`,
          body: exam.startsAt
            ? `يبدأ ${new Date(exam.startsAt).toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} — بالتوفيق!`
            : 'متاح الآن — بالتوفيق!',
          kind: 'TASK',
          link: '/student/exams',
        });
      }
      return Response.json({ ok: true, status: 'PUBLISHED' });
    }

    if (action === 'close') {
      if (exam.status !== 'PUBLISHED') return jsonError('الامتحان ليس منشورًا', 409);
      await prisma.exam.update({ where: { id }, data: { status: 'CLOSED' } });
      return Response.json({ ok: true, status: 'CLOSED' });
    }

    // show-results / hide-results
    const show = action === 'show-results';
    if (show && exam.status === 'DRAFT') {
      return jsonError('انشر الامتحان أولًا قبل نشر النتائج', 409);
    }
    await prisma.exam.update({
      where: { id },
      data: {
        resultsVisible: show,
        ...(show ? { status: 'CLOSED' as const } : {}),
      },
    });

    if (show) {
      // تثبيت الدرجات عند النشر: أي محاولة SUBMITTED مكتملة التصحيح تصبح GRADED
      const attempts = await prisma.examAttempt.findMany({
        where: { examId: id, status: 'SUBMITTED' },
        select: { id: true, answers: { select: { awardedMarks: true } } },
      });
      for (const attempt of attempts) {
        if (attempt.answers.every((answer) => answer.awardedMarks !== null)) {
          await prisma.examAttempt.update({
            where: { id: attempt.id },
            data: { status: 'GRADED', gradedAt: new Date() },
          });
        }
      }
      const attempted = await prisma.examAttempt.findMany({
        where: { examId: id },
        select: { studentId: true },
      });
      if (attempted.length > 0) {
        await notifyUsers({
          userIds: [...new Set(attempted.map((row) => row.studentId))],
          title: `نُشرت نتائج: ${exam.title}`,
          body: 'يمكنك الآن مراجعة درجتك وتفاصيل التصحيح في «امتحاناتي».',
          kind: 'INFO',
          link: '/student/exams',
        });
      }
    }
    return Response.json({ ok: true, resultsVisible: show });
  } catch (error) {
    return handleApiError(error, 'تعذر تنفيذ الإجراء');
  }
}
