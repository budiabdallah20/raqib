import { createHmac, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * ملفات المحاضرات وتسليمات الطلاب لا تُخزَّن داخل public.
 * أي وصول لها يمر عبر /api/files/* مع فحص الصلاحيات.
 */
export const STORAGE_ROOT = path.join(process.cwd(), 'storage');
export const RESOURCE_DIR = path.join(STORAGE_ROOT, 'uploads', 'resources');
export const TASK_DIR = path.join(STORAGE_ROOT, 'uploads', 'tasks');
export const AVATAR_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

// أسماء تولّدها السيرفر فقط — لا مسارات ولا امتدادات غريبة
export const RESOURCE_NAME_RE =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.pdf$/;
export const TASK_NAME_RE =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(pdf|png|jpg|zip)$/;

export const RESOURCE_MIME = 'application/pdf';

export function taskMimeOf(name: string) {
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg')) return 'image/jpeg';
  return 'application/zip';
}

/** يمنع path traversal حتى لو مرّ اسم غريب من مكان آخر */
export function safePath(dir: string, name: string, re: RegExp) {
  if (!re.test(name)) return null;
  const base = path.basename(name);
  const full = path.resolve(dir, base);
  if (!full.startsWith(path.resolve(dir) + path.sep)) return null;
  return full;
}

export async function fileExists(fullPath: string | null) {
  if (!fullPath) return false;
  try {
    const stat = await fs.promises.stat(fullPath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function ensureDirs() {
  await Promise.all([
    fs.promises.mkdir(RESOURCE_DIR, { recursive: true }),
    fs.promises.mkdir(TASK_DIR, { recursive: true }),
    fs.promises.mkdir(AVATAR_DIR, { recursive: true }),
  ]);
}

/**
 * توقيع يربط الملف المرفوع بصاحبه.
 * يمنع طالبًا من تقديم ملف طالب آخر حتى لو عرف اسمه العشوائي.
 */
function uploadKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET is missing');
  return secret;
}

export function uploadSignature(userId: string, storedName: string) {
  return createHmac('sha256', uploadKey())
    .update(`${userId}:${storedName}`)
    .digest('base64url')
    .slice(0, 32);
}

export function verifyUploadSignature(
  userId: string,
  storedName: string,
  signature: string | null,
) {
  if (!signature) return false;
  try {
    const expected = Buffer.from(uploadSignature(userId, storedName));
    const actual = Buffer.from(signature);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
