'use client';

/**
 * ترجمة خفيفة للأجزاء العامة (Landing + Footer + Splash + رسالة الترحيب)
 * بنفس إحساس موقع بودي: زرار pill فيه علم + حرف اللغة، والحفظ في localStorage.
 * البوابات الداخلية (طالب/دكتور/أدمن) تبقى عربية رسمية زي ما هي.
 */

import * as React from 'react';

export type Lang = 'ar' | 'en';

export type Dict = {
  dir: 'rtl' | 'ltr';
  nav: { features: string; how: string; roles: string; stack: string; login: string; start: string; menu: string };
  hero: {
    welcome: string;
    badge: string;
    line1: string[];
    line2: string[];
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustSecure: string;
    trustNoApp: string;
    trustFast: string;
    exhibitTag: string;
  };
  mock: {
    board: string; area: string; live: string; pct: string; today: string;
    present: string; late: string; scan: string; signed: string; signedTime: string;
    joined: string;
    courseA: string; courseB: string; timeA: string; timeB: string; room: string;
    statusDone: string; statusNext: string;
  };
  stats: { sec: string; secUnit: string; secLabel: string; accuracy: string; always: string; arabic: string };
  metrics: { students: string; lectures: string; scans: string; attendance: string; demoBadge: string; computedNote: string; failNote: string; statusOnline: string; statusMaintenance: string; statusOffline: string; statusChecking: string };
  sections: {
    stackKicker: string; stack: string; stackGold: string; stackSub: string;
    everything: string; everythingGold: string; everythingSub: string;
    stepsKicker: string; steps: string; stepsGold: string;
    rolesKicker: string; roles: string; rolesGold: string; rolesSub: string;
    ctaTitle: string; ctaGold: string; ctaSub: string; ctaBtn: string; ctaBtn2: string;
  };
  features: { title: string; body: string }[];
  stepCards: { 1: { title: string; body: string }; 2: { title: string; body: string }; 3: { title: string; body: string } };
  roleCards: { student: { t: string; b: string; p: string[] }; professor: { t: string; b: string; p: string[] }; admin: { t: string; b: string; p: string[] } };
  roleEnter: string; accessLabel: string;
  footer: {
    tagline: string; secure: string;
    statement: string; statementBadge: string;
    sponsorTitle: string; sponsorFaculty: string; sponsorUni: string; sponsorBudi: string;
    platform: string; account: string; legal: string;
    navTitle: string; contactTitle: string; socialsTitle: string;
    status: string; stackNote: string;
    statusLive: string; kicker: string; ctaLine1: string; ctaLine2: string;
    linksPlatform: { label: string; href: string }[];
    linksAccount: { label: string; href: string }[];
    linksNav: { label: string; href: string }[];
    privacy: string; terms: string; rights: string;
    copyright: string; collage: string;
    devTitle: string; devName: string; devRole: string; devBio: string; devLoc: string;
    devLinks: { label: string; href: string }[];
    engineered: string; engineeredRole: string;
    quote: string; quoteRef: string;
    watermark: string;
    finalWords: string;
    connect: string;
    marquee: string[];
    previewNote: string;
  };
  guest: { hello: string; title: string; sub: string; primary: string; secondary: string; dismiss: string; madeWith: string };
  guestSteps: { 1: string; 2: string; 3: string };
};

/* ============================== العربية ============================== */

