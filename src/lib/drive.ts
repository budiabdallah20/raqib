import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

/**
 * رقيب × Google Drive — محرك تخزين عالي السعة بدون تكلفة.
 *
 * الوضع 1 (rest):  GDRIVE_CLIENT_ID + GDRIVE_CLIENT_SECRET + GDRIVE_REFRESH_TOKEN
 *   → تجديد الـaccess token من oauth2.googleapis.com ثم نداء Drive v3 مباشرة.
 *   هذا هو الوضع المفضل ويحتاج OAuth client خاص (بلا فاتورة، Cloud Console مجاني).
 *
 * الوضع 2 (rclone): وجود rclone مع remote باسم gdrive وعُلامة توثيق في rclone.conf
 *   → نستخدم `rclone rcat` (بَثّ من stdin بدون أي ملفات مؤقتة) للرفع
 *   و`rclone cat` للقراءة. يعمل حرفيًا الآن بعد مصادقة المتصفح.
 *
 * إسقاط المجلدات داخل Drive:  raqib/<resources|tasks|backups>/<اسم الملف>
 * يُخزّن driveFileId/externalUrl في Postgres (Neon) — لاشيء محليًا سوى التوكنات.
 */

export type DriveMode = 'rest' | 'rclone';

export type DriveUploadResult = {
  mode: DriveMode;
  /** في rest: Google file id — في rclone: مسار gdrive: الكامل */
  driveFileId: string;
  name: string;
  size: number;
  mimeType: string;
  externalUrl: string | null;
};

export type DriveFolder = 'resources' | 'tasks' | 'backups';

const DRIVE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_UPLOAD_URL =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

/** اسم المجلد الجذر داخل Drive (أُنشئ عبر rclone mkdir gdrive:raqib) */
const ROOT_NAME = process.env.GDRIVE_ROOT_FOLDER_NAME || 'raqib';

/* ------------------------------------------------------------------ */
/* اكتشاف الوضع                                                        */
/* ------------------------------------------------------------------ */

function restCreds() {
  const clientId = (process.env.GDRIVE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GDRIVE_CLIENT_SECRET || '').trim();
  const refreshToken = normalizeEnvString(process.env.GDRIVE_REFRESH_TOKEN);
  return { clientId, clientSecret, refreshToken, ok: Boolean(clientId && clientSecret && refreshToken) };
}

/** قد تصل قيمة الـenv محتوية على اقتباسات أو `$` مهرَّب من بعض المحمّلات — نطبعّعها */
function normalizeEnvString(raw: string | undefined) {
  let v = (raw || '').trim();
  if (/^".*"$/s.test(v) || /^'.*'$/s.test(v)) v = v.slice(1, -1);
  v = v.replace(/\\\$/g, '$');
  return v.trim();
}

/** هل rclone متاح ومعه رمز توثيق في ملف الإعداد؟ */
function rcloneState(): { exe: string; ok: boolean } {
  const exe = (process.env.RCLONE_EXE || 'rclone').trim();
  const confPath =
    process.env.RCLONE_CONFIG ||
    (process.platform === 'win32'
      ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'rclone', 'rclone.conf')
      : path.join(os.homedir(), '.config', 'rclone', 'rclone.conf'));
  try {
    if (!fs.existsSync(confPath)) return { exe, ok: false };
    const text = fs.readFileSync(confPath, 'utf8');
    const section = new RegExp(`\\[${process.env.RCLONE_REMOTE || 'gdrive'}\\][\\s\\S]*?(?=\\n\\[|$)`);
    const matched = text.match(section);
    if (!matched) return { exe, ok: false };
    return { exe, ok: /refresh_token/.test(matched[0]) };
  } catch {
    return { exe, ok: false };
  }
}

/** الوضع النشط حاليًا — null = لا يوجد تكوين Drive (يبقى كل شيء محليًا) */
export function driveMode(): DriveMode | null {
  const rest = restCreds();
  if (rest.ok) return 'rest';
  if (rcloneState().ok) return 'rclone';
  return null;
}

export function driveStatus() {
  const rest = restCreds();
  const rc = rcloneState();
  return {
    configured: driveMode() !== null,
    restReady: rest.ok,
    rcloneReady: rc.ok,
    /** client_id/secret من rclone الافتراضي فارغان — تبدّلهما بعد إعداد OAuth client خاص */
    needsOwnClient: !rest.ok,
  };
}

export type DriveStorage = {
  configured: boolean;
  mode: DriveMode | null;
  usedBytes: number | null;
  totalBytes: number | null;
};

