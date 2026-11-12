/**
 * db-backup-drive.mjs — نسخة احتياطية كاملة من Neon Postgres مرفوعة إلى Google Drive.
 *
 *   node scripts/db-backup-drive.mjs
 *   KEEP_LOCAL=10 KEEP_DRIVE=5 node scripts/db-backup-drive.mjs
 *
 * المراحل:
 *   1) تصدير كل الجداول من DATABASE_URL (Neon pooled) إلى JSON معياري
 *      (نفس الوجهة المتوافقة مع scripts/db-restore.mjs سلفًا للمصفوفات)
 *   2) حفظ نسخة حديثة محليًا في data/backups مع تقليم الباتوتات
 *   3) رفعها إلى Drive عبر rclone rcat (بَثّ من stdin — بلا ملفات مؤقتة)
 *   4) تقليم النسخ القديمة داخل Drive بحد KEEP_DRIVE
 */
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createCipheriv, randomBytes, scryptSync } from 'node:crypto';

// loader هنا يدويًا لأن node يعمل خارج Next: نقرأ .env ثم .env.local (تفضيلية Next نفسها)
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { PrismaClient } from '@prisma/client';

const KEEP_LOCAL = Number(process.env.KEEP_LOCAL || 20);
const KEEP_DRIVE = Number(process.env.KEEP_DRIVE || 10);
const ROOT = process.env.GDRIVE_ROOT_FOLDER_NAME || 'raqib';

/** جميع نماذج Prisma بأسماء الـclient (camelCase) — PHASE 1: includes new foundation tables */
const MODELS = [
  'user',
  'session',
  'passwordResetToken',
  'passkeyCredential',
  'academicYear',
  'semester',
  'role',
  'roleAssignment',
  'course',
  'enrollment',
  'courseSection',
  'teachingAssignment',
  'lecture',
  'attendance',
  'scheduleSlot',
  'appSetting',
  'quote',
  'task',
  'taskSubmission',
  'grade',
  'gpaSnapshot',
  'studentNote',
  'resource',
  'notification',
  'auditLog',
];

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const FILE_NAME = `raqib-db-${stamp}.json`;
const OUT_DIR = path.resolve(process.cwd(), process.env.BACKUP_DIR || 'data', 'backups');
const OUT_PATH = path.join(OUT_DIR, FILE_NAME);

const SENSITIVE_DUMP_KEYS = new Set([
  'passwordHash', 'tokenHash', 'codeHash', 'publicKey',
]);

function redactRows(model, rows) {
  return rows.map((row) => {
    const copy = { ...row };
    for (const key of Object.keys(copy)) {
      if (SENSITIVE_DUMP_KEYS.has(key)) copy[key] = '[REDACTED]';
    }
    if (model === 'session') return { ...copy, tokenHash: '[REDACTED]' };
    return copy;
  });
}

function backupKey() {
  const raw = (process.env.PII_ENCRYPTION_KEY || process.env.JWT_SECRET || '').trim();
  if (!raw) throw new Error('PII_ENCRYPTION_KEY or JWT_SECRET is required to encrypt backups');
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const buf = Buffer.from(raw, 'base64url');
    if (buf.length === 32) return buf;
  } catch {}
  try {
    const buf = Buffer.from(normalized, 'base64');
    if (buf.length === 32) return buf;
  } catch {}
  return scryptSync(raw, 'raqib-backup-v1', 32);
}

function encryptBackup(plaintext) {
  const key = backupKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from('raqib-backup-v1', 'utf8'));
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]);
}

function bigintSafeReplacer(_key, value) {
  return typeof value === 'bigint' ? value.toString() : value;
}

function rclone(argv, { input } = {}) {
  const exe = process.env.RCLONE_EXE || 'rclone';
  const res = spawnSync(exe, argv, { input: input ?? undefined, encoding: 'buffer', windowsHide: true });
  return { ok: res.status === 0, stdout: res.stdout, stderr: (res.stderr || '').toString().slice(-500) };
}

async function main() {
  const url = process.env.DATABASE_URL || '';
  if (!url || url.startsWith('file:')) {
    console.error('❌ DATABASE_URL غير مناسب — يتطلب Neon Postgres');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  console.log('⏳ تصدير البيانات من Neon…');
  await prisma.$connect();

  const dump = {
    exportedAt: new Date().toISOString(),
    source: 'neon-postgres',
    tables: {},
  };
  let totalRows = 0;
  for (const model of MODELS) {
    const client = prisma[model];
    if (!client?.findMany) {
      console.warn(`⚠️ لا يوجد نموذج «${model}» — يُتجاهل`);
      dump.tables[model] = [];
      continue;
    }
    let rows = [];
    try {
      rows = await client.findMany();
    } catch (err) {
      console.warn(`⚠️ فشل تصدير ${model}: ${(err?.message || '').slice(0, 120)}`);
    }
    dump.tables[model] = redactRows(model, rows);
    if (rows.length) {
      console.log(`   ${model}: ${rows.length} صف`);
      totalRows += rows.length;
    }
  }

  await prisma.$disconnect();

  // 2) النسخة المحلية
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const plaintext = JSON.stringify(dump, bigintSafeReplacer, 2);
  const ciphertext = encryptBackup(plaintext);
  const ENC_PATH = OUT_PATH.replace(/\.json$/, '.json.enc');
  fs.writeFileSync(ENC_PATH, ciphertext);
  console.log(`💾 محليًا: ${OUT_PATH} (${totalRows} صف إجمالًا)`);

  // تقليم النسخ المحلية القديمة
  const local = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.startsWith('raqib-db-') && (f.endsWith('.json.enc') || f.endsWith('.json')))
    .sort()
    .reverse();
  for (const old of local.slice(KEEP_LOCAL)) {
    try {
      fs.unlinkSync(path.join(OUT_DIR, old));
    } catch {
      /* مش مشكلة */
    }
  }

  // 3) الرفع إلى Drive عبر rclone rcat
  if (!process.env.GDRIVE_REFRESH_TOKEN) {
    console.warn('⚠️ GDRIVE_REFRESH_TOKEN غير موجودة — تم حفظ النسخة محليًا فقط');
    return;
  }
  const drivePath = `gdrive:${ROOT}/backups/${FILE_NAME}.enc`;
  const upload = rclone(['rcat', '--quiet', drivePath], {
    input: fs.readFileSync(ENC_PATH),
  });
  if (!upload.ok) {
    console.error(`❌ فشل الرفع إلى Drive: ${upload.stderr}`);
    process.exit(2);
  }
  console.log(`☁️  رُفعت إلى Drive: ${drivePath}`);

  // 4) تقليم نسخ Drive الأقدم من KEEP_DRIVE
  const list = rclone(['lsjson', `gdrive:${ROOT}/backups`]);
  if (list.ok && list.stdout) {
    try {
      const files = JSON.parse(list.stdout.toString('utf8')).filter((f) => f.Name?.startsWith('raqib-db-'));
      const old = files.sort((a, b) => String(b.Name).localeCompare(String(a.Name))).slice(KEEP_DRIVE);
      for (const f of old) {
        rclone(['deletefile', `gdrive:${ROOT}/backups/${f.Name}`, '--quiet']);
        console.log(`🧹 حُذفت من Drive: ${f.Name}`);
      }
    } catch {
      /* التقليم اختياري */
    }
  }

  console.log('✅ النسخة الاحتياطية اكتملت');
}

main().catch((err) => {
  console.error('❌', err?.stack || err?.message || err);
  process.exit(1);
});
