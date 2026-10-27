/**
 * تدقيق قاعدة بيانات رقيب — عدّاد جداول + سلامة كلمات السر + جلسات.
 * أمر лولي: node scripts/db-audit.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const countsOnly = args.includes('--counts');
const model = args.find((a) => a.startsWith('--model='))?.split('=')[1];

async function main() {
  const tasks = [
    ['User', prisma.user.count()],
    ['Session', prisma.session.count()],
    ['PasswordResetToken', prisma.passwordResetToken.count()],
    ['Course', prisma.course.count()],
    ['Enrollment', prisma.enrollment.count()],
    ['Lecture', prisma.lecture.count()],
    ['Attendance', prisma.attendance.count()],
    ['AuditLog', prisma.auditLog.count()],
    ['Grade', prisma.grade.count()],
    ['Task', prisma.task.count()],
    ['Notification', prisma.notification.count()],
  ];

  const rows = await Promise.all(tasks.map(([name, p]) => p.then((c) => ({ name, count: c }))));

  console.log('== عدد صفوف كل جدول ==');
  for (const { name, count } of rows) console.log(`${name}: ${count}`);

  if (countsOnly) return;

  const byRole = await prisma.user.groupBy({ by: ['role'], _count: { id: true } });
  console.log('\n== المستخدمين حسب الدور ==');
  for (const r of byRole) console.log(`${r.role}: ${r._count.id}`);

  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, studentCode: true, isActive: true, approvedAt: true, passwordHash: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: model ? 5 : 10,
  });

  console.log('\n== آخر المستخدمين المسجلين ==');
  for (const u of users) {
    const hash = u.passwordHash ?? '';
    const hashInfo = /^\$2[ab]\$/.test(hash) ? `bcrypt سليم (${hash.length} حرف)` : hash === '' ? 'فاضية!' : 'تنسيق غير معروف';
    console.log(
      `${u.name} | ${u.role} | code=${u.studentCode ?? '-'} | active=${u.isActive} | approved=${u.approvedAt ? 'yes' : 'no'} | password: ${hashInfo} | ${u.createdAt.toISOString()}`
    );
  }

  const sessions = await prisma.session.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, userId: true, expiresAt: true, createdAt: true } });
  console.log('\n== آخر الجلسات (توكنات JWT القابلة للإبطال) ==');
  for (const s of sessions) console.log(`${s.userId} | expires ${s.expiresAt.toISOString()} | ${s.createdAt.toISOString()}`);
}

main()
  .catch((e) => {
    console.error('فشل التدقيق:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
