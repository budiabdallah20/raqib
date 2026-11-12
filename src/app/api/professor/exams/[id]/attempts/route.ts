import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { getOwnedExam, rollupAnswers } from '@/lib/exam';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────────────────
// GET /api/professor/exams/[id]/attempts — كل المحاولات مع الإجابات للمراجعة
// ─────────────────────────────────────────────────────────────
export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const { id } = await params;
    const exam = await getOwnedExam(id, user.id);
    if (!exam) return jsonError('الامتحان غير موجود أو ليس من مقرراتك', 404);

    const questions = await prisma.question.findMany({
      where: { examId: id },
      orderBy: { ord: 'asc' },
      select: { id: true, ord: true, kind: true, prompt: true, marks: true, rubric: true, correctIndex: true },
    });

    const attempts = await prisma.examAttempt.findMany({
      where: { examId: id },
      orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }],
      select: {
        id: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        score: true,
        maxScore: true,
        student: { select: { id: true, name: true, studentCode: true, group: true } },
        answers: {
          select: {
            questionId: true,
            answerText: true,
            selectedIndex: true,
            awardedMarks: true,
            isCorrect: true,
            feedback: true,
            gradedBy: true,
          },
        },
      },
    });

    return Response.json({
      exam: { id: exam.id, title: exam.title, totalMarks: exam.totalMarks, resultsVisible: exam.resultsVisible, status: exam.status },
      questions,
      attempts,
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل المحاولات');
  }
}

const gradeSchema = z.object({
  attemptId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        awardedMarks: z.number().min(0),
        feedback: z.string().trim().max(1000).optional(),
      }),
    )
    .min(1)
    .max(100),
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/professor/exams/[id]/attempts — تصحيح ESSAY فقط (الأستاذ يعتمد)
// MCQ/TRUE_FALSE/SHORT تبقى حتمية ولا تُلمس هنا (Rule 10/11).
// ─────────────────────────────────────────────────────────────
export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const { id } = await params;
    const exam = await getOwnedExam(id, user.id);
    if (!exam) return jsonError('الامتحان غير موجود أو ليس من مقرراتك', 404);

    const body = await request.json().catch(() => null);
    const parsed = gradeSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة', 400);
    const { attemptId, answers } = parsed.data;

    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, examId: id },
      select: { id: true, status: true },
    });
    if (!attempt) return jsonError('المحاولة غير موجودة', 404);

    const questions = await prisma.question.findMany({
      where: { examId: id },
      select: { id: true, kind: true, marks: true },
    });
    const questionMap = new Map(questions.map((question) => [question.id, question]));

    let updated = 0;
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) return jsonError('سؤال غير موجود في هذا الامتحان', 400);
      if (question.kind !== 'ESSAY') {
        return jsonError('التصحيح اليدوي مسموح فقط لأسئلة المقالي — الباقي يصححه النظام حتميًا', 400);
      }
      if (answer.awardedMarks > question.marks) {
        return jsonError(`الدرجة تتجاوز حد السؤال (${question.marks})`, 400);
      }
      await prisma.studentAnswer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
        update: {
          awardedMarks: answer.awardedMarks,
          feedback: answer.feedback ?? null,
          gradedBy: 'INSTRUCTOR',
          isCorrect: answer.awardedMarks >= question.marks,
        },
        create: {
          attemptId,
          questionId: answer.questionId,
          awardedMarks: answer.awardedMarks,
          feedback: answer.feedback ?? null,
          gradedBy: 'INSTRUCTOR',
          isCorrect: answer.awardedMarks >= question.marks,
        },
      });
      updated += 1;
    }

    // إعادة حساب النتيجة والتحقق من اكتمال التصحيح
    const finalAnswers = await prisma.studentAnswer.findMany({
      where: { attemptId },
      select: { questionId: true, awardedMarks: true },
    });
    const roll = rollupAnswers(questions, finalAnswers);
    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        score: roll.score,
        maxScore: roll.maxScore,
        ...(roll.allGraded ? { status: 'GRADED', gradedAt: new Date(), reviewerId: user.id } : {}),
      },
    });

    return Response.json({ ok: true, updated, score: roll.score, maxScore: roll.maxScore, allGraded: roll.allGraded });
  } catch (error) {
    return handleApiError(error, 'تعذر حفظ التصحيح');
  }
}
