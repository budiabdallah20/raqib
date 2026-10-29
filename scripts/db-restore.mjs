/**
 * استيراد تصفير data/dump.json داخل قاعدة DATABASE_URL (يُستخدم للتهجير إلى Postgres).
 * شروط التشغيل:
 *   1) العميل المولّد (PrismaClient) يجب أن يكون بلغة الهدف — نصدر أولًا:
 *      npm run build     (أو: node scripts/prisma-dialect.mjs && npx prisma generate --schema <الملف>)
 *   2) الجداول موجودة: node scripts/with-dialect.mjs db push
 *   3) ثم: npm run db:restore
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function decodeBytes(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(decodeBytes);
  if (typeof value === 'object') {
    if (typeof value.__b64 === 'string') return Buffer.from(value.__b64, 'base64');
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = decodeBytes(v);
    return out;
  }
  return value;
}

async function insertChunk(model, rows) {
  if (!rows.length) return 0;
  const decoded = rows.map((row) => decodeBytes(row));
  // createMany يحفظ المفاتيح كما هي — لا تعارض لأن التصفير كامل من قاعدة واحدة
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < decoded.length; i += 500) {
      await tx[model].createMany({ data: decoded.slice(i, i + 500) });
    }
  });
  return decoded.length;
}

async function main() {
  const dumpPath = join(process.cwd(), 'data', 'dump.json');
  const dump = JSON.parse(readFileSync(dumpPath, 'utf8'));
  console.log('[db:restore] dump generated at', dump.generatedAt);
  if (!/^postgres/i.test(process.env.DATABASE_URL || '')) {
    console.error('[db:restore] رفض التنفيذ: DATABASE_URL ليس postgres — التصفير محلي sqlite؛ هذا السكربت للتهجير إلى Postgres فقط.');
    process.exit(1);
  }

  const order = ['User', 'Session', 'PasswordResetToken', 'PasskeyCredential', 'Course', 'Enrollment', 'Lecture', 'Attendance', 'ScheduleSlot', 'AppSetting', 'Quote', 'Task', 'TaskSubmission', 'Grade', 'GpaSnapshot', 'StudentNote', 'Resource', 'Notification', 'AuditLog'];
  const keys = {
    User: 'user', Session: 'session', PasswordResetToken: 'passwordResetToken', PasskeyCredential: 'passkeyCredential',
    Course: 'course', Enrollment: 'enrollment', Lecture: 'lecture', Attendance: 'attendance', ScheduleSlot: 'scheduleSlot',
    AppSetting: 'appSetting', Quote: 'quote', Task: 'task', TaskSubmission: 'taskSubmission', Grade: 'grade',
    GpaSnapshot: 'gpaSnapshot', StudentNote: 'studentNote', Resource: 'resource', Notification: 'notification', AuditLog: 'auditLog',
  };

  for (const model of order) {
    const n = await insertChunk(keys[model], dump.rows[model] || []);
    console.log(`  ${model}: ${n} row(s)`);
  }
  console.log('[db:restore] مهّطره — خلص.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
