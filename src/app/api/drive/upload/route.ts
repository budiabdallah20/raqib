import { requireUser } from '@/lib/auth';
import { driveStatus, driveUpload } from '@/lib/drive';
import { assertRateLimit, handleApiError, jsonError, logAudit } from '@/lib/security';

export const runtime = 'nodejs';

const MAX_BYTES = 25 * 1024 * 1024; // 25 ميجابايت

const FOLDER_BY_ROLE = {
  STUDENT: ['tasks'],
  PROFESSOR: ['resources', 'tasks'],
  ADMIN: ['resources', 'tasks', 'backups'],
} as const;

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/;

function mimeFromType(file: File) {
  const known = ['application/pdf', 'image/png', 'image/jpeg', 'application/zip', 'image/webp', 'text/plain', 'text/markdown', 'application/json'];
  if (file.type && known.includes(file.type)) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.zip')) return 'application/zip';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

/** تحقق Magic Bytes — لا نثق بـ file.type أو الامتداد وحده. */
function sniffMime(buffer: Buffer, fallbackMime: string): string | null {
  if (buffer.length < 4) return null;
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) return 'application/zip';
  // نصوص: تحقق أن كل البايتات طباعة/مسافات وأن التباين UTF-8 ممكن
  if (fallbackMime.startsWith('text/') || fallbackMime === 'application/json') {
    const text = buffer.subarray(0, 4096).toString('utf8');
    if (!text.includes('\uFFFD') && !/[^\t\n\r\x20-\x7e\u00A0-\uFFFF]/.test(text)) {
      return fallbackMime;
    }
    return null;
  }
  return null;
}

// ───────────────────────────────────────────────────────
// POST /api/drive/upload — قناة رفع مباشرة إلى Google Drive
// multipart/form-data: file + folder? (resources | tasks | backups)
// نجاحها = الملف في Drive فقط؛ لا يُكتب أي صف في القاعدة من هنا
// (الصفوف تُكتب عبر /api/resources أو /api/tasks بعد التسجيل الصحيح).
// ───────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    assertRateLimit(`drive-upload:${user.id}`, 30, 60 * 60 * 1000);

    const status = driveStatus();
    if (!status.configured) {
      return jsonError('التخزين السحابي غير مفعّل على السيرفر', 503);
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return jsonError('لم يتم اختيار ملف (حقل file مطلوب)');
    if (file.size === 0) return jsonError('الملف فارغ');
    if (file.size > MAX_BYTES) return jsonError('حجم الملف يتجاوز 25 ميجابايت');

    const allowed = FOLDER_BY_ROLE[user.role] ?? ['tasks'];
    const requested = String(form.get('folder') || '').trim() || allowed[0];
    if (!(allowed as readonly string[]).includes(requested)) {
      return jsonError('هذا المجلد غير متاح لدورك الحالي', 403);
    }

    // اسم نظيف وآمن: نمنع أي مساعدات خادعة قبل تكوين مسار Drive
    const safeName = file.name.split(/[\\/]/).pop() || '';
    if (!NAME_RE.test(safeName)) {
      return jsonError('اسم الملف غير مدعوم (حروف/أرقام/نقطة/شرطة/شرطة سفلية فقط)');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = mimeFromType(file);
    const sniffed = sniffMime(buffer, mime);
    if (!sniffed) {
      return jsonError('محتوى الملف غير مطابق لنوعه المعلن', 400);
    }

    const upload = await driveUpload({
      name: safeName,
      mime: sniffed,
      buffer,
      folder: requested as 'resources' | 'tasks' | 'backups',
    });

    if (!upload) {
      await logAudit({
        user: { id: user.id, role: user.role },
        request,
        action: 'DRIVE_UPLOAD_FAILED',
        entity: 'DriveFile',
        detail: { name: safeName, folder: requested, size: buffer.byteLength },
      });
      return jsonError('تعذر رفع الملف إلى Google Drive — حاول مجددًا', 502);
    }

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'DRIVE_UPLOAD',
      entity: 'DriveFile',
      detail: {
        name: safeName,
        folder: requested,
        size: buffer.byteLength,
        driveMode: upload.mode,
        driveFileId: upload.driveFileId.slice(0, 120),
      },
    });

    return Response.json(
      {
        ok: true,
        mode: upload.mode,
        driveFileId: upload.driveFileId,
        name: upload.name,
        size: upload.size,
        mimeType: upload.mimeType,
        externalUrl: upload.externalUrl,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return handleApiError(error, 'تعذر الرفع إلى Google Drive');
  }
}

// ───────────────────────────────────────────────────────
// GET /api/drive/upload — حالة ربط Drive (للتشخيص فقط)
// ───────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await requireUser(['PROFESSOR', 'ADMIN']);
    return Response.json({ status: driveStatus() }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return handleApiError(error, 'تعذر قراءة حالة التخزين');
  }
}
