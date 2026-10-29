/**
 * تصفير قاعدة SQLite المحلية إلى JSON (data/dump.json) كمرحلة تهجير
 * إلى Postgres (db:dump ثم db:restore). ترتيب النماذج يحترم العلاقات
 * (السلالات أولًا ثم المراجع)، ويُعاد بناء الجلوة عبر upsert على المفتاح.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const chunks = {}; // اسم النموذج → صفوف

// Bytes (مثل paddingLeft publicKey) تُسلسل إلى {__b64}
function encodeBytes(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(value))) {
    return { __b64: Buffer.from(value).toString('base64') };
  }
  if (Array.isArray(value)) return value.map(encodeBytes);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = encodeBytes(v);
    return out;
  }
  return value;
}

async function main() {
  chunks.User = await prisma.user.findMany({ take: 100000 });
  chunks.Session = await prisma.session.findMany({ take: 100000 });
  chunks.PasswordResetToken = await prisma.passwordResetToken.findMany({ take: 100000 });
  chunks.PasskeyCredential = await prisma.passkeyCredential.findMany({ take: 100000 });
  chunks.Course = await prisma.course.findMany({ take: 100000 });
  chunks.Enrollment = await prisma.enrollment.findMany({ take: 100000 });
  chunks.Lecture = await prisma.lecture.findMany({ take: 100000 });
  chunks.Attendance = await prisma.attendance.findMany({ take: 100000 });
  chunks.ScheduleSlot = await prisma.scheduleSlot.findMany({ take: 100000 });
  chunks.AppSetting = await prisma.appSetting.findMany({ take: 1000 });
  chunks.Quote = await prisma.quote.findMany({ take: 10000 });
  chunks.Task = await prisma.task.findMany({ take: 100000 });
  chunks.TaskSubmission = await prisma.taskSubmission.findMany({ take: 100000 });
  chunks.Grade = await prisma.grade.findMany({ take: 100000 });
  chunks.GpaSnapshot = await prisma.gpaSnapshot.findMany({ take: 100000 });
  chunks.StudentNote = await prisma.studentNote.findMany({ take: 100000 });
  chunks.Resource = await prisma.resource.findMany({ take: 100000 });
  chunks.Notification = await prisma.notification.findMany({ take: 100000 });
  chunks.AuditLog = await prisma.auditLog.findMany({ take: 200000 });

  const total = Object.values(chunks).reduce((n, rows) => n + rows.length, 0);
  const payload = {
    generatedAt: new Date().toISOString(),
    dialect: 'sqlite',
    counts: Object.fromEntries(Object.entries(chunks).map(([k, v]) => [k, v.length])),
    rows: encodeBytes(chunks),
  };
  mkdirSync(join(process.cwd(), 'data'), { recursive: true });
  writeFileSync(join(process.cwd(), 'data', 'dump.json'), JSON.stringify(payload));
  console.log('[db:dump] rows:', total, '→', 'data/dump.json');
  for (const [k, v] of Object.entries(payload.counts)) console.log(`  ${k}: ${v}`);
}

main().finally(() => prisma.$disconnect());
