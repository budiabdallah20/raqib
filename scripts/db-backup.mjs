/**
 * نسخة احتياطية متسقة من قاعدة SQLite باستخدام VACUUM INTO
 * (آمنة حتى لو السيرفر شغّال، عكس نسخ الملف مباشرة مع WAL).
 *
 *   npm run db:backup              # prisma/backups
 *   BACKUP_DIR=D:\backups npm run db:backup
 *
 * يحتفظ بآخر 20 نسخة فقط.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const KEEP = 20;
const url = process.env.DATABASE_URL || '';
if (!url.startsWith('file:')) {
  console.error('❌ هذا السكربت يدعم SQLite فقط (DATABASE_URL يبدأ بـ file:)');
  process.exit(1);
}

const relative = url.slice('file:'.length).replace(/^\.\//, '');
const dbPath = path.resolve(process.cwd(), 'prisma', relative);
const outDir = path.resolve(
  process.cwd(),
  process.env.BACKUP_DIR || path.join('prisma', 'backups'),
);

if (!fs.existsSync(dbPath)) {
  console.error(`❌ ملف القاعدة غير موجود: ${dbPath}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const target = path.join(outDir, `raqib-${stamp}.db`);

const prisma = new PrismaClient();
try {
  const quoted = target.replace(/'/g, "''");
  await prisma.$executeRawUnsafe(`VACUUM INTO '${quoted}'`);
} catch (error) {
  // خطة بديلة: نسخ الملف + الـ WAL إن وُجد
  try {
    fs.copyFileSync(dbPath, target);
    for (const suffix of ['-wal', '-shm']) {
      const side = `${dbPath}${suffix}`;
      if (fs.existsSync(side)) fs.copyFileSync(side, `${target}${suffix}`);
    }
    console.warn('⚠️ تم النسخ المباشر (VACUUM INTO غير مدعوم):', error.message);
  } catch (copyError) {
    console.error('❌ فشل النسخ:', copyError.message);
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}

if (fs.existsSync(target)) {
  const size = (fs.statSync(target).size / 1024).toFixed(1);
  console.log(`✅ نسخة احتياطية: ${target} (${size} KB)`);
}

// تنظيف النسخ القديمة
const files = fs
  .readdirSync(outDir)
  .filter((name) => /^raqib-.*\.db$/.test(name))
  .sort();
for (const old of files.slice(0, Math.max(0, files.length - KEEP))) {
  fs.unlinkSync(path.join(outDir, old));
  console.log(`🧹 حُذفت نسخة قديمة: ${old}`);
}
