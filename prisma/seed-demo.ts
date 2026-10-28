/**
 * 🌱 بيانات العرض التجريبي — رقيب RAQiB
 * -----------------------------------------------------------------------------
 * تولّد بيئة ديمو كاملة وواقعية: 180 طالبًا، دكاترة، 12 مادة، تسجيلات كاملة،
 * جدول أسبوعي لـ3 جروبات، 14 أسبوع محاضرات، حضور 78–92%، تاسكات + تسليمات +
 * درجات، ملفات مقررات فعلية، اقتباسات، و3 محاضرات "اليوم" مفتوحة بـ QR صالح.
 *
 * الاستخدام:
 *   npm run seed:demo            → إنشاء/تحديث البيانات (idempotent)
 *   npm run seed:demo -- --fresh → مسح كل بيانات الديمو ثم التوليد كاملة
 *   npm run seed:reset           → مسح بيانات الديمو فقط
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

/* ── مولّد شبه عشوائي ثابت النتيجة — نفس الديمو في كل تشغيل ── */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260202);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

const DEMO = { STUDENTS: 180, WEEKS: 14, PAST_WEEKS: 10, TASKS: 40, RESOURCES: 25 };
const STUDENT_PASSWORD = 'Student@123';

/* ── أسماء عربية واقعية ── */
const MALE_NAMES = ['محمود', 'أحمد', 'كريم', 'مصطفى', 'عمر', 'يوسف', 'زياد', 'بلال', 'عبد الرحمن', 'حسن', 'طارق', 'شريف', 'إسلام', 'عمرو', 'هاني', 'مروان', 'أنس', 'طه', 'سيف', 'أسامة', 'خالد', 'باسم', 'عبد الله', 'إبراهيم', 'مصعب', 'رامي'] as const;
const FEMALE_NAMES = ['سلمى', 'ياسمين', 'نانسي', 'حبيبة', 'نورهان', 'مريم', 'فاطمة', 'عائشة', 'هند', 'دينا', 'تالين', 'سارة', 'إيمان', 'آية', 'ريهام', 'شهد', 'ملك', 'مي', 'دعاء', 'أمنية', 'جنى', 'روان'] as const;
const FAMILY_NAMES = ['الغريب', 'رمضان', 'السيد', 'عبد العال', 'الفار', 'المصري', 'عوض', 'رياض', 'شعبان', 'بركات', 'منصور', 'سليمان', 'فتحي', 'الحلواني', 'زيدان', 'حجازي', 'دياب', 'الشجاعي', 'الحديدي', 'الإبراشي', 'طه', 'قنديل', 'معوض', 'الغزالي'] as const;

const EXTRA_PROFESSORS = [
  { email: 'bomani@raqib.edu', name: 'أ.م.د أحمد بومني' },
  { email: 'fatma@raqib.edu', name: 'م.م فاطمة الزهراء' },
];
const EXTRA_COURSES = [
  { code: 'MAT301', name: 'التحليل الحقيقي (1)', nameEn: 'REAL ANALYSIS (1)' },
  { code: 'MAT208', name: 'الجبر والاحتمالات', nameEn: 'ALGEBRA & PROBABILITY' },
  { code: 'STAT201', name: 'الإحصاء الرياضي', nameEn: 'MATHEMATICAL STATISTICS' },
];

const QUOTE_BATCH = [
  { kind: 'PROVERB', text: 'اللي يذاكر في الهدوء، النجاح لصوته', source: 'دعابة طلابية' },
  { kind: 'PROVERB', text: 'العزم بيكسب دايمًا والعلم نور', source: 'شعار الكلية' },
  { kind: 'PROVERB', text: 'المذاكرة ما لها نوّم بس لها نتيجة', source: 'مثل وسطيّة' },
  { kind: 'PROVERB', text: 'وقت المراجعة ما يهربش المُذاكر', source: 'مثل مصري' },
];

const SECTIONS = ['قاعة 1', 'قاعة 2', 'قاعة 3', 'معمل الحاسب'] as const;

const UPLOADS = {
  resources: path.join(process.cwd(), 'public', 'uploads', 'resources'),
  tasks: path.join(process.cwd(), 'public', 'uploads', 'tasks'),
};

