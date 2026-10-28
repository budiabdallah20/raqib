import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { assertRateLimit, handleApiError, jsonError, logAudit, sanitizeString } from '@/lib/security';

// ───────────────────────────────────────────────────────────────
// GET /api/student/notes — ملاحظات الطالب (تيك نوتس)
// ───────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireUser(['STUDENT']);

    const notes = await prisma.studentNote.findMany({
      where: { studentId: user.id },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        body: true,
        pinned: true,
        courseId: true,
        lectureId: true,
        course: { select: { code: true, name: true } },
        lecture: { select: { title: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ notes });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

// ───────────────────────────────────────────────────────────────
// POST /api/student/notes — إضافة ملاحظة (العنوان اختياري والمحتوى مطلوب)
// ───────────────────────────────────────────────────────────────
const noteSchema = z.object({
  title: z.string().trim().max(120).optional().or(z.literal('')),
  body: z.string().trim().min(1, 'المحتوى مطلوب').max(4000),
  courseId: z.string().min(1).optional().or(z.literal('')),
  lectureId: z.string().min(1).optional().or(z.literal('')),
  pinned: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    assertRateLimit(`note-create:${user.id}`, 30, 60 * 60 * 1000);
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');

    const { title, body: content, courseId, lectureId, pinned } = parsed.data;

    // لا تُقبل ملاحظة مرتبطة بمقرر/محاضرة من خارج مواد الطالب المسجلة
    if (courseId) {
      const enrolled = await prisma.enrollment.findFirst({ where: { studentId: user.id, courseId } });
      if (!enrolled) return jsonError('المقرر غير موجود في موادك المسجلة');
    }
    if (lectureId) {
      const lecture = await prisma.lecture.findUnique({ where: { id: lectureId }, select: { courseId: true } });
      if (!lecture) return jsonError('المحاضرة غير موجودة');
      const enrolled = await prisma.enrollment.findFirst({ where: { studentId: user.id, courseId: lecture.courseId } });
      if (!enrolled) return jsonError('المحاضرة ليست من موادك المسجلة');
    }

    const created = await prisma.studentNote.create({
      data: {
        studentId: user.id,
        title: title ? sanitizeString(title, 120) : null,
        body: sanitizeString(content, 4000),
        courseId: courseId || null,
        lectureId: lectureId || null,
        pinned,
      },
      select: { id: true, title: true, body: true, pinned: true, createdAt: true },
    });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'NOTE_CREATE',
      entity: 'StudentNote',
      detail: { noteId: created.id },
    });

    return Response.json({ ok: true, note: created });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

// ───────────────────────────────────────────────────────────────
// DELETE /api/student/notes?id=… — حذف ملاحظة يملكها الطالب فقط
// ───────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    assertRateLimit(`note-delete:${user.id}`, 60, 60 * 60 * 1000);
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!id) return jsonError('حدد الملاحظة المطلوبة');

    const deleted = await prisma.studentNote.deleteMany({
      where: { id, studentId: user.id },
    });
    if (!deleted.count) return jsonError('الملاحظة غير موجودة', 404);

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'NOTE_DELETE',
      entity: 'StudentNote',
      detail: { noteId: id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
