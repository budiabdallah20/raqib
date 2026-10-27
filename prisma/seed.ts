import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = {
    admin: await bcrypt.hash('Admin@123', 12),
    professor: await bcrypt.hash('Prof@123', 12),
    student: await bcrypt.hash('Student@123', 12),
  };

  const admin = await prisma.user.upsert({
    where: { email: 'admin@raqib.edu' },
    update: {},
    create: {
      email: 'admin@raqib.edu',
      name: 'مدير المنصة',
      role: 'ADMIN',
      passwordHash: password.admin,
    },
  });

  const professor = await prisma.user.upsert({
    where: { email: 'professor@raqib.edu' },
    update: {},
    create: {
      email: 'professor@raqib.edu',
      name: 'د. أحمد حسن',
      role: 'PROFESSOR',
      passwordHash: password.professor,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@raqib.edu' },
    update: {},
    create: {
      email: 'student@raqib.edu',
      name: 'محمود علي',
      role: 'STUDENT',
      studentCode: '2024001',
      passwordHash: password.student,
    },
  });

  const ds = await prisma.course.upsert({
    where: { code: 'CS201' },
    update: {},
    create: {
      code: 'CS201',
      name: 'هياكل البيانات',
      professorId: professor.id,
    },
  });

  const oop = await prisma.course.upsert({
    where: { code: 'CS202' },
    update: {},
    create: {
      code: 'CS202',
      name: 'البرمجة كائنية التوجه',
      professorId: professor.id,
    },
  });

  // ─────────────────────────────────────────────────────────
  // دكاترة ومدرسو المستوى الثاني — من جدول.Group B الرسمي
  // ─────────────────────────────────────────────────────────
  const staff = [
    { email: 'nogey@raqib.edu',   name: 'د. نوجي محمد',     pass: 'Prof@123' },
    { email: 'samah@raqib.edu',   name: 'د. سماح أحمد',     pass: 'Prof@123' },
    { email: 'bahya@raqib.edu',   name: 'د. بهة الله فتحي', pass: 'Prof@123' },
    { email: 'smar@raqib.edu',    name: 'د. سمر محمد',      pass: 'Prof@123' },
    { email: 'gamilia@raqib.edu', name: 'م.م جميلة السيد',  pass: 'Prof@123' },
    { email: 'ihab@raqib.edu',    name: 'د. إيهاب راشد',    pass: 'Prof@123' },
    { email: 'rezk@raqib.edu',    name: 'م. أحمد رزق',      pass: 'Prof@123' },
    { email: 'imam@raqib.edu',    name: 'أ.م.د طارق إمام',  pass: 'Prof@123' },
    { email: 'asmaa@raqib.edu',   name: 'م.م أسماء عبد العال', pass: 'Prof@123' },
    { email: 'ramadan@raqib.edu', name: 'أ.م.د محمد رمضان',  pass: 'Prof@123' },
    { email: 'yasmin@raqib.edu',  name: 'م.م ياسمين',        pass: 'Prof@123' },
  ];

  const pro = new Map<string, string>(); // name → id
  for (const p of staff) {
    const u = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name },
      create: {
        email: p.email,
        name: p.name,
        role: 'PROFESSOR',
        passwordHash: await bcrypt.hash(p.pass, 12),
      },
    });
    pro.set(p.name, u.id);
  }

  // ─────────────────────────────────────────────────────────
  // مواد المستوى الثاني (7 مواد — من جدول.Group B)
  // ─────────────────────────────────────────────────────────
  const courses: Record<string, string> = {};
  const defs = [
    { code: 'MAT201', name: 'معادلات تفاضلية عادية',  nameEn: 'ORDINARY DIFFERENTIAL EQUATIONS', prof: 'د. بهة الله فتحي' },
    { code: 'MAT203', name: 'ميكانيكا',               nameEn: 'MECHANICS',                       prof: 'د. سمر محمد' },
    { code: 'MAT207', name: 'هندسة تحليلية',          nameEn: 'ANALYTICAL GEOMETRY',             prof: 'د. نوجي محمد' },
    { code: 'MAT211', name: 'نظرية الخرائط',          nameEn: 'MAPPING THEORY & TOPOLOGY',       prof: 'أ.م.د محمد رمضان' },
    { code: 'MAT213', name: 'المنطق الرياضي',         nameEn: 'MATHEMATICAL LOGIC',              prof: 'د. إيهاب راشد' },
    { code: 'MAT305', name: 'تحليل عددي (1)',         nameEn: 'NUMERICAL ANALYSIS (1)',          prof: 'أ.م.د طارق إمام' },
    { code: 'COM201', name: 'تحليل وتصميم نظم',       nameEn: 'SYSTEMS ANALYSIS & DESIGN',       prof: 'د. سماح أحمد' },
  ];
  for (const c of defs) {
    const r = await prisma.course.upsert({
      where: { code: c.code },
      update: { englishName: c.nameEn, professorId: pro.get(c.prof)! },
      create: { code: c.code, name: c.name, englishName: c.nameEn, professorId: pro.get(c.prof)! },
    });
    courses[c.code] = r.id;
    if (c.code !== 'CS201' && c.code !== 'CS202') {
      await prisma.enrollment.upsert({
        where: {
          studentId_courseId: { studentId: student.id, courseId: r.id },
        },
        update: {},
        create: { studentId: student.id, courseId: r.id },
      });
    }
  }

  // جروب الطالب التجريبي = B والفرقة = 2
  await prisma.user.update({
    where: { id: student.id },
    data: { group: 'B', level: '2', nationalId: '30201011234567', birthDate: new Date('2002-03-01T00:00:00Z') },
  });

  // ─────────────────────────────────────────────────────────
  // جدول.Group B الأسبوعي — مستنسخ حرفيًا من الـ PDF الرسمي
  // day: 2=اثنين 3=ثلاثاء 4=أربعاء 5=خميس | period: 1..4
  // ─────────────────────────────────────────────────────────
  const slots: { day: number; period: number; code: string; kind: string; room: string; vip?: boolean; teacher: string }[] = [
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
    { day: 5, period: 4, code: 'COM201', kind: 'LAB',     room: 'معمل الحاسب', teacher: 'م.م ياسمين' },
  ];
  for (const s of slots) {
    await prisma.scheduleSlot.upsert({
      where: { group_day_period_term: { group: 'B', day: s.day, period: s.period, term: 'T1' } },
      update: { courseId: courses[s.code], kind: s.kind, room: s.room, isVip: !!s.vip, teacherName: s.teacher },
      create: {
        group: 'B',
        day: s.day,
        period: s.period,
        term: 'T1',
        courseId: courses[s.code],
        kind: s.kind,
        room: s.room,
        isVip: !!s.vip,
        teacherName: s.teacher,
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // آيات + مثل مصري — بتدور كل دقيقة في داشبورد الطالب
  // ─────────────────────────────────────────────────────────
  const quotes = [
    { kind: 'QURAN',   text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',              source: 'سورة طه · ١١٤' },
    { kind: 'QURAN',   text: 'إِنَّ اللَّهَ مَعَ الَّذِينَ اتَّقَوا وَّالَّذِينَ هُم مُّحْسِنُونَ', source: 'سورة النحل · ١٢٨' },
    { kind: 'QURAN',   text: 'وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ',  source: 'سورة النجم · ٣٩' },
    { kind: 'QURAN',   text: 'إِن مَّعَ الْعُسْرِ يُسْرًا',               source: 'سورة الشرح · ٦' },
    { kind: 'QURAN',   text: 'وَتَوَكَّلْ عَلَى اللَّهِ وَكَفَى بِاللَّهِ وَكِيلًا', source: 'سورة الأحقاف · ٣' },
    { kind: 'PROVERB', text: 'العلم نور يضيء درب صاحبه',                 source: 'مثل' },
    { kind: 'PROVERB', text: 'اللي يقرأ ده سنة للي متحفظش',              source: 'مثل مصري' },
    { kind: 'PROVERB', text: 'يا صافي، يا حلو، جد وعلى الله توكل',       source: 'مثل مصري' },
    { kind: 'PROVERB', text: 'الشقلبة دي أفضلَ من كلمة سبع شقلبة',       source: 'مثل مصري' },
    { kind: 'PROVERB', text: 'وقت السرقة ما يهربش التاجر',               source: 'مثل مصري' },
  ];
  for (const q of quotes) {
    const exists = await prisma.quote.findFirst({ where: { text: q.text } });
    if (!exists) await prisma.quote.create({ data: q });
  }

  // إعدادات افتراضية
  const settings: [string, string][] = [
    ['secondTermStart', '2027-02-02'],
    ['firstTermEnd', '2026-01-22'],
  ];
  for (const [key, value] of settings) {
    await prisma.appSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log('Seeded:', { admin: admin.email, professor: professor.email, student: student.email, slots: slots.length });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
