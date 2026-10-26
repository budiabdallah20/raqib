import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { requireUser } from '@/lib/auth';
import {
  assertRateLimit,
  handleApiError,
  jsonError,
  logAudit,
} from '@/lib/security';
import {
  TASK_DIR,
  ensureDirs,
  uploadSignature,
} from '@/lib/storage';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;

// بصمات أول 4 بايتات: PDF / PNG / JPG / ZIP
const SIGNATURES: { ext: string; check: (bytes: Uint8Array) => boolean }[] = [
  {
    ext: 'pdf',
    check: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
  {
    ext: 'png',
    check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: 'jpg',
    check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: 'zip',
    check: (b) => b[0] === 0x50 && b[1] === 0x4b,
  },
];

// ───────────────────────────────────────────────────────
// POST /api/upload/task — رفع ملف تسليم (PDF/JPG/PNG/ZIP ≤ 5MB)
// الملف يُخزَّن خارج public ويُقدَّم عبر /api/files/task/:name
// ───────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const user = await requireUser(['STUDENT']);
    assertRateLimit(`task-upload:${user.id}`, 30, 60 * 60 * 1000);

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return jsonError('لم يتم اختيار ملف');
    if (file.size > MAX_BYTES) {
      return jsonError('حجم الملف يجب أن يكون 5 ميجابايت كحد أقصى');
    }
    if (file.size < 4) return jsonError('نوع الملف غير مدعوم');

    const bytes = new Uint8Array(await file.arrayBuffer());
    const matched = SIGNATURES.find((sig) => sig.check(bytes));
    if (!matched) {
      return jsonError('نوع الملف غير مدعوم (الصيغ المسموحة: PDF أو صورة أو ZIP)');
    }

    await ensureDirs();
    const filename = `${randomUUID()}.${matched.ext}`;
    await writeFile(path.join(TASK_DIR, filename), bytes, { mode: 0o600 });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'TASK_FILE_UPLOAD',
      entity: 'TaskSubmission',
      detail: { filename, originalName: file.name.slice(0, 200), size: file.size },
    });

    return Response.json(
      {
        url: `/api/files/task/${filename}`,
        storedName: filename,
        // يربط الملف بالطالب صاحبه، ويمنع تسليم ملف مرفوع من حساب آخر
        uploadToken: uploadSignature(user.id, filename),
        size: file.size,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return handleApiError(error, 'تعذر رفع الملف');
  }
}