const AR: Dict = {
  dir: 'rtl',
  nav: { features: 'المزايا', how: 'كيف يعمل', roles: 'الأدوار', stack: 'التقنيات', login: 'دخول', start: 'ابدأ الآن', menu: 'القائمة' },
  hero: {
    welcome: 'رقيب ترحب بكم',
    badge: 'مساحة أكاديمية عربية للطالب وأستاذه',
    line1: ['المحاضرة', 'تبدأ،'],
    line2: ['والحضور', 'يسجّل', 'نفسه.'],
    sub: 'رقيب يدير حضور قاعاتك برموز QR لحظية وتقارير فورية — منصة عربية سريعة تحترم صلاحيات كل دور.',
    ctaPrimary: 'ابدأ رحلتك',
    ctaSecondary: 'استكشف المنصة',
    trustSecure: 'اتصال آمن HTTPS',
    trustNoApp: 'بدون تطبيق — من المتصفح',
    trustFast: 'وصول حسب الصلاحيات',
    exhibitTag: 'المعروض ٠١ / لوحة الحضور الحيّة',
  },
  mock: {
    board: 'لوحة الحضور', area: 'مقرر أكاديمي · محاضرة اليوم', live: 'مباشر', pct: 'نسبة الحضور',
    today: 'محاضرة اليوم', present: 'حاضر', late: 'متأخر',
    scan: 'مسح QR لتسجيل الحضور', signed: 'تم التحقق', signedTime: '12:04 PM',
    joined: 'طالب سجّلوا اليوم',
    courseA: 'MAT207 — هندسة تحليلية', courseB: 'MAT305 — تحليل عددي',
    timeA: '10:00 ص', timeB: '12:30 م', room: 'قاعة 1 · د. محمد نوجي',
    statusDone: 'حاضر', statusNext: 'قادم',
  },
  stats: { sec: '3', secUnit: 'ثوانٍ', secLabel: 'لتسجيل الحضور', accuracy: 'دقة التحقق', always: 'متاحة دائمًا', arabic: 'واجهة عربية' },
  metrics: {
    students: 'طالب على المنصة', lectures: 'محاضرة مُسجَّلة', scans: 'عملية مسح حضور',
    attendance: 'متوسط الحضور المحسوب', demoBadge: 'بيانات تجريبية · Demo Mode',
    computedNote: 'كل رقم محسوب مباشرة من قاعدة البيانات الفعلية للمنصة',
    failNote: 'أرقام المنصة غير متاحة حاليًا — يتم تحديثها تلقائيًا',
    statusOnline: 'تعمل الآن · Live',
    statusMaintenance: 'وضع الصيانة',
    statusOffline: 'قاعدة البيانات غير متاحة',
    statusChecking: 'جاري التحقق…',
  },
  sections: {
    stackKicker: 'POWERED BY', stack: 'التقنيات المستخدمة', stackGold: 'لكل تقنية لوجوها الرسمي',
    stackSub: 'فريم ورك Next.js، باك اند Node.js و Prisma، قاعدة Neon، ديبوليمنت Vercel، وكنترول GitHub — كل تقنية في مجموعتها بلوجوها الرسمي ولونها.',
    everything: 'كل ما تحتاجه،', everythingGold: 'في منصة واحدة',
    everythingSub: 'من لحظة فتح المحاضرة إلى التقرير النهائي — رقيب يغطي الرحلة كاملة بتجربة سريعة وواضحة.',
    stepsKicker: 'THREE STEPS',
    steps: 'ثلاث خطوات…', stepsGold: 'وبوابتك تفتح',
    rolesKicker: 'BUILT FOR EVERYONE',
    roles: 'تجربة مخصصة', rolesGold: 'لكل دور',
    rolesSub: 'طالب، دكتور، أو إدارة — كل واحد يرى ما يحتاجه فقط، بصلاحيات دقيقة.',
    ctaTitle: 'جاهز تبدأ', ctaGold: 'رحلة أذكى؟',
    ctaSub: 'اختر طريقك الأكاديمي، وأنشئ حسابًا أو سجّل الدخول باستخدام الصلاحية المعتمدة لك.',
    ctaBtn: 'إنشاء حساب الآن', ctaBtn2: 'لدي حساب بالفعل',
  },
  features: [
    { title: 'حضور QR فوري', body: 'رمز مؤقت لكل محاضرة ينتهي تلقائيًا، ويمنع التسجيل بالنيابة أو مشاركة الرمز.' },
    { title: 'لوحة دكتور ذكية', body: 'افتح محاضرة، اعرض رمز الحضور، وتابع عدد الحاضرين لحظة بلحظة من لوحة واحدة.' },
    { title: 'تقارير ونِسب دقيقة', body: 'نسبة حضور لكل طالب ومقرر، محسوبة تلقائيًا بدون جداول أو حسابات يدوية.' },
    { title: 'تنبيهات ذكية', body: 'نبّه الطلاب قبل انتهاء صلاحية الرمز، وتابع من تأخر أو تغيّب عن المحاضرة.' },
    { title: 'حماية وصلاحيات', body: 'كلمات مرور مجزأة، جلسات محمية، وتحقق من الصلاحية على الخادم.' },
    { title: 'تجربة عربية أولًا', body: 'واجهة عربية واضحة، تدعم اتجاه القراءة الصحيح وتراعي الوصول.' },
    { title: 'جدول المحاضرات', body: 'مواعيد المقررات والمحاضرات في عرض مرتب حسب دورك الأكاديمي.' },
    { title: 'التكليفات والملفات', body: 'مواد وتكليفات وتسليمات مرتبطة بالمقرر ومواعيده وصلاحياته.' },
  ],
  stepCards: {
    1: { title: 'اختر وجهتك', body: 'حدّد البوابة المناسبة لك؛ الاختيار ينظم التجربة ولا يمنح صلاحية.' },
    2: { title: 'تحقق من هويتك', body: 'سجّل الدخول أو اطلب حسابًا؛ حساب الدكتور ينتظر موافقة الإدارة.' },
    3: { title: 'ادخل أدواتك', body: 'بعد التحقق تظهر الأدوات المصرح بها لدورك وسجلاتك الأكاديمية.' },
  },
  roleCards: {
    student: { t: 'طالب', b: 'تابع مقرراتك وجدولك، سجّل حضورك بالمسح، واعرف نسبتك في كل لحظة.', p: ['مسح QR للحضور', 'جدول سحب وإفلات', 'نسبة حضور لكل مقرر'] },
    professor: { t: 'دكتور', b: 'أدر محاضراتك ورموز الحضور، وأدخل الدرجات والتاسكات بتقارير فورية.', p: ['توليد رمز QR مؤقت', 'درجات وتاسكات وملفات', 'متابعة الحضور لحظيًا'] },
    admin: { t: 'إدارة', b: 'بناء الجداول بالسحب والإفلات مع الكروت، وتحكم كامل بالطلاب والمواد.', p: ['منشئ الجداول سحب-وإفلات', 'إدارة الحسابات', 'دخول بكود إدارة مشفّر'] },
  },
  roleEnter: 'الدخول كـ',
  accessLabel: 'رقيب — صلاحيات',
  footer: {
    tagline: 'منصة عربية لتنظيم الرحلة الأكاديمية والحضور والتكليفات بحسب الصلاحيات.',
    secure: 'اتصال آمن · بيانات محمية',
    statement: 'محمي بمعايير أمان مدعومة بالذكاء الاصطناعي',
    statementBadge: 'موثّق · AI-SECURITY',
    sponsorTitle: 'هوية مؤسسية · على خشبة رقيب',
    sponsorFaculty: 'كلية العلوم',
    sponsorUni: 'جامعة السويس',
    sponsorBudi: 'Budi',
    platform: 'المنصة',
    account: 'الدخول',
    legal: 'قانوني',
    navTitle: 'التنقل',
    contactTitle: 'التواصل',
    socialsTitle: 'مواقعي',
    status: 'جميع الأنظمة تعمل',
    statusLive: 'شغّال الآن',
    kicker: 'اللمسة الأخيرة',
    ctaLine1: 'لنصنع حضورًا',
    ctaLine2: 'يستحق رقيب.',
    stackNote: 'Next.js · TypeScript · Prisma',
    linksPlatform: [
      { label: 'المزايا', href: '#features' },
      { label: 'كيف يعمل', href: '#how' },
      { label: 'الأدوار', href: '#roles' },
      { label: 'التقنيات', href: '#stack' },
    ],
    linksAccount: [
      { label: 'تسجيل الدخول', href: '/login' },
      { label: 'حساب جديد', href: '/login?tab=register' },
      { label: 'بوابة الإدارة', href: '/login?tab=admin' },
    ],
    linksNav: [
      { label: 'تسجيل الدخول', href: '/login' },
      { label: 'حساب جديد', href: '/login?tab=register' },
      { label: 'بوابة الإدارة', href: '/login?tab=admin' },
    ],
    privacy: 'سياسة الخصوصية', terms: 'الشروط والأحكام', rights: 'حقوقك',
    copyright: '© 2026 رقيب — جميع الحقوق محفوظة.',
    collage: 'مقرر دراسي · لوحة العرض',
    devTitle: 'المطوّر',
    devName: 'محمد عبدالله',
    devRole: 'مطوّر ومهندس برمجيات',
    devBio: 'المهندس اللي بنى منصة رقيب من أول سكتش لحد الإنتاج — واجهة تحفة، ومنطق حقيقي، وأمان من أول سطر.',
    devLoc: 'السويس، مصر',
    devLinks: [
      { label: 'WhatsApp', href: 'https://wa.me/201065228072' },
      { label: 'Email', href: 'mailto:budiabdallah922@gmail.com' },
      { label: 'GitHub', href: 'https://github.com/budiabdallah20/raqib' },
      { label: 'Phone', href: 'tel:+201065228072' },
      { label: 'Portfolio', href: 'https://budi-portfolio-dev.vercel.app/' },
    ],
    engineered: 'تصميم وبناء',
    engineeredRole: '·',
    quote: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    quoteRef: '— سورة طه ١١٤',
    watermark: 'رقــيب',
    finalWords: 'منصة عربية تربط المحاضرة والطالب وأستاذه بسجلات واضحة وصلاحيات محددة.',
    connect: 'كلمّني سريع',
    marquee: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Prisma', 'SQLite', 'Framer Motion', 'Bcrypt', 'JWT'],
    previewNote: 'معاينة توضيحية للتصميم — البيانات داخل المنصة حقيقية',
  },
  guest: {
    hello: 'أهلًا بيك في رقيب 💙',
    title: 'أول مرة تعدي على رقيب؟',
    sub: 'بنينا رقيب بحب وشغف علشان يومك في الكلية يبقى أسهل — حضورك بالـ QR في ثانية، وجدولك ونسبتك قدامك لحظة بلحظة، كل ده من المتصفح من غير أي تطبيق.',
    primary: 'استكشف المنصة',
    secondary: 'اعمل حسابك',
    dismiss: 'لاحقًا',
    madeWith: 'صُنع بحب وشغف في مصر 🇪🇬',
  },
  guestSteps: {
    1: 'امسح رمز المحاضرة',
    2: 'اتسجّل حضورك فورًا',
    3: 'تابع نسبتك لحظة بلحظة',
  },
};

