import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import {
  assertRateLimit,
  handleApiError,
  jsonError,
  logAudit,
} from '@/lib/security';
import {
  RESOURCE_DIR,
  ensureDirs,
  uploadSignature,
} from '@/lib/storage';

export const runtime = 'nodejs';

const MAX_BYTES = 20 * 1024 * 1024; // 20 ميجابايت

/** فحص التوقيع السحري لملف PDF: 25 50 44 46 (%PDF) */
function isPdf(bytes: Uint8Array) {
  return (
    bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
  );
}

// ───────────────────────────────────────────────────────
// POST /api/upload/resource — رفع PDF فقط (multipart/form-data)
// الملف يُخزَّن خارج public ويُقدَّم عبر /api/files/resource/:name
// ───────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const user = await requireUser(['PROFESSOR']);
    assertRateLimit(`upload-resource:${user.id}`, 30, 60 * 60 * 1000);

    const form = await request.formData();
    const courseId = String(form.get('courseId') || '').trim();
    const file = form.get('file');
    if (!courseId) return jsonError('حدد المقرر قبل رفع الملف');
    if (!(file instanceof File)) {
      return jsonError('لم يتم اختيار ملف');
    }
    if (file.size === 0) {
      return jsonError('الملف فارغ');
    }
    if (file.size > MAX_BYTES) {
      return jsonError('حجم الملف يتجاوز 20 ميجابايت');
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.professorId !== user.id) {
      return jsonError('هذا المقرر ليس ضمن مقرراتك', 403);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    if (!isPdf(buffer)) {
      return jsonError('يُسمح فقط بملفات PDF');
    }

    await ensureDirs();
    const storedName = `${randomUUID()}.pdf`;
    fs.writeFileSync(path.join(RESOURCE_DIR, storedName), buffer, { mode: 0o600 });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'RESOURCE_UPLOAD',
      entity: 'Resource',
      detail: { storedName, originalName: file.name.slice(0, 200), size: file.size, courseId },
    });

    return Response.json(
      {
        storedName,
        url: `/api/files/resource/${storedName}`,
        // يثبت أن الملف رفعه نفس الدكتور عند تسجيله في /api/resources
        uploadToken: uploadSignature(user.id, storedName),
        size: file.size,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return handleApiError(error, 'تعذر رفع الملف');
  }
}
