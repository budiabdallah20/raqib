import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, assertRateLimit, logAudit } from '@/lib/security';
import { attemptDeadline, gradeObjectiveQuestion, rollupAnswers } from '@/lib/exam';

export const dynamic = 'force-dynamic';

const submitSchema = z.object({
  attemptId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedIndex: z.number().int().min(0).max(10).nullable().optional(),
        answerText: z.string().trim().max(8000).nullable().optional(),
      }),
    )
    .max(200),
});

// ─────────────────────────────────────────────────────────────
// POST /api/student/exams/submit — تسليم نهائي (idempotent)
// MCQ/TRUE_FALSE/SHORT تُصحح آليًا الآن. ESSAY تبقى بانتظار الدكتور (Rule 10/11).
// لا تُعاد أي درجة هنا — النتائج تُنشر بقرار الدكتور فقط.
// ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    assertRateLimit(`exam-submit:${user.id}`, 60, 15 * 60 * 1000, 'عدد كبير من محاولات التسليم — انتظر قليلًا');

    const body = await request.json().catch(() => null);
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) return jsonError('بيانات التسليم غير صالحة', 400);
    const { attemptId, answers } = parsed.data;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        status: true,
        studentId: true,
        startedAt: true,
        exam: {
          select: { id: true, endsAt: true, durationMinutes: true, resultsVisible: true },
        },
      },
    });
    if (!attempt || attempt.studentId !== user.id) {
      return jsonError('المحاولة غير موجودة', 404);
    }

    // تسليم مكرر — idempotent: لا نمسّ شيئًا ونرد نجاحًا
    if (attempt.status !== 'IN_PROGRESS') {
      return Response.json({ ok: true, alreadySubmitted: true });
    }

    const deadline = attemptDeadline(
      { endsAt: attempt.exam.endsAt, durationMinutes: attempt.exam.durationMinutes },
      attempt.startedAt,
    );
    const now = new Date();
    if (now.getTime() - deadline.getTime() > 60_000) {
      return jsonError('انتهى وقت التسليم — تواصل مع الدكتور', 403);
    }

    const questions = await prisma.question.findMany({
      where: { examId: attempt.exam.id },
      select: { id: true, kind: true, correctIndex: true, acceptedAnswers: true, marks: true },
    });
    const questionMap = new Map(questions.map((question) => [question.id, question]));
    for (const answer of answers) {
      if (!questionMap.has(answer.questionId)) {
        return jsonError('سؤال لا ينتمي لهذا الامتحان', 400);
      }
    }

    await prisma.$transaction(async (tx) => {
      const lock = await tx.examAttempt.updateMany({
        where: { id: attemptId, studentId: user.id, status: 'IN_PROGRESS' },
        data: { status: 'IN_PROGRESS' },
      });
      if (lock.count !== 1) throw new Error('EXAM_ALREADY_SUBMITTED');
      if (Date.now() - deadline.getTime() > 60_000) throw new Error('EXAM_DEADLINE_PASSED');
      // The final payload is authoritative; stale draft answers must not survive submission.
      await tx.studentAnswer.deleteMany({
        where: { attemptId, questionId: { notIn: answers.map((answer) => answer.questionId) } },
      });
      for (const answer of answers) {
        const question = questionMap.get(answer.questionId)!;
        const grade = gradeObjectiveQuestion(question, answer);
        await tx.studentAnswer.upsert({
          where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
          update: {
            selectedIndex: answer.selectedIndex ?? null,
            answerText: answer.answerText ?? null,
            ...(grade
              ? { awardedMarks: grade.awardedMarks, isCorrect: grade.isCorrect, gradedBy: grade.gradedBy }
              : { awardedMarks: null, isCorrect: null, gradedBy: null }), // ESSAY بانتظار الدكتور
          },
          create: {
            attemptId,
            questionId: answer.questionId,
            selectedIndex: answer.selectedIndex ?? null,
            answerText: answer.answerText ?? null,
            ...(grade
              ? { awardedMarks: grade.awardedMarks, isCorrect: grade.isCorrect, gradedBy: grade.gradedBy }
              : {}),
          },
        });
      }

      // أي سؤال موضوع آليًا بدون إجابة = صفر (ما جابش إجابة يبقى غلط)
      const unanswered = questions.filter(
        (question) => !answers.some((answer) => answer.questionId === question.id),
      );
      for (const question of unanswered) {
        const grade = gradeObjectiveQuestion(question, {});
        if (!grade) continue; // ESSAY بلا إجابة يظل معلقًا للدكتور
        await tx.studentAnswer.create({
          data: {
            attemptId,
            questionId: question.id,
            awardedMarks: 0,
            isCorrect: false,
            gradedBy: 'AUTO',
          },
        });
      }

      const finalAnswers = await tx.studentAnswer.findMany({
        where: { attemptId },
        select: { questionId: true, awardedMarks: true },
      });
      const roll = rollupAnswers(questions, finalAnswers);
      await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: roll.allGraded ? 'GRADED' : 'SUBMITTED',
          submittedAt: now,
          score: roll.score,
          maxScore: roll.maxScore,
          ...(roll.allGraded ? { gradedAt: now } : {}),
        },
      });
    });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'EXAM_SUBMIT',
      entity: 'ExamAttempt',
      detail: { attemptId, examId: attempt.exam.id },
    });

    // لا درجة في الرد — Rule 10: النتائج تُنشر فقط بقرار الدكتور
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'EXAM_ALREADY_SUBMITTED') {
      return Response.json({ ok: true, alreadySubmitted: true });
    }
    if (error instanceof Error && error.message === 'EXAM_DEADLINE_PASSED') {
      return jsonError('انتهى وقت التسليم — تواصل مع الدكتور', 403);
    }
    return handleApiError(error, 'تعذر تسليم الامتحان');
  }
}