/* ============================== English ============================== */

const EN: Dict = {
  dir: 'ltr',
  nav: { features: 'Features', how: 'How it works', roles: 'Roles', stack: 'Tech stack', login: 'Login', start: 'Get started', menu: 'Menu' },
  hero: {
    welcome: 'RAQiB welcomes you',
    badge: 'An Arabic-first academic space for students and staff',
    line1: ['The', 'lecture', 'starts,'],
    line2: ['attendance', 'signs', 'itself.'],
    sub: 'Raqib runs your classroom attendance with rotating QR codes and instant reports — a fast, Arabic-first platform that respects every role’s permissions.',
    ctaPrimary: 'Start your journey',
    ctaSecondary: 'Explore the platform',
    trustSecure: 'Secure HTTPS connection',
    trustNoApp: 'No app — right from the browser',
    trustFast: 'Role-based access',
    exhibitTag: 'EXHIBIT 01 / LIVE ATTENDANCE BOARD',
  },
  mock: {
    board: 'Attendance Board', area: 'Academic course · Today’s lecture', live: 'Live', pct: 'Attendance',
    today: "Today's lecture", present: 'present', late: 'late',
    scan: 'Scan QR to sign in', signed: 'Verified', signedTime: '12:04 PM',
    joined: 'students signed in today',
    courseA: 'MAT207 — Analytical Geometry', courseB: 'MAT305 — Numerical Analysis',
    timeA: '10:00 AM', timeB: '12:30 PM', room: 'Classroom 1 · Dr. Nogey',
    statusDone: 'Done', statusNext: 'Upcoming',
  },
  stats: { sec: '3', secUnit: 'sec', secLabel: 'to check in', accuracy: 'verification accuracy', always: 'always available', arabic: 'Arabic-first UI' },
  metrics: {
    students: 'students on the platform', lectures: 'recorded lectures', scans: 'attendance scans',
    attendance: 'computed attendance average', demoBadge: 'Demo Mode · sample data',
    computedNote: 'Every number is computed live from the actual platform database',
    failNote: 'Platform metrics are unavailable right now — they refresh automatically',
    statusOnline: 'Live · operational',
    statusMaintenance: 'Maintenance mode',
    statusOffline: 'Database unavailable',
    statusChecking: 'Checking status…',
  },
  sections: {
    stackKicker: 'POWERED BY', stack: 'Tech stack', stackGold: 'every logo, its own colors',
    stackSub: 'Next.js framework, Node.js & Prisma backend, Neon database, Vercel deploys and GitHub control — every tech in its own group, wearing its official colors.',
    everything: 'Everything you need,', everythingGold: 'in one platform',
    everythingSub: 'From opening the lecture to the final report — Raqib covers the whole journey with a fast, clear experience.',
    stepsKicker: 'THREE STEPS',
    steps: 'Three steps…', stepsGold: 'and your gate opens',
    rolesKicker: 'BUILT FOR EVERYONE',
    roles: 'A tailored experience', rolesGold: 'for every role',
    rolesSub: 'Student, professor, or admin — each sees exactly what they need, with precise permissions.',
    ctaTitle: 'Ready to start', ctaGold: 'a smarter journey?',
    ctaSub: 'Choose your academic route, create an account or sign in with your approved access.',
    ctaBtn: 'Create account now', ctaBtn2: 'I already have an account',
  },
  features: [
    { title: 'Instant QR attendance', body: 'A temporary code per lecture that expires automatically — no proxies, no shared codes.' },
    { title: 'Smart professor board', body: 'Open a lecture, display the code, and watch attendance flow in live from one board.' },
    { title: 'Accurate reports & rates', body: 'Per-student and per-course attendance rates, computed automatically — zero manual math.' },
    { title: 'Smart alerts', body: 'Students are warned before codes expire, and late or missing attendance is tracked.' },
    { title: 'Protection and permissions', body: 'Hashed passwords, protected sessions and server-side authorization.' },
    { title: 'Arabic-first experience', body: 'Clear Arabic typography, correct reading direction and accessible controls.' },
    { title: 'Lecture timetable', body: 'Course and lecture times organized around your academic role.' },
    { title: 'Assignments and files', body: 'Materials, assignments and submissions tied to course access and deadlines.' },
  ],
  stepCards: {
    1: { title: 'Choose a destination', body: 'Select a gateway for context; the choice itself does not grant access.' },
    2: { title: 'Verify identity', body: 'Sign in or request an account; professor access awaits approval.' },
    3: { title: 'Enter your tools', body: 'Verified members see only the academic tools and records allowed for their role.' },
  },
  roleCards: {
    student: { t: 'Student', b: 'Track your courses and timetable, scan to sign in, and know your percentage at every moment.', p: ['QR scan check-in', 'Drag-and-drop timetable', 'Per-course attendance %'] },
    professor: { t: 'Professor', b: 'Manage lectures and codes, enter grades and tasks with live reports.', p: ['Temporary QR generation', 'Grades, tasks & files', 'Real-time attendance'] },
    admin: { t: 'Admin', b: 'Build the whole timetable by drag-and-drop cards, with full control over students and courses.', p: ['Drag-and-drop schedule builder', 'Account management', 'Encrypted admin-code login'] },
  },
  roleEnter: 'Enter as ',
  accessLabel: 'RAQIB ACCESS',
  footer: {
    tagline: 'An Arabic-first platform connecting academic work through clear role-based access.',
    secure: 'Secure connection · Protected data',
    statement: 'Protected by AI-powered security standards',
    statementBadge: 'CERTIFIED · AI-SECURITY',
    sponsorTitle: 'Institutional identity · on the Raqib stage',
    sponsorFaculty: 'Faculty of Science',
    sponsorUni: 'Suez University',
    sponsorBudi: 'Budi',
    platform: 'Platform',
    account: 'Access',
    legal: 'Legal',
    navTitle: 'Navigate',
    contactTitle: 'Contact',
    socialsTitle: 'Socials',
    status: 'View system status',
    statusLive: 'Live right now',
    kicker: 'The last frame',
    ctaLine1: "LET'S BUILD",
    ctaLine2: 'ATTENDANCE THAT MATTERS.',
    stackNote: 'Next.js · TypeScript · Prisma',
    linksPlatform: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how' },
      { label: 'Roles', href: '#roles' },
      { label: 'Tech stack', href: '#stack' },
    ],
    linksAccount: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/login?tab=register' },
      { label: 'Admin portal', href: '/login?tab=admin' },
    ],
    linksNav: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/login?tab=register' },
      { label: 'Admin portal', href: '/login?tab=admin' },
    ],
    privacy: 'Privacy policy', terms: 'Terms & conditions', rights: 'Your rights',
    copyright: '© 2026 Raqib — All rights reserved.',
    collage: 'Math & CS Department · Faculty of Science',
    devTitle: 'Developer',
    devName: 'Mohamed Abdallah',
    devRole: 'Developer & Software Engineer',
    devBio: 'The engineer who built Raqib from first sketch to production — beautiful interfaces, real logic, security from line one.',
    devLoc: 'Suez, Egypt',
    devLinks: [
      { label: 'WhatsApp', href: 'https://wa.me/201065228072' },
      { label: 'Email', href: 'mailto:budiabdallah922@gmail.com' },
      { label: 'GitHub', href: 'https://github.com/budiabdallah20/raqib' },
      { label: 'Phone', href: 'tel:+201065228072' },
      { label: 'Portfolio', href: 'https://budi-portfolio-dev.vercel.app/' },
    ],
    engineered: 'Design & build',
    engineeredRole: '·',
    quote: '“My Lord, increase me in knowledge.”',
    quoteRef: '— Quran 20:114',
    watermark: 'RAQiB',
    finalWords: 'Precise attendance in seconds — an Arabic platform with bank-grade rigor, built on real data, not promises.',
    connect: 'Reach me fast',
    marquee: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Prisma', 'SQLite', 'Framer Motion', 'Bcrypt', 'JWT'],
    previewNote: 'Design preview only — real data lives inside the platform',
  },
  guest: {
    hello: 'Welcome to RAQIB 💙',
    title: 'First time on Raqib?',
    sub: "We built RAQIB with love and passion to make your campus day easier — attendance in one scan, timetable and rate live, all from the browser with zero apps.",
    primary: 'Explore the platform',
    secondary: 'Create account',
    dismiss: 'Later',
    madeWith: 'Crafted with love & passion in Egypt',
  },
  guestSteps: {
    1: 'Scan the lecture code',
    2: 'Your attendance is sealed',
    3: 'Watch your rate live',
  },
};

const dictionaries: Record<Lang, Dict> = { ar: AR, en: EN };

const KEY = 'raqib_lang';

const LangContext = React.createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
}>({ lang: 'ar', setLang: () => null, t: AR });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>('ar');

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY) as Lang | null;
      if (saved === 'en' || saved === 'ar') setLangState(saved);
    } catch { /* تجاهل */ }
  }, []);

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch { /* تجاهل */ }
  }, []);

  const value = React.useMemo(
    () => ({ lang, setLang, t: dictionaries[lang] }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return React.useContext(LangContext);
}