/** قراءة سعة Drive الحية: ABOUT للـ REST أو `rclone about` للـ rclone — null = تعذر القياس */
export async function driveStorage(): Promise<DriveStorage> {
  const mode = driveMode();
  const base: DriveStorage = {
    configured: mode !== null,
    mode,
    usedBytes: null,
    totalBytes: null,
  };
  if (!mode) return base;

  if (mode === 'rest') {
    const token = await restAccessToken();
    if (!token) return base;
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) return base;
      const data = (await res.json()) as { storageQuota?: { limit?: string; usage?: string } };
      return {
        ...base,
        usedBytes: data.storageQuota?.usage ? Number(data.storageQuota.usage) : null,
        totalBytes: data.storageQuota?.limit ? Number(data.storageQuota.limit) : null,
      };
    } catch {
      return base;
    }
  }

  // وضع rclone — يقرأ عن بُعد via spawnRclone
  const rc = rcloneState();
  if (!rc.ok) return base;
  try {
    const remote = process.env.RCLONE_REMOTE || 'gdrive';
    const result = await spawnRclone(['about', `${remote}:`, '--json'], undefined, 20_000);
    if (!result.ok) return base;
    const data = JSON.parse(result.stdout.toString('utf8')) as {
      Total?: number; Used?: number; total?: number; used?: number;
    };
    return {
      ...base,
      usedBytes: data.used ?? data.Used ?? null,
      totalBytes: data.total ?? data.Total ?? null,
    };
  } catch {
    return base;
  }
}

/* ------------------------------------------------------------------ */
/* الوضع 1: REST                                                       */
/* ------------------------------------------------------------------ */

let cachedToken: { token: string; expiresAt: number } | null = null;

async function restAccessToken(): Promise<string | null> {
  const { clientId, clientSecret, refreshToken } = restCreds();
  if (!clientId || !clientSecret || !refreshToken) return null;

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  try {
    const res = await fetch(DRIVE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
    return cachedToken.token;
  } catch {
    return null;
  }
}

/** يبحث عن مجلد فرعي داخل الجذر ويُنشئه إن لم يوجد — يعيد id أو null */
async function restEnsureSubfolder(folder: DriveFolder, rootId: string): Promise<string | null> {
  const token = await restAccessToken();
  if (!token) return null;

  try {
    const query = encodeURIComponent(
      `name='${folder.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${rootId}' in parents`,
    );
    const list = await fetch(`${DRIVE_FILES_URL}?q=${query}&fields=files(id,name)&pageSize=1`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (list.ok) {
      const data = (await list.json()) as { files?: { id: string }[] };
      if (data.files?.length) return data.files[0].id;
    }

    const created = await fetch(`${DRIVE_FILES_URL}?fields=id`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: folder, mimeType: 'application/vnd.google-apps.folder', parents: [rootId] }),
    });
    if (!created.ok) return null;
    const createdData = (await created.json()) as { id?: string };
    return createdData.id ?? null;
  } catch {
    return null;
  }
}