/** PDF فعلي (صفحة واحدة) لملفات الديمو */
function writeDemoPdf(target: string, title: string) {
  const safeTitle = title.replace(/[()\\<>]/g, ' ');
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 130 >> stream
BT /F1 22 Tf 60 780 Td (RAQiB - Demo File) Tj 0 -40 Td (${safeTitle}) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
trailer << /Root 1 0 R >>`;
  fs.writeFileSync(target, content, 'latin1');
}

/* ══════════════════════════ المرحلة 1: المسح ══════════════════════════ */

async function backupDb() {
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  try {
    const backup = dbPath.replace(/\.db$/, '.backup-demo.db');
    fs.copyFileSync(dbPath, backup);
    console.log(`💾 نسخة احتياطية: ${backup}`);
  } catch { /* الملف قد يكون مقفولًا — نكمل */ }
}

/** حذف كل بيانات الديمو + حسابات الاختبار الملوثة */
export async function resetDemoData() {
  await backupDb();

  const polluted = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      OR: [
        { email: { startsWith: 'e2e.' } },
        { email: { startsWith: 'ui.' } },
        { email: { startsWith: 'reset.test.' } },
        { email: { contains: 'gmail.com' } },
        { email: { contains: 'hotmail' } },
        { email: { contains: 'yahoo' } },
      ],
    },
    select: { id: true },
  });

  const demoStudents = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      AND: [
        { email: { startsWith: 's20' } },
        { email: { endsWith: '@raqib.edu' } },
        { email: { not: 'student@raqib.edu' } },
      ],
    },
    select: { id: true },
  });

  const doomedIds = Array.from(new Set([...polluted, ...demoStudents].map((u) => u.id)));
  console.log(`🧹 حذف ${doomedIds.length} طالب ديمو/اختبار…`);

  // الترتيب يحكم قيود FK
  await prisma.taskSubmission.deleteMany({ where: { studentId: { in: doomedIds } } });
  await prisma.attendance.deleteMany({ where: { studentId: { in: doomedIds } } });
  await prisma.enrollment.deleteMany({ where: { studentId: { in: doomedIds } } });
  await prisma.grade.deleteMany({ where: { studentId: { in: doomedIds } } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: { in: doomedIds } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: doomedIds } } });
  await prisma.user.deleteMany({ where: { id: { in: doomedIds } } });

  // محتوى الديمو كامًلو
  await prisma.taskSubmission.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.lecture.deleteMany({});
  await prisma.grade.deleteMany({});

  // ملفات الديمو من القرص
  for (const dir of [UPLOADS.resources, UPLOADS.tasks]) {
    try {
      for (const f of fs.readdirSync(dir)) {
        if (f.startsWith('demo-')) fs.unlinkSync(path.join(dir, f));
      }
    } catch { /* المجلد غير موجود */ }
  }

  await prisma.appSetting.deleteMany({
    where: { key: { in: ['demoSeededAt', 'demoMode'] } },
  });

  console.log('✅ المسح تمَّ');
}

/* ══════════════════════════ المرحلة 2: الأساس ══════════════════════════ */

async function ensureProfessors() {
  const emails = [
    'nogey@raqib.edu', 'samah@raqib.edu', 'bahya@raqib.edu', 'smar@raqib.edu',
    'gamilia@raqib.edu', 'ihab@raqib.edu', 'rezk@raqib.edu', 'imam@raqib.edu',
    'asmaa@raqib.edu', 'ramadan@raqib.edu', 'yasmin@raqib.edu',
  ];
  const profHash = await bcrypt.hash('Prof@123', 12);
  const ids: string[] = [];
  for (const email of emails) {
    const u = await prisma.user.upsert({
      where: { email },
      update: { role: 'PROFESSOR' },
      create: { email, name: `د. ${email.split('@')[0]}`, role: 'PROFESSOR', passwordHash: profHash },
    });
    ids.push(u.id);
  }
  for (const p of EXTRA_PROFESSORS) {
    const u = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name, role: 'PROFESSOR' },
      create: { email: p.email, name: p.name, role: 'PROFESSOR', passwordHash: profHash },
    });
    ids.push(u.id);
  }
  return ids;
}

async function ensureCourses(profIds: string[]) {
  const existing = await prisma.course.findMany({ select: { id: true, code: true, name: true, professorId: true } });
  const result = [...existing];
  const seen = new Set(existing.map((c) => c.code));
  let pi = 0;
  for (const c of EXTRA_COURSES) {
    if (seen.has(c.code)) continue;
    const created = await prisma.course.upsert({
      where: { code: c.code },
      update: { englishName: c.nameEn },
      create: { code: c.code, name: c.name, englishName: c.nameEn, professorId: profIds[pi++ % profIds.length]! },
    });
    result.push(created);
    seen.add(c.code);
  }
  // مادة بأسماء عربية إن لم تكن موجودة — تحسين
  for (const c of result) if (!c.name) await prisma.course.update({ where: { id: c.id }, data: { name: c.code } });
  console.log(`📚 المواد: ${result.length}`);
  return result;
}

/* ══════════════════════════ المرحلة 3: الطلاب والتسجيلات ══════════════════════════ */

async function seedStudents() {
  const password = await bcrypt.hash(STUDENT_PASSWORD, 12);
  const seenCodes = new Set<string>();
  const seenNIds = new Set<string>();
  const rows: {
    email: string; name: string; role: string; studentCode: string; group: string;
    level: string; nationalId: string | null; gender: string; birthDate: Date;
    passwordHash: string; phone: string;
  }[] = [];

  for (let i = 0; i < DEMO.STUDENTS; i++) {
    const code = String(2024050 + i); // نتبدأ من 2024050 لتجنب تعارض 2024001 (الطالب المركزي)
    const email = `s${code}@raqib.edu`;
    const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
    const first = gender === 'MALE' ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
    const name = `${first} ${pick(FAMILY_NAMES)}`;
    const group = ['A', 'B', 'C'][i % 3]!;
    const level = String(1 + (i % 4));
    // رقم قومي فريد شكلًا (14 رقم): قرن(3) + سنة + شهر + يوم + تابع
    let nationalId: string | null = null;
    for (let tries = 0; tries < 10; tries++) {
      const yyyy = intBetween(2002, 2006);
      const month = String(intBetween(1, 12)).padStart(2, '0');
      const day = String(intBetween(1, 28)).padStart(2, '0');
      const candidate = `3${String(yyyy).slice(2)}${month}${day}${String(1000 + i % 1000).slice(-4)}${String(intBetween(1000, 9999))}`;
      if (!seenNIds.has(candidate)) { nationalId = candidate; seenNIds.add(candidate); break; }
    }
    const birthDate = nationalId
      ? new Date(`${nationalId.startsWith('3') ? '20' : '19'}${nationalId.slice(1, 3)}-${nationalId.slice(3, 5)}-${nationalId.slice(5, 7)}T00:00:00Z`)
      : null;
    if (!seenCodes.has(code)) rows.push({
      email, name, role: 'STUDENT', studentCode: code, group, level,
      nationalId, gender, birthDate: birthDate ?? new Date('2003-01-01T00:00:00Z'),
      passwordHash: password, phone: `01${pick(['0', '1', '2', '5'])}${String(intBetween(10000000, 99999999))}`,
    });
    seenCodes.add(code);
  }

  let created = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const res = await prisma.user.createMany({ data: rows.slice(i, i + 50) });
    created += res.count;
  }
  console.log(`🎓 الطلاب الجدد: ${created}`);
}

async function seedEnrollments() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true },
  });
  const courses = await prisma.course.findMany({ select: { id: true } });
  const rows: { studentId: string; courseId: string }[] = [];
  for (const s of students) for (const c of courses) rows.push({ studentId: s.id, courseId: c.id });

  // إزالة تكرار (SQLite لا يدعم skipDuplicates) + استبعاد التسجيلات الموجودة سابًقًا
  const existingEnrollments = await prisma.enrollment.findMany({ select: { studentId: true, courseId: true } });
  const existingKeys = new Set(existingEnrollments.map((e) => `${e.studentId}|${e.courseId}`));
  const freshRows = rows.filter((r) => !existingKeys.has(`${r.studentId}|${r.courseId}`));
  let n = 0;
  for (let i = 0; i < freshRows.length; i += 500) {
    const res = await prisma.enrollment.createMany({ data: freshRows.slice(i, i + 500) });
    n += res.count;
  }
  console.log(`📝 التسجيلات: ${n}`);
}

/* ══════════════════════════ المرحلة 4: الجدول الأسبوعي ══════════════════════════ */

async function seedSlots(courses: { id: string }[]) {
  // الجروب B = الجدول الرسمي من الـ PDF (seed.ts) — الديمو العشوائي لـ A وC فقط
  const groups = ['A', 'C'];
  // سلوت محايد ورسمي لكل يوم — يضمن عدم تعارض group_day_period_term
  const slotPlan = [
    { day: 2, period: 2 }, { day: 2, period: 3 },
    { day: 3, period: 1 }, { day: 3, period: 2 },
    { day: 3, period: 3 }, { day: 3, period: 4 },
    { day: 4, period: 2 }, { day: 4, period: 3 },
    { day: 5, period: 1 }, { day: 5, period: 3 },
    { day: 5, period: 4 },
  ];
  let idx = 0;
  for (const group of groups) {
    for (const s of slotPlan) {
      const courseId = courses[idx % courses.length]!.id;
      const kind = idx % 4 === 3 ? 'SECTION' : 'LECTURE';
      const room = idx % 4 === 3 ? 'قاعة 2' : pick(SECTIONS);
      await prisma.scheduleSlot.upsert({
        where: { group_day_period_term: { group, day: s.day, period: s.period, term: 'T1' } },
        update: { courseId, kind, room },
        create: { group, day: s.day, period: s.period, term: 'T1', courseId, kind, room, isVip: idx % 9 === 8 },
      });
      idx++;
    }
  }
  console.log('🗓️ الجدول الأسبوعي (A/C — B رسمي): ✓');
}

/* ══════════════════════════ المرحلة 5: المحاضرات والحضور ══════════════════════════ */

async function seedLecturesAndAttendance(courses: { id: string; name: string; professorId: string }[]) {
  const termStart = Date.now() - 12 * 7 * 24 * 60 * 60 * 1000;

  // Idempotency: حذف محاضرات الديمو القديمة (Attendance Cascade)
  await prisma.lecture.deleteMany({ where: { title: { startsWith: 'محاضرة الأسبوع' } } });

  let created = 0;
  for (let w = 1; w <= DEMO.WEEKS; w++) {
    const base = new Date(termStart + (w - 1) * 7 * 24 * 60 * 60 * 1000);
    for (let i = 0; i < courses.length; i++) {
      const c = courses[i]!;
      const dayOffset = (i % 5); // توزيع لطيف على أيام الأسبوع 0..4
      const starts = new Date(base.getTime());
      starts.setUTCDate(starts.getUTCDate() + dayOffset);
      starts.setUTCHours(9 + (i % 4) * 2, 30, 0, 0);
      const res = await prisma.lecture.createMany({
        data: {
          courseId: c.id, professorId: c.professorId,
          title: `محاضرة الأسبوع ${w} — ${c.name}`,
          location: SECTIONS[i % SECTIONS.length]!,
          startsAt: starts,
          isOpen: false,
        },
      });
      created += res.count;
    }
  }

  const lectures = await prisma.lecture.findMany({
    where: { title: { startsWith: 'محاضرة الأسبوع' } },
    select: { id: true, courseId: true, startsAt: true },
    orderBy: { startsAt: 'asc' },
  });
  const past = lectures.filter((l) => l.startsAt.getTime() < Date.now());
  console.log(`📖 المحاضرات: ${created} (${past.length} ماضية)`);

  /* ── الحضور 78–92% من كل طالب في كل مادة — الغياب = لا سجل ── */
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true } });
  const byCourse = new Map<string, { id: string; startsAt: Date }[]>();
  for (const l of past) {
    const arr = byCourse.get(l.courseId) ?? [];
    arr.push({ id: l.id, startsAt: l.startsAt });
    byCourse.set(l.courseId, arr);
  }

  const attendanceRows: { lectureId: string; studentId: string; status: string; scannedAt: Date }[] = [];
  for (const s of students) {
    for (const [cid, cls] of byCourse) {
      const rate = between(0.78, 0.92);
      for (const l of cls) {
        if (rand() >= rate) continue; // غائب — لا سجل
        const status = rand() < 0.12 ? 'LATE' : 'PRESENT';
        attendanceRows.push({
          lectureId: l.id, studentId: s.id, status,
          scannedAt: new Date(l.startsAt.getTime() + (status === 'LATE' ? between(20, 45) : between(0, 10)) * 60 * 1000),
        });
      }
    }
  }

  let att = 0;
  for (let i = 0; i < attendanceRows.length; i += 800) {
    const res = await prisma.attendance.createMany({ data: attendanceRows.slice(i, i + 800) });
    att += res.count;
  }
  console.log(`✋ سجلات الحضور: ${att}`);
}

/* ══════════════════════════ المرحلة 6: تاسكات/تسليمات/درجات ══════════════════════════ */

async function seedTasksAndGrades(courses: { id: string; professorId: string }[]) {
  const taskTypes = [
    { suffix: 'ورقة شغل أسبوعية', kind: 'WEEKLY' },
    { suffix: 'واجب تمارين', kind: 'WEEKLY' },
    { suffix: 'بحث شهري', kind: 'MONTHLY' },
    { suffix: 'مشروع تطبيق', kind: 'MONTHLY' },
  ];
  const titles = ['التكاملات المتعاقبة', 'بناء القوائم المرتبطة', 'تحليل التعقيد', 'تطبيق الأشجار الثنائية', 'المعادلات التفاضلية الخطية', 'قراءة ورقة بحثية', 'نماذج الاحتمالات', 'تفاضل الأسس', 'تمثيل الرسوم البيانية', 'الدوال المميزة'];

  await prisma.taskSubmission.deleteMany({});
  await prisma.task.deleteMany({});

  const tasksData = [];
  for (let i = 0; i < DEMO.TASKS; i++) {
    const c = courses[i % courses.length]!;
    const type = taskTypes[i % taskTypes.length]!;
    const isPast = rand() > 0.45;
    const daysOffset = isPast ? -intBetween(4, 50) : intBetween(1, 30);
    tasksData.push({
      title: `${titles[i % titles.length]!} — ${type.suffix}`,
      description: `شرح المطلوب: ${titles[i % titles.length]!}.\n\nسلّم الحل بتنسيق واضح قبل الموعد النهائي.`,
      kind: type.kind,
      deadline: new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000),
      requiresFile: rand() > 0.4,
      status: isPast ? 'CLOSED' : 'OPEN',
      courseId: c.id,
      createdById: c.professorId,
    });
  }
  await prisma.task.createMany({ data: tasksData });
  const tasks = await prisma.task.findMany({ select: { id: true, courseId: true, status: true, requiresFile: true, deadline: true } });
  console.log(`📋 التاسكات: ${tasks.length}`);

  // ملف تسليم ديمو حقيقي واحد
  await ensureDirTasks();
  const demoFileName = `demo-submission-${randomUUID()}.pdf`;
  writeDemoPdf(path.join(UPLOADS.tasks, demoFileName), 'Demo Submission');

  const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true } });
  const enrolled = await prisma.enrollment.findMany({ select: { studentId: true, courseId: true } });
  const allowedByCourse = new Map<string, Set<string>>();
  for (const e of enrolled) {
    if (!allowedByCourse.has(e.courseId)) allowedByCourse.set(e.courseId, new Set());
    allowedByCourse.get(e.courseId)!.add(e.studentId);
  }

  const feedbacks = ['حل ممتاز — شرح واضح', 'جيد جدًا — راجع الخطوة 3', 'أصبت الدرجة — استمر', 'حل معقول — التزم بالتنسيق', 'شكرًا لإتمام المهمة'];
  const submissions: { taskId: string; studentId: string; fileUrl: string | null; submittedAt: Date; score: number; feedback: string }[] = [];
  for (const t of tasks) {
    if (t.status !== 'CLOSED') continue;
    const allowed = allowedByCourse.get(t.courseId);
    if (!allowed) continue;
    for (const sid of allowed) {
      if (rand() > 0.87) continue;
      submissions.push({
        taskId: t.id, studentId: sid,
        fileUrl: t.requiresFile ? `/uploads/tasks/${demoFileName}` : null,
        submittedAt: new Date(t.deadline.getTime() - intBetween(0, 7 * 24) * 60 * 60 * 1000),
        score: Math.round(between(30, 59.5) * 10) / 10,
        feedback: pick(feedbacks),
      });
    }
  }
  let sc = 0;
  for (let i = 0; i < submissions.length; i += 500) {
    const res = await prisma.taskSubmission.createMany({ data: submissions.slice(i, i + 500) });
    sc += res.count;
  }
  console.log(`📤 التسليمات: ${sc}`);

  /* ── الدرجات على المقياس الموحّد (كويز 20 + أعمال 20 + ميدترم 30 + فاينل 30 = 100) ── */
  const gradeRows = [];
  for (const s of students) for (const c of courses) {
    gradeRows.push({
      studentId: s.id, courseId: c.id,
      quiz: intBetween(12, 20), work: intBetween(12, 20), midterm: intBetween(15, 30), final: null,
    });
  }
  let g = 0;
  for (let i = 0; i < gradeRows.length; i += 500) {
    const res = await prisma.grade.createMany({ data: gradeRows.slice(i, i + 500) });
    g += res.count;
  }
  console.log(`🎯 الدرجات: ${g}`);
}

function ensureDirTasks() { fs.mkdirSync(UPLOADS.tasks, { recursive: true }); }

/* ══════════════════════════ المرحلة 7: ملفات/اقتباسات/إعدادات ══════════════════════════ */

async function seedResourcesQuotesSettings(courses: { id: string; code: string; name: string }[]) {
  fs.mkdirSync(UPLOADS.resources, { recursive: true });

  const resNames = ['الشرح المحاضرة الأولى.pdf', 'مراجعة نهائية.pdf', 'تمارين محلولة.pdf', 'الشابتر الأول.pdf', 'ملازم الدكتور.pdf', 'امتحان من سنة سابقة.pdf', 'ملخص الوحدة.pdf'];
  for (let i = 0; i < DEMO.RESOURCES; i++) {
    const c = courses[i % courses.length]!;
    const stored = `demo-${randomUUID()}.pdf`;
    writeDemoPdf(path.join(UPLOADS.resources, stored), c.name);
    await prisma.resource.create({
      data: {
        originalName: `${c.code}-${resNames[i % resNames.length]}`,
        storedName: stored,
        mimeType: 'application/pdf',
        size: fs.statSync(path.join(UPLOADS.resources, stored)).size,
        courseId: c.id, kind: 'PDF',
      },
    });
  }
  console.log(`📁 الملفات: ${DEMO.RESOURCES}`);

  for (const q of QUOTE_BATCH) {
    const exists = await prisma.quote.findFirst({ where: { text: q.text } });
    if (!exists) await prisma.quote.create({ data: q });
  }

  const settings: [string, string][] = [
    ['secondTermStart', '2026-02-02'],
    ['firstTermEnd', '2026-01-22'],
    ['attendanceThreshold', '75'],
    ['maxAbsence', '25'],
    ['lateCountsAs', '0.5'],
    ['demoMode', '1'],
  ];
  for (const [key, value] of settings) {
    await prisma.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log('⚙️ الإعدادات + سياسة الحضور: ✓');
}

/* ══════════════════════════ المرحلة 8: محاضرات اليوم المفتوحة ══════════════════════════ */

function tokenFor(seedRng: () => number) {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 32; i++) s += chars[Math.floor(seedRng() * 16)];
  return s;
}

async function seedTodayLectures(courses: { id: string; code: string; professorId: string }[]) {
  const now = Date.now();
  // حذف «عرض حي» القديمة (Attendance Cascade) — ثم توليد 3 محاضرات حرة
  await prisma.lecture.deleteMany({ where: { title: { startsWith: 'عرض حي —' } } });

  const live = [];
  for (let i = 0; i < 3; i++) {
    const c = courses[i % courses.length]!;
    live.push({
      courseId: c.id, professorId: c.professorId,
      title: `عرض حي — ${c.code} (${['A', 'B', 'C'][i]})`,
      location: `قاعة ${i + 1}`,
      startsAt: new Date(now - 25 * 60 * 1000 + i * 20 * 60 * 1000),
      qrToken: tokenFor(rand),
      qrExpiresAt: new Date(now + 45 * 60 * 1000),
      isOpen: true,
    });
  }
  await prisma.lecture.createMany({ data: live });
  const lectures = await prisma.lecture.findMany({ where: { title: { startsWith: 'عرض حي —' } }, select: { id: true } });

  // مسحات حية (60–150) لكل محاضرة لعرض الأرقام لحظيًا في اللوحة
  const students = (await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true }, take: 180 })).map((s) => s.id);
  const liveRows = [];
  for (const l of lectures) {
    const attendees = intBetween(60, Math.min(150, students.length));
    for (const sid of students.slice(0, attendees)) {
      liveRows.push({
        lectureId: l.id, studentId: sid,
        status: rand() < 0.1 ? 'LATE' : 'PRESENT',
        scannedAt: new Date(now - intBetween(1, 25) * 60 * 1000),
      });
    }
  }
  let n = 0;
  for (let i = 0; i < liveRows.length; i += 800) {
    const res = await prisma.attendance.createMany({ data: liveRows.slice(i, i + 800) });
    n += res.count;
  }
  console.log(`🔴 محاضرات اليوم المفتوحة: ${lectures.length} — مسحات مباشرة: ${n}`);
}

/* ══════════════════════════ التشغيل ══════════════════════════════ */

const isFresh = process.argv.includes('--fresh');
const isResetOnly = process.argv.includes('--reset-only');

async function main() {
  const started = Date.now();
  if (isResetOnly) {
    await resetDemoData();
    return;
  }
  if (isFresh) await resetDemoData();

  const profIds = await ensureProfessors();
  const courses = await ensureCourses(profIds);

  // الحسابات الأساسية (أدمن/دكتور/طالب تجريبي)
  const profHash = await bcrypt.hash('Prof@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@raqib.edu' },
    update: {},
    create: { email: 'admin@raqib.edu', name: 'مدير المنصة', role: 'ADMIN', passwordHash: await bcrypt.hash('Admin@123', 12) },
  });
  await prisma.user.upsert({
    where: { email: 'professor@raqib.edu' },
    update: {},
    create: { email: 'professor@raqib.edu', name: 'د. أحمد حسن', role: 'PROFESSOR', passwordHash: profHash },
  });
  const studentHash = await bcrypt.hash(STUDENT_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: 'student@raqib.edu' },
    update: { role: 'STUDENT', group: 'B', level: '2', studentCode: '2024001' },
    create: {
      email: 'student@raqib.edu', name: 'محمود علي', role: 'STUDENT',
      studentCode: '2024001', group: 'B', level: '2',
      nationalId: '30201011234567', birthDate: new Date('2002-03-01T00:00:00Z'), gender: 'MALE',
      passwordHash: studentHash,
    },
  });

  await seedStudents();
  await seedEnrollments();
  await seedSlots(courses);
  await seedLecturesAndAttendance(courses);
  await seedTasksAndGrades(courses);
  await seedResourcesQuotesSettings(courses);
  await seedTodayLectures(courses);

  await prisma.appSetting.upsert({
    where: { key: 'demoSeededAt' },
    update: { value: new Date().toISOString() },
    create: { key: 'demoSeededAt', value: new Date().toISOString() },
  });

  const [students, lectures, attendances, tasks, grades, resources] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.lecture.count(),
    prisma.attendance.count(),
    prisma.task.count(),
    prisma.grade.count(),
    prisma.resource.count(),
  ]);
  console.log('\n═══ ملخص الديمو ═══');
  console.log({ students, lectures, attendance: attendances, tasks, grades, resources });
  console.log(`⏱️ الوقت: ${((Date.now() - started) / 1000).toFixed(1)} ثانية`);
}

main()
  .catch((e) => {
    console.error('❌ فشل الديمو:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
