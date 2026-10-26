/**
 * فحص قاعدة بيانات رقيب: الاتصال + سلامة الملف + عدد السجلات في كل جدول.
 *   npm run db:verify
 * لا يعدّل أي بيانات.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TABLES = [
  'User',
  'Session',
  'Course',
  'Enrollment',
  'Lecture',
  'Attendance',
  'Task',
  'TaskSubmission',
  'Grade',
  'Resource',
  'Notification',
  'AuditLog',
  'AppSetting',
  'ScheduleSlot',
];

try {
  const integrity = await prisma.$queryRawUnsafe('PRAGMA integrity_check');
  const fk = await prisma.$queryRawUnsafe('PRAGMA foreign_key_check');
  const ok = Array.isArray(integrity) && integrity[0]?.integrity_check === 'ok';

  console.log('\nقاعدة البيانات: متصلة ✅');
  console.log(`السلامة (integrity_check): ${ok ? 'سليمة ✅' : 'مشكلة ❌'}`);
  console.log(
    `قيود المفاتيح الأجنبية: ${fk.length === 0 ? 'سليمة ✅' : `${fk.length} مخالفة ❌`}`,
  );

  console.log('\nعدد السجلات:');
  let total = 0;
  for (const name of TABLES) {
    try {
      const count = await prisma[name].count();
      total += count;
      console.log(`  ${name.padEnd(16)} ${String(count).padStart(8)}`);
    } catch {
      console.log(`  ${name.padEnd(16)} ${'(غير موجود)'.padStart(8)}`);
    }
  }
  console.log(`  ${'الإجمالي'.padEnd(16)} ${String(total).padStart(8)}\n`);

  // حسابات معطلة أو بانتظار الموافقة — مهمة للمراجعة الأمنية
  const pending = await prisma.user.count({
    where: { isActive: false, role: 'PROFESSOR' },
  });
  console.log(`دكاترة بانتظار الموافقة/معطلون: ${pending}`);

  if (!ok || fk.length > 0) process.exitCode = 1;
} catch (error) {
  console.error('\n❌ تعذر فحص القاعدة:', error.message, '\n');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
