import fs from 'node:fs';
import { Readable } from 'node:stream';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';
import { driveFileStream, isDriveKey } from '@/lib/drive';
import {
  RESOURCE_DIR,
  RESOURCE_MIME,
  RESOURCE_NAME_RE,
  safePath,
} from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/files/resource/:name
 * لا يوجد أي رابط عام للملفات: الدكتور صاحب المقرر، الطالب المسجل، أو الأدمن فقط.
 * المصدر: قرص محلي (نسخة احتياطية ان وجدت) أو Google Drive (الدور الأول).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const user = await requireUser();
    const { name } = await params;

    const resource = await prisma.resource.findUnique({
      where: { storedName: name },
      select: {
        originalName: true,
        courseId: true,
        driveFileId: true,
        course: { select: { professorId: true } },
      },
    });
    if (!resource) return jsonError('الملف غير موجود', 404);

    let allowed = user.role === 'ADMIN' || resource.course.professorId === user.id;
    if (!allowed && user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: { studentId: user.id, courseId: resource.courseId },
        },
        select: { id: true },
      });
      allowed = Boolean(enrollment);
    }
    if (!allowed) return jsonError('ليست لديك صلاحية الوصول لهذا الملف', 403);

    const safeName = encodeURIComponent(resource.originalName || name);
    const commonHeaders: Record<string, string> = {
      'content-type': RESOURCE_MIME,
      'content-disposition': `inline; filename*=UTF-8''${safeName}`,
      'x-content-type-options': 'nosniff',
      'content-security-policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'",
      'cache-control': 'private, no-store, max-age=0',
      'cross-origin-resource-policy': 'same-origin',
    };

    // 1) النسخة المحلية إن كانت موجودة
    const fullPath = safePath(RESOURCE_DIR, name, RESOURCE_NAME_RE);
    if (fullPath && fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      const stream = fs.createReadStream(fullPath);
      return new Response(Readable.toWeb(stream) as ReadableStream, {
        headers: { ...commonHeaders, 'content-length': String(stat.size) },
      });
    }

    // 2) fallback: Google Drive (id من rest أو مسار gdrive: من rclone)
    const driveKey = isDriveKey(resource.driveFileId) ? resource.driveFileId : null;
    if (driveKey) {
      const stream = await driveFileStream(driveKey);
      if (stream) {
        return new Response(stream, { headers: commonHeaders });
      }
      return jsonError('تعذر تحميل الملف من التخزين السحابي', 502);
    }

    return jsonError('الملف غير موجود', 404);
  } catch (error) {
    return handleApiError(error, 'تعذر تحميل الملف');
  }
}
