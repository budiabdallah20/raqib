import fs from 'node:fs';
import { Readable } from 'node:stream';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { driveFileStream, isDriveKey } from '@/lib/drive';
import {
  TASK_DIR,
  TASK_NAME_RE,
  safePath,
  taskMimeOf,
} from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/files/task/:name
 * تسليمات الطلاب خاصة: الطالب صاحب التسليم، دكتور المقرر، أو الأدمن فقط.
 * المصدر: قرص محلي أو Google Drive (بعد نقل نسخة التسليم سحابيًا).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const user = await requireUser();
    const { name } = await params;

    const submission = await prisma.taskSubmission.findFirst({
      where: {
        OR: [
          { fileUrl: { endsWith: name } },
          { driveFileId: { endsWith: name } },
        ],
      },
      select: {
        studentId: true,
        driveFileId: true,
        fileUrl: true,
        task: {
          select: {
            title: true,
            course: { select: { professorId: true } },
          },
        },
      },
    });
    if (!submission) return jsonError('الملف غير موجود', 404);

    const allowed =
      user.role === 'ADMIN' ||
      submission.studentId === user.id ||
      submission.task.course.professorId === user.id;
    if (!allowed) return jsonError('ليست لديك صلاحية الوصول لهذا الملف', 403);

    // يجب أن يكون الملف المطلوب هو نفسه المسجل على التسليم
    const fileUrlName = submission.fileUrl?.split('/').pop() ?? null;
    if (fileUrlName && fileUrlName !== name) return jsonError('الملف غير موجود', 404);

    const commonHeaders: Record<string, string> = {
      'content-type': taskMimeOf(name),
      'content-disposition': `attachment; filename="${name}"`,
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, no-store, max-age=0',
      'cross-origin-resource-policy': 'same-origin',
    };

    // 1) محلي إن وجد
    const fullPath = safePath(TASK_DIR, name, TASK_NAME_RE);
    if (fullPath && fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      const stream = fs.createReadStream(fullPath);
      return new Response(Readable.toWeb(stream) as ReadableStream, {
        headers: { ...commonHeaders, 'content-length': String(stat.size) },
      });
    }

    // 2) Drive (مسار rclone gdrive: أو id لوضع rest)
    const driveKey = isDriveKey(submission.driveFileId) ? submission.driveFileId : null;
    if (driveKey) {
      const stream = await driveFileStream(driveKey);
      if (stream) return new Response(stream, { headers: commonHeaders });
      return jsonError('تعذر تحميل الملف من التخزين السحابي', 502);
    }

    return jsonError('الملف غير موجود', 404);
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل الملف');
  }
}
