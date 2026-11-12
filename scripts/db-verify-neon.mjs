/**
 * تحقق ترحيل Neon — أعداد في كل جدول + هوست الرابط (عدم طباعة أسرار).
 * مؤقت: يُحذف بعد إثبات الترحيل.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const models = [
  'user', 'session', 'passwordResetToken', 'passkeyCredential',
  'academicYear', 'semester', 'role', 'roleAssignment', 'course',
  'enrollment', 'courseSection', 'teachingAssignment',
  'lecture', 'attendance', 'scheduleSlot', 'appSetting',
  'quote', 'task', 'taskSubmission', 'grade', 'gpaSnapshot', 'studentNote',
  'resource', 'notification', 'auditLog',
];

try {
  let total = 0;
  for (const m of models) {
    const n = await prisma[m].count();
    total += n;
    console.log(`  ${m.padEnd(20)} ${String(n).padStart(6)}`);
  }
  console.log('  TOTAL', total);
  const url = process.env.DATABASE_URL || '';
  const host = url.replace(/^postgres(ql)?:\/\/[^@]*@/, '').split('/')[0];
  console.log('  host:', host);
  console.log('  pooled:', /-pooler/.test(host));
  const u = await prisma.user.findFirst({ select: { name: true, email: true } });
  console.log('  firstUser:', u?.name, `<${u?.email}>`);
} finally {
  await prisma.$disconnect();
}
