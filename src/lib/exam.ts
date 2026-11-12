/**
 * 📝 منطق Exam Studio المشترك — خادمي، حتمي، بلا أي خدمة خارجية.
 * التصحيح: MCQ / TRUE_FALSE / SHORT آلي؛ ESSAY يبقى معلقًا حتى يعتمله الدكتور.
 */
import { prisma } from './db';
import { gradeShortAnswer, normalizeAnswer, parseJsonStringArray } from './answer';

export const QUESTION_KINDS = ['MCQ', 'TRUE_FALSE', 'SHORT', 'ESSAY'] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];

/** مقرر مملوك للدكتور — المرجع في كل مسارات Exam Studio للأستاذ */
export async function getOwnedExam(examId: string, professorId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
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
      courseId: true,
      createdById: true,
      course: { select: { id: true, code: true, name: true, professorId: true } },
    },
  });
  if (!exam || exam.course.professorId !== professorId) return null;
  return exam;
}

/** يعيد حساب totalMarks من الأسئلة — يُستدعى بعد أي تعديل على الأسئلة */
export async function recalcExamTotals(examId: string) {
  const aggregate = await prisma.question.aggregate({
    where: { examId },
    _sum: { marks: true },
  });
  const total = aggregate._sum.marks ?? 0;
  await prisma.exam.update({ where: { id: examId }, data: { totalMarks: total } });
  return total;
}

export type ObjectiveGrade = {
  questionId: string;
  awardedMarks: number | null; // null = يتطلب تدخل الدكتور (ESSAY)
  isCorrect: boolean | null;
  gradedBy: 'AUTO' | 'INSTRUCTOR' | null;
};

/**
 * يصحح سؤالًا واحدًا من النوع الموضوعي.
 * يرجع null بالنسبة لـ ESSAY (لا يُصحح آليًا أبدًا).
 */
export function gradeObjectiveQuestion(
  question: { id: string; kind: string; correctIndex: number | null; acceptedAnswers: string | null; marks: number },
  answer: { selectedIndex?: number | null; answerText?: string | null },
): ObjectiveGrade | null {
  if (question.kind === 'ESSAY') return null;

  if (question.kind === 'MCQ' || question.kind === 'TRUE_FALSE') {
    const selected = answer.selectedIndex;
    const hasSelection = typeof selected === 'number' && Number.isInteger(selected);
    const correct = hasSelection && question.correctIndex !== null && selected === question.correctIndex;
    return {
      questionId: question.id,
      awardedMarks: correct ? question.marks : 0,
      isCorrect: correct,
      gradedBy: 'AUTO',
    };
  }

  if (question.kind === 'SHORT') {
    const accepted = parseJsonStringArray(question.acceptedAnswers);
    const result = gradeShortAnswer(answer.answerText ?? null, accepted, question.marks);
    return {
      questionId: question.id,
      awardedMarks: result.awarded,
      isCorrect: result.correct,
      gradedBy: 'AUTO',
    };
  }

  // نوع مجهول — لا نمنحه علامة، ولا ننهار: نُعلّقه للدكتور
  return { questionId: question.id, awardedMarks: null, isCorrect: null, gradedBy: null };
}

/** مجموع ما حصل عليه الطالب + هل اكتمل التصحيح؟ */
export function rollupAnswers(
  questions: { id: string; marks: number }[],
  answers: { questionId: string; awardedMarks: number | null }[],
) {
  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));
  let score = 0;
  let allGraded = true;
  let maxScore = 0;
  for (const question of questions) {
    maxScore += question.marks;
    const answer = byQuestion.get(question.id);
    if (!answer || answer.awardedMarks === null || answer.awardedMarks === undefined) {
      allGraded = false;
    } else {
      score += answer.awardedMarks;
    }
  }
  return { score: Math.round(score * 100) / 100, maxScore, allGraded };
}

/** آخر لحظة لتسليم المحاولة — min(endsAt, startedAt + المدة) */
export function attemptDeadline(exam: { endsAt: Date | null; durationMinutes: number }, startedAt: Date) {
  const byDuration = new Date(startedAt.getTime() + exam.durationMinutes * 60_000);
  if (exam.endsAt && exam.endsAt < byDuration) return exam.endsAt;
  return byDuration;
}

export { normalizeAnswer };
