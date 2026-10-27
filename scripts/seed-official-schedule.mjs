// scripts/seed-official-schedule.mjs — زرع الجدول الرسمي (PDF رسمي — مستوى 2 جروب B)
// وتنظيف بيانات الديمو العشوائية وتحديث إعداد فتح الترم التاني
// الاستخدام: node scripts/seed-official-schedule.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OFFICIAL_SLOTS = [
  { day: 2, period: 2, code: 'MAT207', kind: 'LECTURE', room: 'قاعة 1', teacher: 'د. نوجي محمد' },
  { day: 2, period: 3, code: 'COM201', kind: 'LECTURE', room: 'VIP Hall 2', vip: true, teacher: 'د. سماح أحمد' },
  { day: 3, period: 1, code: 'MAT201', kind: 'LECTURE', room: 'قاعة 1', teacher: 'د. بهة الله فتحي' },
  { day: 3, period: 2, code: 'MAT203', kind: 'LECTURE', room: 'قاعة 1', teacher: 'د. سمر محمد' },
  { day: 3, period: 3, code: 'MAT201', kind: 'SECTION', room: 'قاعة 1', teacher: 'م.م جميلة السيد' },
  { day: 3, period: 4, code: 'MAT213', kind: 'LECTURE', room: 'قاعة 1', teacher: 'د. إيهاب راشد' },
  { day: 4, period: 2, code: 'MAT305', kind: 'SECTION', room: 'قاعة 2', teacher: 'م. أحمد رزق' },
  { day: 4, period: 3, code: 'MAT305', kind: 'LECTURE', room: 'VIP Hall 2', vip: true, teacher: 'أ.م.د طارق إمام' },
  { day: 5, period: 1, code: 'MAT207', kind: 'SECTION', room: 'قاعة 2', teacher: 'م.م أسماء عبد العال' },
  { day: 5, period: 3, code: 'MAT211', kind: 'LECTURE', room: 'قاعة 1', teacher: 'أ.م.د محمد رمضان' },
  { day: 5, period: 4, code: 'COM201', kind: 'LAB', room: 'معمل الحاسب', teacher: 'م.م ياسمين' },
];

const OFFICIAL_CODES = ['MAT207', 'COM201', 'MAT201', 'MAT203', 'MAT213', 'MAT305', 'MAT211'];

try {
  const courses = await prisma.course.findMany({ select: { id: true, code: true } });
  const byCode = new Map(courses.map((c) => [c.code, c.id]));
  const officialIds = OFFICIAL_CODES.map((c) => byCode.get(c)).filter(Boolean);

  // 1) تنظيف كل الخانات الديمو العشوائية وبدء الجدول الرسمي من الصفر (ترم T1)
  await prisma.scheduleSlot.deleteMany({});
  for (const s of OFFICIAL_SLOTS) {
    const courseId = byCode.get(s.code);
    if (!courseId) {
      console.error('كورس مفقود:', s.code);
      process.exitCode = 1;
      break;
    }
    await prisma.scheduleSlot.create({
      data: {
        group: 'B',
        day: s.day,
        period: s.period,
        term: 'T1',
        courseId,
        kind: s.kind,
        room: s.room,
        isVip: !!s.vip,
        teacherName: s.teacher,
      },
    });
  }

  if (process.exitCode !== 1) {
    // 2) ساعات المقررات الرسمية (3 ساعات لكل مقرر = 21 ساعة)
    for (const code of OFFICIAL_CODES) {
      await prisma.course.update({ where: { code }, data: { creditHours: 3 } });
    }

    // 3) إعداد فتح الترم التاني = 2 فبراير 2027
    await prisma.appSetting.upsert({
      where: { key: 'secondTermStart' },
      update: { value: '2027-02-02' },
      create: { key: 'secondTermStart', value: '2027-02-02' },
    });

    // 4) طالب الديمو: المواد الرسمية فقط + الفرقة/الجروب/القسم
    const student = await prisma.user.findUnique({
      where: { email: 'student@raqib.edu' },
      select: { id: true },
    });
    if (student) {
      await prisma.enrollment.deleteMany({
        where: { studentId: student.id, courseId: { notIn: officialIds } },
      });
      await prisma.grade.deleteMany({
        where: { studentId: student.id, courseId: { notIn: officialIds } },
      });
      await prisma.attendance.deleteMany({
        where: { studentId: student.id, lecture: { courseId: { notIn: officialIds } } },
      });
      await prisma.user.update({
        where: { id: student.id },
        data: { department: 'رياضيات وعلوم الحاسب', group: 'B', level: '2' },
      });

      // 5) درجات واقعية في مقياس 100 (كويز 20 + أعمال 20 + ميدترم 30 + فاينل 30)
      // فاينل فاضي لسه ما دخلتش — المنطقة الصفراء/الحمراء للعرض التوضيحي
      const demo = [
        { code: 'MAT207', quiz: 18, work: 17, midterm: 26, final: null }, // 61 صفراء
        { code: 'COM201', quiz: 16, work: 19, midterm: 24, final: null }, // 59 حمراء
        { code: 'MAT201', quiz: 15, work: 12, midterm: 22, final: null }, // 49 حمراء
        { code: 'MAT203', quiz: 19, work: 16, midterm: 28, final: null }, // 63 صفراء
        { code: 'MAT213', quiz: 10, work: 9, midterm: 14, final: null }, // 33 حمراء
        { code: 'MAT305', quiz: 13, work: 14, midterm: 19, final: null }, // 46 حمراء
        { code: 'MAT211', quiz: 17, work: 18, midterm: 25, final: null }, // 60 صفراء
      ];
      for (const g of demo) {
        const courseId = byCode.get(g.code);
        if (!courseId) continue;
        await prisma.grade.upsert({
          where: { studentId_courseId: { studentId: student.id, courseId } },
          update: { quiz: g.quiz, work: g.work, midterm: g.midterm, final: g.final },
          create: {
            studentId: student.id,
            courseId,
            quiz: g.quiz,
            work: g.work,
            midterm: g.midterm,
            final: g.final,
          },
        });
      }

      // 6) لقطات معدل سابقة لمنحنى التطور (previousGpa يبقى فاضي كي تستعرض نافذة الإدخال)
      await prisma.gpaSnapshot.deleteMany({ where: { studentId: student.id } });
      await prisma.gpaSnapshot.createMany({
        data: [
          { studentId: student.id, term: '2024-T2', gpa: 2.55, credits: 21 },
          { studentId: student.id, term: '2025-T1', gpa: 2.8, credits: 21 },
          { studentId: student.id, term: '2025-T2', gpa: 3.05, credits: 22 },
        ],
      });
    }

    console.log(
      `OFFICIAL SCHEDULE SEEDED: slots=${OFFICIAL_SLOTS.length} courses=${OFFICIAL_CODES.length} · secondTermStart=2027-02-02`,
    );
  }
} catch (error) {
  console.error('SEED FAILED:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