async function restRootFolderId(): Promise<string | null> {
  const explicit = (process.env.GDRIVE_ROOT_FOLDER_ID || '').trim();
  if (explicit) return explicit;
  const token = await restAccessToken();
  if (!token) return null;
  try {
    const query = encodeURIComponent(
      `name='${ROOT_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents`,
    );
    const res = await fetch(`${DRIVE_FILES_URL}?q=${query}&fields=files(id,name)&pageSize=1`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { files?: { id: string }[] };
    return data.files?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function restUpload(
  name: string,
  mime: string,
  buffer: Buffer,
  folder: DriveFolder,
): Promise<DriveUploadResult | null> {
  const token = await restAccessToken();
  if (!token) return null;
  const rootId = await restRootFolderId();
  if (!rootId) return null;
  const parentId = await restEnsureSubfolder(folder, rootId);
  if (!parentId) return null;

  const boundary = 'raqib-drive-multipart';
  try {
    const head = Buffer.from(
      `\r\n--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: [parentId] })}\r\n--${boundary}\r\ncontent-type: ${mime}\r\n\r\n`,
      'utf8',
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([head, buffer, tail]);

    const res = await fetch(DRIVE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': `multipart/related; boundary=${boundary}`,
      },
      body: new Uint8Array(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string; webViewLink?: string };
    if (!data.id) return null;
    return {
      mode: 'rest',
      driveFileId: data.id,
      name,
      size: buffer.byteLength,
      mimeType: mime,
      externalUrl: data.webViewLink ?? null,
    };
  } catch {
    return null;
  }
}

async function restDelete(fileId: string): Promise<boolean> {
  const token = await restAccessToken();
  if (!token) return false;
  try {
    const res = await fetch(`${DRIVE_FILES_URL}/${fileId}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* الوضع 2: rclone (بَثّ stdin — بلا ملفات مؤقتة)                       */
/* ------------------------------------------------------------------ */

function rcloneDrivesPath(folder: DriveFolder, name: string) {
  return `gdrive:${[ROOT_NAME, folder, name].filter(Boolean).join('/')}`;
}

interface RcloneResult {
  ok: boolean;
  stderr: string;
  child: ChildProcessWithoutNullStreams | null;
}

function spawnRclone(args: string[], stdin?: Buffer, timeoutMs = 90_000): Promise<RcloneResult & { stdout: Buffer }> {
  return new Promise((resolve) => {
    const { exe, ok } = rcloneState();
    if (!ok) return resolve({ ok: false, stderr: 'rclone remote غير موثّق', child: null, stdout: Buffer.alloc(0) });
    try {
      const child = spawn(exe, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
      let stdout = Buffer.alloc(0);
      let stderr = '';
      const timer = setTimeout(() => {
        stderr += '\nrclone timeout';
        child.kill('SIGKILL');
      }, timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        stdout = Buffer.concat([stdout, chunk]);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr = (stderr + chunk.toString()).slice(-8000);
      });
      child.on('error', (err: Error) => {
        clearTimeout(timer);
        resolve({ ok: false, stderr: `${stderr}\n${err.message}`, child: null, stdout: Buffer.alloc(0) });
      });
      child.on('close', (code: number | null) => {
        clearTimeout(timer);
        resolve({ ok: code === 0, stderr, child, stdout });
      });
      if (stdin) child.stdin.end(stdin);
      else child.stdin.end();
    } catch (err) {
      resolve({ ok: false, stderr: (err as Error).message, child: null, stdout: Buffer.alloc(0) });
    }
  });
}

async function rcloneUpload(name: string, mime: string, buffer: Buffer, folder: DriveFolder): Promise<DriveUploadResult | null> {
  const target = rcloneDrivesPath(folder, name);
  // rclone يستنتج الـmime من الامتداد تلقائيًا (pdf/png/jpg/zip كلها معروفة)
  const result = await spawnRclone(['rcat', '--quiet', '--', target], buffer, 120_000);
  if (!result.ok) {
    console.error('[drive] rclone rcat فشل:', result.stderr.slice(-400));
    return null;
  }
  return { mode: 'rclone', driveFileId: target, name, size: buffer.byteLength, mimeType: mime, externalUrl: null };
}

function rcloneReadStream(key: string): ReadableStream | null {
  const { exe, ok } = rcloneState();
  if (!ok) return null;
  try {
    const child = spawn(exe, ['cat', '--', key], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    return Readable.toWeb(child.stdout) as unknown as ReadableStream;
  } catch {
    return null;
  }
}

async function rcloneDelete(key: string): Promise<boolean> {
  const result = await spawnRclone(['deletefile', '--quiet', '--', key], undefined, 60_000);
  return result.ok;
}

/* ------------------------------------------------------------------ */
/* الواجهة العامة                                                      */
/* ------------------------------------------------------------------ */

/**
 * يرفع ملفًا إلى Drive بأحد الوضعين ويدفع {driveFileId, externalUrl…}
 * يعيد null عند تعذر الرفع — المتصل ينسحب بأمان إلى التخزين المحلي.
 */
export async function driveUpload(params: {
  name: string;
  mime: string;
  buffer: Buffer;
  folder: DriveFolder;
}): Promise<DriveUploadResult | null> {
  const mode = driveMode();
  if (!mode) return null;
  if (mode === 'rest') return restUpload(params.name, params.mime, params.buffer, params.folder);
  return rcloneUpload(params.name, params.mime, params.buffer, params.folder);
}

/** يُخرِج ReadableStream من ملف في Drive — key إما gdrive:path أو Google file id */
export async function driveFileStream(key: string): Promise<ReadableStream | null> {
  if (key.startsWith('gdrive:')) return rcloneReadStream(key);
  if (driveMode() !== 'rest') return null;
  try {
    const token = await restAccessToken();
    if (!token) return null;
    const res = await fetch(`${DRIVE_FILES_URL}/${key}?alt=media`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok || !res.body) return null;
    return res.body;
  } catch {
    return null;
  }
}

export async function driveDelete(key: string): Promise<boolean> {
  if (key.startsWith('gdrive:')) return rcloneDelete(key);
  if (driveMode() !== 'rest') return false;
  return restDelete(key);
}

/** ما إذا كان النص يشبه مفتاح Drive (gdrive:path أو Google file id) */
export function isDriveKey(value: string | null | undefined): value is string {
  if (!value) return false;
  if (value.startsWith('gdrive:')) return true;
  return /^[A-Za-z0-9_-]{20,}$/.test(value) && !value.endsWith('.pdf') && !value.includes('/');
}
