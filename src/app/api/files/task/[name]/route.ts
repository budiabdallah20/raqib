import fs from 'node:fs';
import { Readable } from 'node:stream';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
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
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const user = await requireUser();
    const { name } = await params;

    const fullPath = safePath(TASK_DIR, name, TASK_NAME_RE);
    if (!fullPath || !fs.existsSync(fullPath)) {
      return jsonError('الملف غير موجود', 404);
    }

    const submission = await prisma.taskSubmission.findFirst({
      where: { fileUrl: { endsWith: name } },
      select: {
        studentId: true,
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

    const stat = fs.statSync(fullPath);
    const stream = fs.createReadStream(fullPath);

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        'content-type': taskMimeOf(name),
        'content-length': String(stat.size),
        'content-disposition': `attachment; filename="${name}"`,
        'x-content-type-options': 'nosniff',
        'cache-control': 'private, no-store, max-age=0',
        'cross-origin-resource-policy': 'same-origin',
      },
    });
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل الملف');
  }
}
