/**
 * نقل الملفات القديمة من public/uploads/{resources,tasks} إلى storage/
 * وتحديث قاعدة البيانات لتشير إلى المسارات المحمية الجديدة.
 *
 *   npm run storage:migrate -- --dry-run   # معاينة بدون تعديل
 *   npm run storage:migrate                # تنفيذ فعلي
 *
 * الملفات داخل public يمكن لأي شخص تحميلها بدون تسجيل دخول،
 * لذلك نقلها ضروري لخصوصية ملفات المقررات وتسليمات الطلاب.
 */
import 'dotenv/config';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

const ROOT = process.cwd();
const LEGACY_RES = path.join(ROOT, 'public', 'uploads', 'resources');
const LEGACY_TASKS = path.join(ROOT, 'public', 'uploads', 'tasks');
const RES_DIR = path.join(ROOT, 'storage', 'uploads', 'resources');
const TASK_DIR = path.join(ROOT, 'storage', 'uploads', 'tasks');

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const RES_RE =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.pdf$/;
const TASK_RE =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(pdf|png|jpg|zip)$/;

const stats = { moved: 0, renamed: 0, missing: 0, skipped: 0, orphans: 0 };

function exists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

/** يحوّل أي اسم قديم إلى اسم آمن على شكل UUID.ext */
function normalizedName(name, ext) {
  const uuid = (name.match(UUID_RE) || [])[0]?.toLowerCase() || randomUUID();
  const wanted = ext || path.extname(name).toLowerCase();
  return `${uuid}${wanted}`;
}

async function moveFile(src, dest) {
  if (dryRun) return;
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  try {
    await fsp.rename(src, dest);
  } catch {
    await fsp.copyFile(src, dest);
    await fsp.rm(src, { force: true });
  }
}

async function migrateResources() {
  const rows = await prisma.resource.findMany({
    select: { id: true, storedName: true, originalName: true },
  });
  console.log(`\n📚 ملفات المقررات: ${rows.length}`);

  for (const row of rows) {
    const legacy = path.join(LEGACY_RES, path.basename(row.storedName));
    const current = path.join(RES_DIR, path.basename(row.storedName));

    if (RES_RE.test(row.storedName) && exists(current)) {
      stats.skipped += 1;
      continue;
    }
    if (!exists(legacy)) {
      stats.missing += 1;
      console.warn(`  ⚠️ ملف مفقود: ${row.storedName} (${row.originalName})`);
      continue;
    }

    const targetName = normalizedName(row.storedName, '.pdf');
    const target = path.join(RES_DIR, targetName);
    if (targetName !== row.storedName) stats.renamed += 1;

    console.log(
      `  ${dryRun ? '🔍' : '📦'} ${row.storedName} → storage/uploads/resources/${targetName}`,
    );
    await moveFile(legacy, target);
    if (!dryRun) {
      await prisma.resource.update({
        where: { id: row.id },
        data: { storedName: targetName },
      });
    }
    stats.moved += 1;
  }
}

async function migrateSubmissions() {
  // كل التسليمات التجريبية تشير لنفس الملف — نعالج كل مسار مرة واحدة
  const groups = await prisma.taskSubmission.groupBy({
    by: ['fileUrl'],
    where: { fileUrl: { not: null } },
    _count: { _all: true },
  });
  const total = groups.reduce((sum, g) => sum + g._count._all, 0);
  console.log(`\n📝 تسليمات الطلاب: ${total} سجل · ${groups.length} ملف مميز`);

  for (const group of groups) {
    const raw = group.fileUrl || '';
    const clean = raw.split('?')[0];
    const base = path.basename(clean);

    // مسار جديد بالفعل + الملف موجود
    if (clean.startsWith('/api/files/task/') && TASK_RE.test(base)) {
      if (exists(path.join(TASK_DIR, base))) {
        stats.skipped += 1;
        continue;
      }
    }

    // نرفض أي رابط خارجي — لا ننقله ولا نبقيه
    if (/^[a-z]+:\/\//i.test(clean)) {
      console.warn(`  ⚠️ رابط خارجي (سيُفرغ): ${raw}`);
      if (!dryRun) {
        await prisma.taskSubmission.updateMany({
          where: { fileUrl: raw },
          data: { fileUrl: null },
        });
      }
      stats.missing += 1;
      continue;
    }

    const legacy = path.join(LEGACY_TASKS, base);
    if (!exists(legacy)) {
      // قد يكون في storage باسم مختلف قليلًا
      if (exists(path.join(TASK_DIR, base)) && TASK_RE.test(base)) {
        if (!dryRun) {
          await prisma.taskSubmission.updateMany({
            where: { fileUrl: raw },
            data: { fileUrl: `/api/files/task/${base}` },
          });
        }
        stats.skipped += 1;
        continue;
      }
      stats.missing += 1;
      console.warn(`  ⚠️ ملف تسليم مفقود: ${base}`);
      continue;
    }

    const ext = path.extname(base).toLowerCase();
    const targetName = normalizedName(base, ext);
    const target = path.join(TASK_DIR, targetName);
    console.log(
      `  ${dryRun ? '🔍' : '📦'} ${base} → storage/uploads/tasks/${targetName}`,
    );
    await moveFile(legacy, target);
    if (!dryRun) {
      await prisma.taskSubmission.updateMany({
        where: { fileUrl: raw },
        data: { fileUrl: `/api/files/task/${targetName}` },
      });
    }
    stats.moved += 1;
  }
}

/** ينقل أي ملفات متبقية غير مرتبطة بسجل (حتى لا تبقى مكشوفة في public) */
async function sweepLegacy(dir, targetDir, re) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (!exists(file)) continue;
    const targetName = re.test(name) ? name : normalizedName(name, path.extname(name).toLowerCase());
    const target = path.join(targetDir, targetName);
    console.log(
      `  ${dryRun ? '🔍' : '🧹'} ملف غير مرتبط: ${name} → ${path.relative(ROOT, target)}`,
    );
    await moveFile(file, target);
    stats.orphans += 1;
  }
}

try {
  if (dryRun) console.log('🔍 وضع المعاينة فقط — لن يتم تعديل أي شيء\n');

  await migrateResources();
  await migrateSubmissions();

  console.log('\n🧹 تنظيف الملفات المتبقية داخل public:');
  await sweepLegacy(LEGACY_RES, RES_DIR, RES_RE);
  await sweepLegacy(LEGACY_TASKS, TASK_DIR, TASK_RE);

  if (!dryRun) {
    // إزالة المجلدات الفارغة فقط
    for (const dir of [LEGACY_RES, LEGACY_TASKS]) {
      try {
        if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
          fs.rmdirSync(dir);
        }
      } catch {
        /* تجاهل */
      }
    }
  }

  console.log(
    `\n✅ انتهى: ${stats.moved} منقول، ${stats.renamed} معاد تسميته، ` +
      `${stats.skipped} موجود مسبقًا، ${stats.missing} مفقود، ${stats.orphans} غير مرتبط.`,
  );
  if (dryRun) console.log('شغّل الأمر بدون --dry-run للتنفيذ الفعلي.\n');
} catch (error) {
  console.error('\n❌ فشل النقل:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
