import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertRateLimit,
  getClientIp,
  handleApiError,
  jsonError,
} from '@/lib/security';

export const runtime = 'nodejs';

const MAX_BYTES = 3 * 1024 * 1024;

function detectType(bytes: Uint8Array) {
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

/**
 * رفع الصورة متاح أثناء التسجيل (قبل وجود حساب)، لذلك لا نطلب جلسة.
 * لكنه محمي بـ: same-origin من الـ middleware + حد IP + فحص magic bytes.
 * ملفات الصور فقط في مجلد public/uploads/avatars.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    assertRateLimit(
      `upload-avatar:${ip || 'unknown'}`,
      8,
      60 * 60 * 1000,
      'رفعت صورًا كثيرة. حاول بعد قليل',
    );

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return jsonError('لم يتم اختيار صورة');
    }
    if (file.size === 0) return jsonError('الملف فارغ');
    if (file.size > MAX_BYTES) {
      return jsonError('حجم الصورة يجب أن يكون أقل من 3 ميجابايت');
    }
    if (file.name.length > 200) return jsonError('اسم الملف طويل جدًا');

    const buffer = new Uint8Array(await file.arrayBuffer());
    const type = detectType(buffer);
    if (!type) {
      return jsonError('الصيغة غير مدعومة. استخدم PNG أو JPG أو WEBP');
    }

    const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${type.ext}`;
    await writeFile(path.join(dir, filename), buffer, { mode: 0o644 });

    return Response.json(
      {
        url: `/uploads/avatars/${filename}`,
        size: file.size,
        mime: type.mime,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return handleApiError(error, 'تعذر رفع الصورة');
  }
}
