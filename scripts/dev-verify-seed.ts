/**
 * 🧪 بذرة قاعدة التحقق المؤقتة — تستخدم عميل التطبيق المُشفّر (نفس lib/db).
 * لا تُشغَّل إلا مع DATABASE_URL=file:./dev-verify.db
 */
import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL || '';
if (!/file:\.\/dev-verify\.db$/.test(url)) {
  console.error('[dev-verify-seed] REFUSED: DATABASE_URL must be exactly file:./dev-verify.db');
  process.exit(1);
}

async function main() {
  const passwordHash = await bcrypt.hash('Dev!Pass123', 12);

  const professor = await prisma.user.upsert({
    where: { email: 'prof@verify.local' },
    update: {},
    create: { email: 'prof@verify.local', name: 'د. اختبار التحقق', role: 'PROFESSOR', passwordHash },
  });
  const student = await prisma.user.upsert({
    where: { email: 'student@verify.local' },
    update: {},
    create: {
      email: 'student@verify.local',
      name: 'طالب اختبار التحقق',
      role: 'STUDENT',
      studentCode: 'VERIFY001',
      group: 'A',
      level: '2',
      passwordHash,
    },
  });
  const student2 = await prisma.user.upsert({
    where: { email: 'student2@verify.local' },
    update: {},
    create: {
      email: 'student2@verify.local',
      name: 'طالبة اختبار التحقق ٢',
      role: 'STUDENT',
      studentCode: 'VERIFY002',
      group: 'A',
      level: '2',
      passwordHash,
    },
  });

  const courseSpecs = [
    { code: 'VRF101', name: 'تفاضل وتكامل ١', creditHours: 3, group: 'A', day: 2, period: 1 },
    { code: 'VRF201', name: 'برمجة متقدمة', creditHours: 4, group: 'A', day: 3, period: 1 },
    // VRF305 تُعقد للجروب B فقط — نفس توقيت VRF101 (يوم 2 / حصة 1) ⇒ تعارض للطالب (جروب A)
    { code: 'VRF305', name: 'معادلات تفاضلية', creditHours: 3, group: 'B', day: 2, period: 1 },
    { code: 'VRF203', name: 'جبر خطي متقدم', creditHours: 8, group: 'A', day: 4, period: 2 },
  ];
  for (const spec of courseSpecs) {
    const course = await prisma.course.upsert({
      where: { code: spec.code },
      update: {},
      create: {
        code: spec.code,
        name: spec.name,
        creditHours: spec.creditHours,
        professorId: professor.id,
      },
    });
    await prisma.scheduleSlot.deleteMany({ where: { courseId: course.id } });
    await prisma.scheduleSlot.create({
      data: { group: spec.group, day: spec.day, period: spec.period, term: 'T1', courseId: course.id, room: 'قاعة التحقق' },
    });
  }

  console.log('[dev-verify-seed] fixture ready:', {
    professor: professor.email,
    student: student.email,
    student2: student2.email,
    courses: courseSpecs.map((c) => c.code),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
