import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, assertRateLimit } from '@/lib/security';
import { attemptDeadline } from '@/lib/exam';
import { parseJsonStringArray } from '@/lib/answer';

export const dynamic = 'force-dynamic';

const draftSchema = z.object({
  attemptId: z.string().min(1),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    selectedIndex: z.number().int().min(0).max(10).nullable().optional(),
    answerText: z.string().max(8000).nullable().optional(),
  })).max(200),
});

// A draft is server-owned academic data. Never grade or expose answer keys here.
export async function POST(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    assertRateLimit(`exam-draft:${user.id}`, 120, 15 * 60 * 1000, 'طلبات حفظ كثيرة — انتظر قليلًا');
    const parsed = draftSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError('المسودة غير صالحة', 400);
    const { attemptId, answers } = parsed.data;
    if (new Set(answers.map((answer) => answer.questionId)).size !== answers.length) {
      return jsonError('السؤال مكرر في المسودة', 400);
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: {
        studentId: true, status: true, startedAt: true,
        exam: { select: { id: true, status: true, endsAt: true, durationMinutes: true } },
      },
    });
    if (!attempt || attempt.studentId !== user.id) return jsonError('المحاولة غير موجودة', 404);
    if (attempt.status !== 'IN_PROGRESS' || attempt.exam.status !== 'PUBLISHED') {
      return jsonError('المحاولة لم تعد مفتوحة', 409);
    }
    if (Date.now() > attemptDeadline(attempt.exam, attempt.startedAt).getTime()) {
      return jsonError('انتهى وقت المحاولة', 403);
    }

    const questions = await prisma.question.findMany({
      where: { examId: attempt.exam.id },
      select: { id: true, kind: true, options: true },
    });
    const questionMap = new Map(questions.map((question) => [question.id, question]));
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) return jsonError('سؤال لا ينتمي لهذا الامتحان', 400);
      if (question.kind === 'MCQ' || question.kind === 'TRUE_FALSE') {
        const count = question.kind === 'TRUE_FALSE' ? 2 : parseJsonStringArray(question.options).length;
        if (answer.selectedIndex != null && answer.selectedIndex >= count) return jsonError('اختيار غير صالح', 400);
      } else if (answer.selectedIndex != null) {
        return jsonError('هذا السؤال يتطلب إجابة نصية', 400);
      }
    }

    await prisma.$transaction(async (tx) => {
      // Lock the attempt row in Postgres. Submission takes the same lock before finalizing.
      const lock = await tx.examAttempt.updateMany({
        where: { id: attemptId, studentId: user.id, status: 'IN_PROGRESS' },
        data: { status: 'IN_PROGRESS' },
      });
      if (lock.count !== 1) throw new Error('DRAFT_CLOSED');
      if (Date.now() > attemptDeadline(attempt.exam, attempt.startedAt).getTime()) {
        throw new Error('DRAFT_EXPIRED');
      }
      for (const answer of answers) {
        await tx.studentAnswer.upsert({
          where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
          create: {
            attemptId, questionId: answer.questionId,
            selectedIndex: answer.selectedIndex ?? null,
            answerText: answer.answerText ?? null,
          },
          update: {
            selectedIndex: answer.selectedIndex ?? null,
            answerText: answer.answerText ?? null,
          },
        });
      }
    });

    return Response.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof Error && error.message === 'DRAFT_CLOSED') return jsonError('المحاولة لم تعد مفتوحة', 409);
    if (error instanceof Error && error.message === 'DRAFT_EXPIRED') return jsonError('انتهى وقت المحاولة', 403);
    return handleApiError(error, 'تعذر حفظ المسودة');
  }
}
