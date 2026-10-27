#!/usr/bin/env node
/**
 * db-purge-demo.mjs — تصفير البيانات الوهمية/الديمو مع الحفاظ على الحسابات الحية.
 *
 * القواعد:
 *  1. نسخة احتياطية تلقائية قبل أي حذف (prisma/backups/dev.db.purge-<stamp>).
 *  2. تُحذف بيانات الاستخدام الوهمية بالكامل: الحضور، الدرجات، التسجيلات، المحاضرات،
 *     المقررات، الجداول الزمنية، المهام والتسليمات، المصادر، الإشعارات، رموز الاستعادة.
 *  3. تُقبل الإعدادات (AppSetting) والاقتباسات (Quote) وسجل التدقيق (AuditLog) كما هي
 *     لأنها محتوى/تكوين حي وليست إحصائيات مُنتَجة.
 *  4. حسابات الطلاب والدكاترة تُحذف فقط إن كانت "ديمو": ما لها جلسة دخول ولا أُنشئت اليوم.
 *     (Admin يُحتفظ به دائمًا.)
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function counts(label, tx) {
  const db = tx ?? prisma;
  const [users, admins, professors, students, sessions, courses, lectures, attendance, enrollments, grades, tasks, submissions, resources, notifications, schedule, tokens, passkeys] = await Promise.all([
    db.user.count(), db.user.count({ where: { role: 'ADMIN' } }),
    db.user.count({ where: { role: 'PROFESSOR' } }), db.user.count({ where: { role: 'STUDENT' } }),
    db.session.count(), db.course.count(), db.lecture.count(), db.attendance.count(),
    db.enrollment.count(), db.grade.count(), db.task.count(), db.taskSubmission.count(),
    db.resource.count(), db.notification.count(), db.scheduleSlot.count(),
    db.passwordResetToken.count(), db.passkeyCredential.count(),
  ]);
  console.log(`— ${label}`);
  console.log(`  users=${users} (ADMIN=${admins} PROF=${professors} STUD=${students}) sessions=${sessions}`);
  console.log(`  courses=${courses} lectures=${lectures} attendance=${attendance} enrollments=${enrollments} grades=${grades} tasks=${tasks} submissions=${submissions} resources=${resources} notifs=${notifications} slots=${schedule} tokens=${tokens} passkeys=${passkeys}`);
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const root = resolve(process.cwd());
  const dbPath = join(root, 'prisma', 'dev.db');
  const backupDir = join(root, 'prisma', 'backups');
  const backupPath = join(backupDir, `dev.db.purge-${stamp}`);

  await counts('قبل التصفير');

  // 1) نسخة احتياطية (db + wal + shm إن وجدت)
  mkdirSync(backupDir, { recursive: true });
  copyFileSync(dbPath, backupPath);
  for (const side of ['-wal', '-shm']) {
    if (existsSync(dbPath + side)) copyFileSync(dbPath + side, backupPath + side);
  }
  console.log(`📦 نسخة احتياطية: prisma/backups/dev.db.purge-${stamp}`);

  // 2) التصفير داخل معاملة واحدة
  const r = await prisma.$transaction(async (tx) => {
    const n = async (m) => (await (tx[m] ?? tx[m]).deleteMany({})).count;

    const attendance = (await tx.attendance.deleteMany({})).count;
    const grades = (await tx.grade.deleteMany({})).count;
    const submissions = (await tx.taskSubmission.deleteMany({})).count;
    const tasks = (await tx.task.deleteMany({})).count;
    const resources = (await tx.resource.deleteMany({})).count;
    const enrollments = (await tx.enrollment.deleteMany({})).count;
    const lectures = (await tx.lecture.deleteMany({})).count;
    const slots = (await tx.scheduleSlot.deleteMany({})).count;
    const courses = (await tx.course.deleteMany({})).count;
    const notifications = (await tx.notification.deleteMany({})).count;
    const tokens = (await tx.passwordResetToken.deleteMany({})).count;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    // الديمو = لا جلسة له + لم يُنشأ اليوم + ليس إدمن
    const users = (await tx.user.deleteMany({
      where: {
        role: { not: 'ADMIN' },
        sessions: { none: {} },
        createdAt: { lt: todayStart },
      },
    })).count;

    return { attendance, grades, submissions, tasks, resources, enrollments, lectures, slots, courses, notifications, tokens, users };
  });

  console.log('🗑️ المحذوف:', JSON.stringify(r, null, 2));
  await counts('بعد التصفير');
}

main()
  .catch((e) => { console.error('PURGE FAILED:', e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
