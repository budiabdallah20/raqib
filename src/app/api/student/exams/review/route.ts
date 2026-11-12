import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { parseJsonStringArray } from '@/lib/answer';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────
// GET /api/student/exams/review?examId= — مراجعة التصحيح بعد نشر النتائج فقط
// ─────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    const examId = (new URL(request.url).searchParams.get('examId') || '').trim();
    if (!examId) return jsonError('الامتحان مطلوب', 400);

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, title: true, status: true, resultsVisible: true, totalMarks: true },
    });
    if (!exam) return jsonError('الامتحان غير موجود', 404);
    if (!exam.resultsVisible) {
      return jsonError('النتائج لم تُنشر بعد — ستظهر هنا بمجرد نشرها', 403);
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId, studentId: user.id } },
      select: {
        id: true,
        status: true,
        score: true,
        maxScore: true,
        submittedAt: true,
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
    if (!attempt) return jsonError('لا توجد محاولة لك في هذا الامتحان', 404);

    const questions = await prisma.question.findMany({
      where: { examId },
      orderBy: { ord: 'asc' },
      select: {
        id: true,
        ord: true,
        kind: true,
        prompt: true,
        options: true,
        marks: true,
        rubric: true,
        correctIndex: true,
        acceptedAnswers: true,
      },
    });

    const answerMap = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));

    return Response.json({
      exam: { id: exam.id, title: exam.title, totalMarks: exam.totalMarks },
      attempt: { id: attempt.id, status: attempt.status, score: attempt.score, maxScore: attempt.maxScore, submittedAt: attempt.submittedAt },
      questions: questions.map((question) => {
        const answer = answerMap.get(question.id) ?? null;
        return {
          id: question.id,
          ord: question.ord,
          kind: question.kind,
          prompt: question.prompt,
          marks: question.marks,
          options:
            question.kind === 'MCQ'
              ? parseJsonStringArray(question.options)
              : question.kind === 'TRUE_FALSE'
                ? ['صح', 'خطأ']
                : null,
          // النتائج منشورة — الطالب يرى مفتاح التصحيح الآن
          correctIndex: question.correctIndex,
          acceptedAnswers: question.kind === 'SHORT' ? parseJsonStringArray(question.acceptedAnswers) : undefined,
          rubric: question.rubric,
          myAnswer: answer
            ? {
                selectedIndex: answer.selectedIndex,
                answerText: answer.answerText,
                awardedMarks: answer.awardedMarks,
                isCorrect: answer.isCorrect,
                feedback: answer.feedback,
                gradedBy: answer.gradedBy,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل المراجعة');
  }
}
