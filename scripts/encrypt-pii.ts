/**
 * تشفير بيانات التعريف (PII) الموجودة مسبقًا في قاعدة البيانات — AES-256-GCM.
 *
 *   npm run security:encrypt-pii            # تنفيذ فعلي (idempotent)
 *   npm run security:encrypt-pii -- --dry-run
 *
 * ⚠️ مهم:
 *  - شغّله قبل نشر الكود الجديد على قاعدة الإنتاج، وإلا لن تعمل عمليات
 *    البحث/تسجيل الدخول على الصفوف القديمة غير المشفّرة.
 *  - استخدم نفس PII_ENCRYPTION_KEY في الإنتاج — لا تدوّره بعد الترحيل
 *    إلا عبر إعادة تشفير كاملة.
 *  - يعمل مع SQLite وPostgres حسب Prisma Client المولّد لنفس DATABASE_URL.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { encryptSensitive, isEncrypted } from '../src/lib/crypto';

const dryRun = process.argv.includes('--dry-run');
const PAGE_SIZE = 200;

if (!process.env.PII_ENCRYPTION_KEY?.trim()) {
  console.error('❌ PII_ENCRYPTION_KEY غير موجود. لن يتم الترحيل (حتى لا تُشفّر البيانات بمفتاح تطوير مؤقت).');
  process.exit(1);
}

const prisma = new PrismaClient();

type Row = { id: string };
type Updater = (id: string, data: Record<string, string>) => Promise<unknown>;

let scanned = 0;
let changed = 0;
let skipped = 0;

function cipher(value: string | null | undefined, context: string, deterministic = false) {
  if (value === null || value === undefined || value === '') return undefined;
  if (isEncrypted(value)) return undefined;
  return encryptSensitive(value, context, deterministic);
}

async function migrateModel(
  label: string,
  fetchPage: (cursor?: string) => Promise<Row[]>,
  buildUpdate: (row: Record<string, unknown>) => Record<string, string> | null,
  update: Updater,
) {
  let cursor: string | undefined;
  let modelChanged = 0;

  for (;;) {
    const rows = await fetchPage(cursor);
    if (rows.length === 0) break;

    for (const row of rows) {
      scanned += 1;
      const data = buildUpdate(row as Record<string, unknown>);
      if (!data) {
        skipped += 1;
        continue;
      }
      modelChanged += 1;
      changed += 1;
      if (!dryRun) await update(row.id, data);
    }

    cursor = rows[rows.length - 1]?.id;
    if (rows.length < PAGE_SIZE) break;
  }

  console.log(`   • ${label}: ${modelChanged} صف${dryRun ? ' (سيُشفّر)' : ' تم تشفيره'}`);
}

async function main() {
  console.log(`\n🔐 تشفير PII${dryRun ? ' — وضع المعاينة فقط (بدون كتابة)' : ''}\n`);

  await migrateModel(
    'User (email/phone/studentCode/nationalId)',
    (cursor) =>
      prisma.user.findMany({
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: { id: true, email: true, phone: true, studentCode: true, nationalId: true },
      }),
    (row) => {
      const data: Record<string, string> = {};
      const email = cipher(row.email as string | null, 'User.email', true);
      const phone = cipher(row.phone as string | null, 'User.phone', true);
      const studentCode = cipher(row.studentCode as string | null, 'User.studentCode', true);
      const nationalId = cipher(row.nationalId as string | null, 'User.nationalId', true);
      if (email) data.email = email;
      if (phone) data.phone = phone;
      if (studentCode) data.studentCode = studentCode;
      if (nationalId) data.nationalId = nationalId;
      return Object.keys(data).length ? data : null;
    },
    (id, data) => prisma.user.update({ where: { id }, data }),
  );

  await migrateModel(
    'StudentNote (title/body)',
    (cursor) =>
      prisma.studentNote.findMany({
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: { id: true, title: true, body: true },
      }),
    (row) => {
      const data: Record<string, string> = {};
      const title = cipher(row.title as string | null, 'StudentNote.title');
      const body = cipher(row.body as string | null, 'StudentNote.body');
      if (title) data.title = title;
      if (body) data.body = body;
      return Object.keys(data).length ? data : null;
    },
    (id, data) => prisma.studentNote.update({ where: { id }, data }),
  );

  await migrateModel(
    'TaskSubmission (feedback)',
    (cursor) =>
      prisma.taskSubmission.findMany({
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: { id: true, feedback: true },
      }),
    (row) => {
      const feedback = cipher(row.feedback as string | null, 'TaskSubmission.feedback');
      return feedback ? { feedback } : null;
    },
    (id, data) => prisma.taskSubmission.update({ where: { id }, data }),
  );

  await migrateModel(
    'Notification (body)',
    (cursor) =>
      prisma.notification.findMany({
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: { id: true, body: true },
      }),
    (row) => {
      const body = cipher(row.body as string | null, 'Notification.body');
      return body ? { body } : null;
    },
    (id, data) => prisma.notification.update({ where: { id }, data }),
  );

  await migrateModel(
    'Lecture (geofence)',
    (cursor) =>
      prisma.lecture.findMany({
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: { id: true, geofence: true },
      }),
    (row) => {
      const geofence = cipher(row.geofence as string | null, 'Lecture.geofence');
      return geofence ? { geofence } : null;
    },
    (id, data) => prisma.lecture.update({ where: { id }, data }),
  );

  await migrateModel(
    'AuditLog (detail)',
    (cursor) =>
      prisma.auditLog.findMany({
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: { id: true, detail: true },
      }),
    (row) => {
      const detail = cipher(row.detail as string | null, 'AuditLog.detail');
      return detail ? { detail } : null;
    },
    (id, data) => prisma.auditLog.update({ where: { id }, data }),
  );

  console.log(
    `\n${dryRun ? 'ℹ️  معاينة' : '✅ اكتمل'}: فُحص ${scanned} صف، ${changed} يحتاج/تم تشفيره، ${skipped} سليم مسبقًا.`,
  );
  if (dryRun) console.log('   أعد التشغيل بدون --dry-run للتنفيذ الفعلي.\n');
  else console.log('   خذ نسخة احتياطية من قاعدة البيانات قبل النشر.\n');
}

main()
  .catch((error) => {
    console.error('\n❌ فشل الترحيل:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
