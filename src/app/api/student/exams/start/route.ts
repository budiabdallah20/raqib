import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, assertRateLimit } from '@/lib/security';
import { attemptDeadline } from '@/lib/exam';
import { parseJsonStringArray } from '@/lib/answer';

export const dynamic = 'force-dynamic';

const startSchema = z.object({ examId: z.string().min(1) });

/** أسئلة بلا أسرار: لا correctIndex ولا acceptedAnswers ولا rubric — أبدًا */
function sanitizeQuestion(question: {
  id: string;
  ord: number;
  kind: string;
  prompt: string;
  options: string | null;
  marks: number;
}) {
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
  };
}

// ─────────────────────────────────────────────────────────────
// POST /api/student/exams/start — بدء/استئناف المحاولة (idempotent)
// ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    assertRateLimit(`exam-start:${user.id}`, 30, 15 * 60 * 1000, 'عدد كبير من محاولات البدء — انتظر قليلًا');

    const body = await request.json().catch(() => null);
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) return jsonError('الامتحان مطلوب', 400);
    const { examId } = parsed.data;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        status: true,
        startsAt: true,
        endsAt: true,
        durationMinutes: true,
        courseId: true,
        course: { select: { professor: { select: { name: true } } } },
      },
    });
    if (!exam) return jsonError('الامتحان غير موجود', 404);

    // الطالب يجب أن يكون مسجلًا (نشط) في المقرر
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: user.id, courseId: exam.courseId } },
      select: { status: true },
    });
    if (!enrollment || enrollment.status !== 'ACTIVE') {
      return jsonError('أنت غير مسجل في مقرر هذا الامتحان', 403);
    }

    if (exam.status !== 'PUBLISHED') {
      return jsonError('الامتحان غير متاح الآن', 409);
    }
    const now = new Date();
    if (exam.startsAt && now < exam.startsAt) {
      return jsonError(
        `الامتحان لم يفتح بعد — يفتح ${exam.startsAt.toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`,
        403,
      );
    }
    if (exam.endsAt && now > exam.endsAt) {
      return jsonError('انتهى وقت الامتحان', 403);
    }

    // استئناف قائم أو إنشاء — فريد [examId, studentId]
    let attempt = await prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId, studentId: user.id } },
    });
    if (attempt && attempt.status !== 'IN_PROGRESS') {
      return jsonError('لقد سلّمت هذا الامتحان بالفعل', 409);
    }
    if (!attempt) {
      attempt = await prisma.examAttempt.create({
        data: { examId, studentId: user.id },
      });
    }

    const deadline = attemptDeadline(
      { endsAt: exam.endsAt, durationMinutes: exam.durationMinutes },
      attempt.startedAt,
    );
    if (now > deadline) {
      return jsonError('انتهت مدة محاولتك — تواصل مع الدكتور لو محتاج فتح استثنائي', 403);
    }

    const questions = await prisma.question.findMany({
      where: { examId },
      orderBy: { ord: 'asc' },
    });
    const draftAnswers = await prisma.studentAnswer.findMany({
      where: { attemptId: attempt.id },
      select: { questionId: true, selectedIndex: true, answerText: true },
    });

    return Response.json({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt.toISOString(),
        deadline: deadline.toISOString(),
      },
      exam: {
        id: exam.id,
        title: exam.title,
        professor: exam.course.professor.name,
        durationMinutes: exam.durationMinutes,
      },
      questions: questions.map(sanitizeQuestion),
      draftAnswers,
    });
  } catch (error) {
    return handleApiError(error, 'تعذر بدء الامتحان');
  }
}
