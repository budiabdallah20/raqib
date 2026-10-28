// scripts/db-inspect-portals.mjs — فحص بيانات البوابات في قاعدة التطوير
// الاستخدام: node scripts/db-inspect-portals.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const courses = await prisma.course.findMany({
    orderBy: { code: 'asc' },
    select: { code: true, name: true, professor: { select: { name: true } } },
  });
  console.log(`COURSES (${courses.length}):`);
  for (const c of courses) console.log(`  ${c.code} · ${c.name} · ${c.professor?.name ?? '—'}`);

  const slots = await prisma.scheduleSlot.findMany({
    orderBy: [{ group: 'asc' }, { day: 'asc' }, { period: 'asc' }],
    include: { course: { select: { code: true } } },
  });
  console.log(`\nSLOTS (${slots.length}):`);
  for (const s of slots) {
    console.log(
      `  ${s.group} d${s.day}p${s.period} ${s.kind} ${s.course.code} ${s.room ?? ''}${s.isVip ? ' [VIP]' : ''}`,
    );
  }

  console.log('\nSETTINGS:');
  for (const s of await prisma.appSetting.findMany()) console.log(`  ${s.key} = ${s.value}`);

  const student = await prisma.user.findUnique({
    where: { email: 'student@raqib.edu' },
    select: {
      name: true,
      studentCode: true,
      group: true,
      level: true,
      enrollments: { select: { course: { select: { code: true } } } },
      grades: { select: { quiz: true, work: true, midterm: true, course: { select: { code: true } } } },
      attendances: { select: { status: true, lecture: { select: { title: true } } } },
    },
  });
  if (student) {
    console.log(`\nDEMO STUDENT: ${student.name} (${student.studentCode}) جروب ${student.group} فرقة ${student.level}`);
    console.log(`  enrolled: ${student.enrollments.map((e) => e.course.code).join(', ') || '—'}`);
    console.log(
      `  grades: ${
        student.grades.map((g) => `${g.course.code}[q${g.quiz ?? '—'},w${g.work ?? '—'},m${g.midterm ?? '—'}]`).join(' ') || '—'
      }`,
    );
    console.log(`  attendance records: ${student.attendances.length}`);
  } else {
    console.log('\nDEMO STUDENT: غير موجود');
  }

  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.lecture.count(),
    prisma.attendance.count(),
    prisma.grade.count(),
    prisma.task.count(),
  ]);
  console.log(`\nCOUNTS: users=${counts[0]} lectures=${counts[1]} attendance=${counts[2]} grades=${counts[3]} tasks=${counts[4]}`);
} catch (error) {
  console.error('INSPECT FAILED:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
