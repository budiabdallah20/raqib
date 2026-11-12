import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { getOwnedExam, recalcExamTotals, QUESTION_KINDS } from '@/lib/exam';
import { safeStringifyArray } from '@/lib/answer';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const base = {
  prompt: z.string().trim().min(3, 'نص السؤال قصير جدًا').max(4000),
  marks: z.number().positive('الدرجة يجب أن تكون موجبة').max(100),
};

const createSchema = z.discriminatedUnion('kind', [
  z.object({
    ...base,
    kind: z.literal('MCQ'),
    options: z.array(z.string().trim().min(1).max(500)).min(2, 'اختياران على الأقل').max(6, '6 اختيارات كحد أقصى'),
    correctIndex: z.number().int().min(0),
  }),
  z.object({
    ...base,
    kind: z.literal('TRUE_FALSE'),
    correctIndex: z.union([z.literal(0), z.literal(1)]), // 0 = صح ، 1 = خطأ
  }),
  z.object({
    ...base,
    kind: z.literal('SHORT'),
    acceptedAnswers: z.array(z.string().trim().min(1).max(300)).min(1, 'أضف إجابة مقبولة واحدة على الأقل').max(10),
  }),
  z.object({
    ...base,
    kind: z.literal('ESSAY'),
    rubric: z.string().trim().max(4000).optional(),
  }),
]);

// ─────────────────────────────────────────────────────────────
// POST /api/professor/exams/[id]/questions — إضافة سؤال (DRAFT فقط)
// ─────────────────────────────────────────────────────────────
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const { id } = await params;
    const exam = await getOwnedExam(id, user.id);
    if (!exam) return jsonError('الامتحان غير موجود أو ليس من مقرراتك', 404);
    if (exam.status !== 'DRAFT') {
      return jsonError('الامتحان منشور — أغلقَه أولًا لو محتاج تعديل جوهري', 409);
    }

    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات السؤال غير صالحة', 400);
    const data = parsed.data;

    if (data.kind === 'MCQ' && data.correctIndex >= data.options.length) {
      return jsonError('رقم الإجابة الصحيحة خارج نطاق الاختيارات', 400);
    }

    const last = await prisma.question.findFirst({
      where: { examId: id },
      orderBy: { ord: 'desc' },
      select: { ord: true },
    });

    const question = await prisma.question.create({
      data: {
        examId: id,
        ord: (last?.ord ?? 0) + 1,
        kind: data.kind,
        prompt: data.prompt,
        marks: data.marks,
        options: data.kind === 'MCQ' ? safeStringifyArray(data.options) : null,
        correctIndex: data.kind === 'MCQ' || data.kind === 'TRUE_FALSE' ? data.correctIndex : null,
        acceptedAnswers: data.kind === 'SHORT' ? safeStringifyArray(data.acceptedAnswers) : null,
        rubric: data.kind === 'ESSAY' ? data.rubric ?? null : null,
      },
    });
    await recalcExamTotals(id);

    return Response.json({ ok: true, question }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'تعذر إضافة السؤال');
  }
}
