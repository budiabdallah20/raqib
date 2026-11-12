import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { getOwnedExam, recalcExamTotals } from '@/lib/exam';
import { safeStringifyArray } from '@/lib/answer';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; questionId: string }> };

const patchSchema = z.object({
  prompt: z.string().trim().min(3).max(4000).optional(),
  marks: z.number().positive().max(100).optional(),
  options: z.array(z.string().trim().min(1).max(500)).min(2).max(6).optional(),
  correctIndex: z.number().int().min(0).optional(),
  acceptedAnswers: z.array(z.string().trim().min(1).max(300)).min(1).max(10).optional(),
  rubric: z.string().trim().max(4000).nullable().optional(),
});

// PATCH /api/professor/exams/[id]/questions/[questionId] — تعديل (DRAFT فقط)
export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const { id, questionId } = await params;
    const exam = await getOwnedExam(id, user.id);
    if (!exam) return jsonError('الامتحان غير موجود أو ليس من مقرراتك', 404);
    if (exam.status !== 'DRAFT') {
      return jsonError('الامتحان منشور — أغلقَه أولًا لو محتاج تعديل', 409);
    }

    const question = await prisma.question.findFirst({ where: { id: questionId, examId: id } });
    if (!question) return jsonError('السؤال غير موجود', 404);

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة', 400);
    const data = parsed.data;

    if (question.kind === 'MCQ' && data.options && data.correctIndex !== undefined) {
      if (data.correctIndex >= data.options.length) return jsonError('رقم الإجابة خارج نطاق الاختيارات', 400);
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(data.prompt !== undefined ? { prompt: data.prompt } : {}),
        ...(data.marks !== undefined ? { marks: data.marks } : {}),
        ...(data.options !== undefined ? { options: safeStringifyArray(data.options) } : {}),
        ...(data.correctIndex !== undefined ? { correctIndex: data.correctIndex } : {}),
        ...(data.acceptedAnswers !== undefined
          ? { acceptedAnswers: safeStringifyArray(data.acceptedAnswers) }
          : {}),
        ...(data.rubric !== undefined ? { rubric: data.rubric } : {}),
      },
    });
    await recalcExamTotals(id);
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error, 'تعذر تعديل السؤال');
  }
}

// DELETE /api/professor/exams/[id]/questions/[questionId] — DRAFT فقط
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const { id, questionId } = await params;
    const exam = await getOwnedExam(id, user.id);
    if (!exam) return jsonError('الامتحان غير موجود أو ليس من مقرراتك', 404);
    if (exam.status !== 'DRAFT') {
      return jsonError('الامتحان منشور — لا يمكن حذف سؤال من تحت الطلاب', 409);
    }
    await prisma.question.deleteMany({ where: { id: questionId, examId: id } });
    // إعادة ترقيم الأسئلة بالتتابع بعد الحذف
    const rest = await prisma.question.findMany({ where: { examId: id }, orderBy: { ord: 'asc' } });
    for (let index = 0; index < rest.length; index += 1) {
      if (rest[index]!.ord !== index + 1) {
        await prisma.question.update({ where: { id: rest[index]!.id }, data: { ord: index + 1 } });
      }
    }
    await recalcExamTotals(id);
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error, 'تعذر حذف السؤال');
  }
}
