/** تنظيف مستخدم التدقيق المؤقت + إثبات سلوك ال Cascade
 *  الاستعمال: node scripts/db-cleanup-audit.mjs --email=user@raqib.test
 *  أو بدون إيدينت — يقرأ آخر إيميل من scripts/.last-audit-email.txt إن وُجد
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const prisma = new PrismaClient();

const argEmail = process.argv.find((a) => a.startsWith('--email='));
let email = argEmail?.slice('--email='.length);
if (!email && fs.existsSync('scripts/.last-audit-email.txt')) {
  email = fs
    .readFileSync('scripts/.last-audit-email.txt', 'utf8')
    .trim()
    .replace('EMAIL WAS: ', '')
    .trim();
}
if (!email) {
  console.log('استعمال: node scripts/db-cleanup-audit.mjs --email=<بريد المستخدم>');
  process.exit(1);
}

const u = await prisma.user.findUnique({ where: { email } });
if (!u) {
  console.log('لا يوجد مستخدم للتنظيف:', email);
} else {
  const del = await prisma.user.delete({ where: { id: u.id } });
  console.log('تم حذف:', del.email, del.role, del.id);
  const after = await prisma.user.count();
  console.log('عدد المستخدمين بعد التنظيف:', after);
  const orphanSessions = await prisma.session.count({ where: { userId: del.id } });
  console.log('جلسات متسربة بعد الحذف (يجب 0):', orphanSessions);
}
await prisma.$disconnect();
