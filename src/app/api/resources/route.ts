import { z } from 'zod';
import fs from 'node:fs';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import {
  assertRateLimit,
  handleApiError,
  jsonError,
  logAudit,
  sanitizeString,
} from '@/lib/security';
import {
  RESOURCE_DIR,
  RESOURCE_NAME_RE,
  safePath,
  verifyUploadSignature,
} from '@/lib/storage';

export const runtime = 'nodejs';

const postSchema = z.object({
  courseId: z.string().min(1, 'المقرر مطلوب'),
  lectureId: z.string().min(1).nullable().optional().or(z.literal('')),
  storedName: z.string().regex(RESOURCE_NAME_RE, 'اسم ملف غير صالح'),
  originalName: z.string().trim().min(1).max(200),
  size: z.number().int().min(1).max(20 * 1024 * 1024).optional(),
  // توقيع HMAC من /api/upload/resource — يمنع تسجيل ملف دكتور آخر
  uploadToken: z.string().trim().min(1).max(64),
});

const deleteSchema = z.object({ id: z.string().min(1) });

function filePathOf(storedName: string) {
  return safePath(RESOURCE_DIR, storedName, RESOURCE_NAME_RE);
}

// ───────────────────────────────────────────────────────
// GET /api/resources?courseId=… — ملفات مقرر يخص الدكتور
// ───────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    const url = new URL(request.url);
    const courseId = (url.searchParams.get('courseId') || '').trim();
    if (!courseId) return jsonError('حدد المقرر المطلوب');

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.professorId !== user.id) {
      return jsonError('هذا المقرر ليس ضمن مقرراتك', 403);
    }

    const resources = await prisma.resource.findMany({
      where: { courseId },
      include: { lecture: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({
      resources: resources.map((r) => ({
        id: r.id,
        originalName: r.originalName,
        storedName: r.storedName,
        url: `/api/files/resource/${r.storedName}`,
        mimeType: r.mimeType,
        size: r.size,
        kind: r.kind,
        createdAt: r.createdAt,
        lecture: r.lecture ? { id: r.lecture.id, title: r.lecture.title } : null,
      })),
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل الملفات');
  }
}

// ───────────────────────────────────────────────────────
// POST /api/resources — تسجيل ملف مرفوع بالفعل على القرص
// ───────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    assertRateLimit(`resource-register:${user.id}`, 60, 60 * 60 * 1000);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    }
    const { courseId, storedName, originalName } = parsed.data;
    const lectureId = parsed.data.lectureId || null;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.professorId !== user.id) {
      return jsonError('هذا المقرر ليس ضمن مقرراتك', 403);
    }

    if (!verifyUploadSignature(user.id, storedName, parsed.data.uploadToken)) {
      return jsonError('تعذر التحقق من ملكية الملف المرفوع', 403);
    }

    const duplicate = await prisma.resource.findUnique({
      where: { storedName },
      select: { id: true },
    });
    if (duplicate) return jsonError('هذا الملف مسجل بالفعل', 409);

    if (lectureId) {
      const lecture = await prisma.lecture.findUnique({ where: { id: lectureId } });
      if (!lecture || lecture.courseId !== courseId || lecture.professorId !== user.id) {
        return jsonError('المحاضرة غير موجودة في هذا المقرر', 400);
      }
    }

    // الملف لازم يكون مرفوع حرفيًا على القرص قبل التسجيل، ونأخذ حجمه الحقيقي
    const fullPath = filePathOf(storedName);
    let actualSize = 0;
    try {
      const stat = fullPath ? fs.statSync(fullPath) : null;
      if (!stat?.isFile()) throw new Error('missing');
      actualSize = stat.size;
    } catch {
      return jsonError('لم يتم العثور على الملف المرفوع. ارفعه من جديد', 400);
    }

    const resource = await prisma.resource.create({
      data: {
        originalName: sanitizeString(originalName, 200),
        storedName,
        mimeType: 'application/pdf',
        size: actualSize,
        courseId,
        lectureId: lectureId || null,
        kind: 'PDF',
      },
      include: { lecture: { select: { id: true, title: true } } },
    });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'RESOURCE_CREATE',
      entity: 'Resource',
      detail: { resourceId: resource.id, courseId, storedName },
    });

    return Response.json({
      resource: {
        ...resource,
        url: `/api/files/resource/${resource.storedName}`,
        lecture: resource.lecture
          ? { id: resource.lecture.id, title: resource.lecture.title }
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تسجيل الملف');
  }
}

// ───────────────────────────────────────────────────────
// DELETE /api/resources — حذف السجل + الملف من القرص
// ───────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    assertRateLimit(`resource-delete:${user.id}`, 60, 60 * 60 * 1000);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) return jsonError('بيانات غير صالحة');

    const resource = await prisma.resource.findUnique({
      where: { id: parsed.data.id },
      include: { course: { select: { professorId: true, code: true } } },
    });
    if (!resource) return jsonError('الملف غير موجود', 404);
    if (resource.course.professorId !== user.id) {
      return jsonError('هذا الملف ليس ضمن مقرراتك', 403);
    }

    const fullPath = filePathOf(resource.storedName);
    if (!fullPath) return jsonError('اسم الملف غير صالح للحذف', 400);

    try {
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch {
      // تعذر حذف الملف من القرص (مشغول مثلاً) — نحذف السجل على أي حال
    }

    await prisma.resource.delete({ where: { id: resource.id } });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'RESOURCE_DELETE',
      entity: 'Resource',
      detail: { resourceId: resource.id, storedName: resource.storedName, courseId: resource.courseId },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error, 'تعذر حذف الملف');
  }
}
