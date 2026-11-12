import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { getOwnedExam } from '@/lib/exam';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────────────────
// GET /api/professor/exams/[id] — التفاصيل + الأسئلة + ملخص المحاولات
// ─────────────────────────────────────────────────────────────
export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const { id } = await params;
    const exam = await getOwnedExam(id, user.id);
    if (!exam) return jsonError('الامتحان غير موجود أو ليس من مقرراتك', 404);

    const [questions, attempts] = await Promise.all([
      prisma.question.findMany({
        where: { examId: id },
        orderBy: { ord: 'asc' },
      }),
      prisma.examAttempt.findMany({
        where: { examId: id },
        select: { id: true, status: true, score: true, maxScore: true, submittedAt: true },
      }),
    ]);

    const { course, ...examRest } = exam;
    return Response.json({
      exam: { ...examRest, course: { id: course.id, code: course.code, name: course.name } },
      questions,
      attemptsSummary: {
        total: attempts.length,
        submitted: attempts.filter((a) => a.status !== 'IN_PROGRESS').length,
        graded: attempts.filter((a) => a.status === 'GRADED').length,
        avgScore: (() => {
          const graded = attempts.filter((a) => a.score !== null);
          if (graded.length === 0) return null;
          return Math.round((graded.reduce((sum, a) => sum + (a.score ?? 0), 0) / graded.length) * 10) / 10;
        })(),
      },
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل الامتحان');
  }
}

const patchSchema = z.object({
  title: z.string().trim().min(3).max(140).optional(),
  instructions: z.string().trim().max(2000).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  durationMinutes: z.number().int().min(5).max(240).optional(),
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/professor/exams/[id] — تعديل بيانات (المعقولة حسب الحالة)
// ─────────────────────────────────────────────────────────────
export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const { id } = await params;
    const exam = await getOwnedExam(id, user.id);
    if (!exam) return jsonError('الامتحان غير موجود أو ليس من مقرراتك', 404);

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة', 400);
    const { title, instructions, startsAt, endsAt, durationMinutes } = parsed.data;

    // الامتحان المنشور لا يُعاد تشكيله من تحت الطلاب — فقط العنوان والتعليمات
    if (exam.status !== 'DRAFT' && (startsAt !== undefined || endsAt !== undefined || durationMinutes !== undefined)) {
      return jsonError('الامتحان منشور — غيّر العنوان والتعليمات فقط، أو أغلقه أولًا', 409);
    }

    const starts = startsAt === undefined ? undefined : startsAt === null ? null : new Date(startsAt);
    const ends = endsAt === undefined ? undefined : endsAt === null ? null : new Date(endsAt);
    if (starts && ends && ends <= starts) return jsonError('موعد النهاية يجب أن يكون بعد البداية', 400);

    await prisma.exam.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(instructions !== undefined ? { instructions } : {}),
        ...(starts !== undefined ? { startsAt: starts } : {}),
        ...(ends !== undefined ? { endsAt: ends } : {}),
        ...(durationMinutes !== undefined ? { durationMinutes } : {}),
      },
    });
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error, 'تعذر حفظ التعديلات');
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/professor/exams/[id] — فقط وهو DRAFT (لا نمسح تاريخ طلاب)
// ─────────────────────────────────────────────────────────────
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const { id } = await params;
    const exam = await getOwnedExam(id, user.id);
    if (!exam) return jsonError('الامتحان غير موجود أو ليس من مقرراتك', 404);
    if (exam.status !== 'DRAFT') {
      return jsonError('لا يمكن حذف امتحان منشور — أغلقَه بدلًا من حذفه، حفاظًا على تسليمات الطلاب', 409);
    }
    await prisma.exam.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error, 'تعذر حذف الامتحان');
  }
}
