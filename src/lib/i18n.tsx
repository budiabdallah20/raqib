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
  nav: { features: string; how: string; roles: string; security: string; login: string; start: string; menu: string };
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
  };
  mock: {
    board: string; area: string; live: string; pct: string; today: string;
    present: string; late: string; scan: string; signed: string; signedTime: string;
    joined: string;
    courseA: string; courseB: string; timeA: string; timeB: string; room: string;
    statusDone: string; statusNext: string;
  };
  stats: { sec: string; secUnit: string; secLabel: string; accuracy: string; always: string; arabic: string };
  metrics: { students: string; lectures: string; scans: string; attendance: string; demoBadge: string; computedNote: string; failNote: string };
  sections: {
    everything: string; everythingGold: string; everythingSub: string;
    stepsKicker: string; steps: string; stepsGold: string;
    rolesKicker: string; roles: string; rolesGold: string; rolesSub: string;
    securityKicker: string; securityTitle: string; securityGold: string; securitySub: string;
    secureCard: string; secureCardSub: string; allOk: string;
    ctaTitle: string; ctaGold: string; ctaSub: string; ctaBtn: string; ctaBtn2: string;
  };
  features: { title: string; body: string }[];
  stepCards: { 1: { title: string; body: string }; 2: { title: string; body: string }; 3: { title: string; body: string } };
  roleCards: { student: { t: string; b: string; p: string[] }; professor: { t: string; b: string; p: string[] }; admin: { t: string; b: string; p: string[] } };
  roleEnter: string; accessLabel: string;
  securityItems: string[];
  footer: {
    tagline: string; secure: string;
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
  guest: { hello: string; title: string; sub: string; primary: string; secondary: string; dismiss: string };
  guestSteps: { 1: string; 2: string; 3: string };
};

/* ============================== العربية ============================== */

const AR: Dict = {
  dir: 'rtl',
  nav: { features: 'المزايا', how: 'كيف يعمل', roles: 'الأدوار', security: 'الأمان', login: 'دخول', start: 'ابدأ الآن', menu: 'القائمة' },
  hero: {
    welcome: 'رقيب ترحب بكم',
    badge: 'منصة الحضور الذكية · كلية العلوم — جامعة السويس',
    line1: ['الحضور', 'صار', 'أذكى.'],
    line2: ['والوقت', 'صار', 'لك.'],
    sub: 'رقيب يحوّل الحضور إلى تجربة فورية بالـ QR: الدكتور يفتح المحاضرة، الطالب يمسح الرمز، والتقرير يتحدّث لحظيًا — بتصميم عربي أنيق وأمان بمعايير مصرفية.',
    ctaPrimary: 'ابدأ الآن — مجانًا',
    ctaSecondary: 'تسجيل الدخول',
    trustSecure: 'اتصال آمن HTTPS',
    trustNoApp: 'بدون تطبيق — من المتصفح',
    trustFast: 'تسجيل في 3 ثوانٍ',
  },
  mock: {
    board: 'لوحة الحضور', area: 'كلية العلوم · جامعة السويس', live: 'مباشر', pct: 'نسبة الحضور',
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
  },
  sections: {
    everything: 'كل ما تحتاجه،', everythingGold: 'في منصة واحدة',
    everythingSub: 'من لحظة فتح المحاضرة إلى التقرير النهائي — رقيب يغطي الرحلة كاملة بتجربة سريعة وواضحة.',
    stepsKicker: 'THREE STEPS',
    steps: 'ثلاث خطوات…', stepsGold: 'وحضورك محفوظ',
    rolesKicker: 'BUILT FOR EVERYONE',
    roles: 'تجربة مخصصة', rolesGold: 'لكل دور',
    rolesSub: 'طالب، دكتور، أو إدارة — كل واحد يرى ما يحتاجه فقط، بصلاحيات دقيقة.',
    securityKicker: 'SECURITY FIRST',
    securityTitle: 'أمان بمعايير', securityGold: 'مصرفية',
    securitySub: 'بياناتك الأكاديمية أمانة. بنينا رقيب من الأساس على مبادئ الحماية، مش كإضافة لاحقة.',
    secureCard: 'اتصال محمي بالكامل', secureCardSub: 'HTTPS + HSTS + Cookies httpOnly',
    allOk: 'جميع الأنظمة تعمل بشكل طبيعي',
    ctaTitle: 'جاهز تبدأ', ctaGold: 'رحلة أذكى؟',
    ctaSub: 'انضم لرقيب اليوم، وسجّل حضورك الأول في أقل من دقيقة. مجاني لطلاب وأعضاء هيئة التدريس بجامعة السويس.',
    ctaBtn: 'إنشاء حساب الآن', ctaBtn2: 'لدي حساب بالفعل',
  },
  features: [
    { title: 'حضور QR فوري', body: 'رمز مؤقت لكل محاضرة ينتهي تلقائيًا، ويمنع التسجيل بالنيابة أو مشاركة الرمز.' },
    { title: 'لوحة دكتور ذكية', body: 'افتح محاضرة، اعرض رمز الحضور، وتابع عدد الحاضرين لحظة بلحظة من لوحة واحدة.' },
    { title: 'تقارير ونِسب دقيقة', body: 'نسبة حضور لكل طالب ومقرر، محسوبة تلقائيًا بدون جداول أو حسابات يدوية.' },
    { title: 'تنبيهات ذكية', body: 'نبّه الطلاب قبل انتهاء صلاحية الرمز، وتابع من تأخر أو تغيّب عن المحاضرة.' },
    { title: 'أمان بمعايير مصرفية', body: 'تشفير bcrypt، جلسات JWT httpOnly، HTTPS، وتحديد لمعدل المحاولات.' },
    { title: 'تجربة عربية أولًا', body: 'واجهة بخط عربي أنيق، وألوان مستوحاة من الهوية الذهبية الملكية لجامعة السويس.' },
  ],
  stepCards: {
    1: { title: 'أنشئ حسابك', body: 'سجّل كطالب أو دكتور في خطوات بسيطة، مع تحقق فوري من البيانات.' },
    2: { title: 'افتح المحاضرة', body: 'الدكتور يفتح المحاضرة ويولّد رمز QR مؤقتًا يظهر على الشاشة.' },
    3: { title: 'حضور في لحظة', body: 'الطالب يمسح الرمز من جواله، ويُسجَّل حضوره ويتحدّث التقرير فورًا.' },
  },
  roleCards: {
    student: { t: 'طالب', b: 'تابع مقرراتك وجدولك، سجّل حضورك بالمسح، واعرف نسبتك في كل لحظة.', p: ['مسح QR للحضور', 'جدول سحب وإفلات', 'نسبة حضور لكل مقرر'] },
    professor: { t: 'دكتور', b: 'أدر محاضراتك ورموز الحضور، وأدخل الدرجات والتاسكات بتقارير فورية.', p: ['توليد رمز QR مؤقت', 'درجات وتاسكات وملفات', 'متابعة الحضور لحظيًا'] },
    admin: { t: 'إدارة', b: 'بناء الجداول بالسحب والإفلات مع الكروت، وتحكم كامل بالطلاب والمواد.', p: ['منشئ الجداول سحب-وإفلات', 'إدارة الحسابات', 'دخول بكود إدارة مشفّر'] },
  },
  roleEnter: 'الدخول كـ',
  accessLabel: 'رقيب — صلاحيات',
  securityItems: [
    'تشفير كلمات المرور بـ bcrypt',
    'جلسات JWT موقّعة في cookies httpOnly',
    'اتصال HTTPS مع HSTS إجباري',
    'تحديد معدل المحاولات لكل مسار حساس',
    'تحقق مزدوج من صحة البيانات على السيرفر',
    'رموز حضور مؤقتة تنتهي تلقائيًا',
  ],
  footer: {
    tagline: 'منصة الحضور الذكية لكلية العلوم — جامعة السويس.',
    secure: 'اتصال آمن · بيانات محمية',
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
      { label: 'الأمان', href: '#security' },
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
    collage: 'قسم رياضيات وعلوم الحاسب · كلية العلوم',
    devTitle: 'المطوّر',
    devName: 'محمد عبدالله',
    devRole: 'Full-Stack Developer',
    devBio: 'المهندس اللي بنى منصة رقيب من أول سكتش لحد الإنتاج — واجهة تحفة، ومنطق حقيقي، وأمان من أول سطر.',
    devLoc: 'السويس، مصر',
    devLinks: [
      { label: 'WhatsApp', href: 'https://wa.me/201065228072' },
      { label: 'Email', href: 'mailto:budiabdallah922@gmail.com' },
      { label: 'Phone', href: 'tel:+201065228072' },
      { label: 'Portfolio', href: 'https://budi-portfolio-dev.vercel.app/' },
    ],
    engineered: 'تصميم وبناء',
    engineeredRole: '·',
    quote: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    quoteRef: '— سورة طه ١١٤',
    watermark: 'رقــيب',
    finalWords: 'حضور دقيق في ثوانٍ — منصة عربية بمعايير مصرفية، مبنية على داتا حقيقية لا وعود.',
    connect: 'كلمّني سريع',
    marquee: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Prisma', 'SQLite', 'Framer Motion', 'Bcrypt', 'JWT'],
    previewNote: 'معاينة توضيحية للتصميم — البيانات داخل المنصة حقيقية',
  },
  guest: {
    hello: 'أهلًا وسهلاً بيك 👑',
    title: 'أول مرة تعدي على رقيب؟',
    sub: 'منصة الحضور الأذكى لكلية العلوم — سجّل حضورك بالـ QR، تابع جدولك ونسبتك في لحظة، وكله من المتصفح بدون أي تطبيق.',
    primary: 'استكشف المنصة',
    secondary: 'إنشاء حساب',
    dismiss: 'لاحقًا',
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
  nav: { features: 'Features', how: 'How it works', roles: 'Roles', security: 'Security', login: 'Login', start: 'Get started', menu: 'Menu' },
  hero: {
    welcome: 'RAQiB welcomes you',
    badge: 'Smart attendance platform · Faculty of Science — Suez University',
    line1: ['Attendance', 'just got', 'smarter.'],
    line2: ['And time', 'is yours', 'again.'],
    sub: 'Raqib turns attendance into an instant QR experience: the professor opens the lecture, the student scans, and reports update in real time — with an elegant Arabic-first design and banking-grade security.',
    ctaPrimary: 'Start now — free',
    ctaSecondary: 'Sign in',
    trustSecure: 'Secure HTTPS connection',
    trustNoApp: 'No app — right from the browser',
    trustFast: 'Check-in in 3 seconds',
  },
  mock: {
    board: 'Attendance Board', area: 'Faculty of Science · Suez University', live: 'Live', pct: 'Attendance',
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
  },
  sections: {
    everything: 'Everything you need,', everythingGold: 'in one platform',
    everythingSub: 'From opening the lecture to the final report — Raqib covers the whole journey with a fast, clear experience.',
    stepsKicker: 'THREE STEPS',
    steps: 'Three steps…', stepsGold: 'and your attendance is saved',
    rolesKicker: 'BUILT FOR EVERYONE',
    roles: 'A tailored experience', rolesGold: 'for every role',
    rolesSub: 'Student, professor, or admin — each sees exactly what they need, with precise permissions.',
    securityKicker: 'SECURITY FIRST',
    securityTitle: 'Banking-grade', securityGold: 'security',
    securitySub: 'Your academic data is a trust. Raqib was built on protection principles from day one — not bolted on later.',
    secureCard: 'Fully protected connection', secureCardSub: 'HTTPS + HSTS + httpOnly cookies',
    allOk: 'All systems operational',
    ctaTitle: 'Ready to start', ctaGold: 'a smarter journey?',
    ctaSub: 'Join Raqib today and sign your first attendance in under a minute. Free for Suez University students and staff.',
    ctaBtn: 'Create account now', ctaBtn2: 'I already have an account',
  },
  features: [
    { title: 'Instant QR attendance', body: 'A temporary code per lecture that expires automatically — no proxies, no shared codes.' },
    { title: 'Smart professor board', body: 'Open a lecture, display the code, and watch attendance flow in live from one board.' },
    { title: 'Accurate reports & rates', body: 'Per-student and per-course attendance rates, computed automatically — zero manual math.' },
    { title: 'Smart alerts', body: 'Students are warned before codes expire, and late or missing attendance is tracked.' },
    { title: 'Banking-grade security', body: 'bcrypt hashing, httpOnly JWT sessions, HTTPS, and strict rate limiting.' },
    { title: 'Royal Arabic-first design', body: 'An elegant Arabic type system with the majestic royal-gold identity of Suez University.' },
  ],
  stepCards: {
    1: { title: 'Create your account', body: 'Sign up as a student or professor in a few simple steps with instant validation.' },
    2: { title: 'Open the lecture', body: 'The professor opens the lecture and generates a temporary QR code on screen.' },
    3: { title: 'Attendance in an instant', body: 'The student scans the code from their phone — record and report update instantly.' },
  },
  roleCards: {
    student: { t: 'Student', b: 'Track your courses and timetable, scan to sign in, and know your percentage at every moment.', p: ['QR scan check-in', 'Drag-and-drop timetable', 'Per-course attendance %'] },
    professor: { t: 'Professor', b: 'Manage lectures and codes, enter grades and tasks with live reports.', p: ['Temporary QR generation', 'Grades, tasks & files', 'Real-time attendance'] },
    admin: { t: 'Admin', b: 'Build the whole timetable by drag-and-drop cards, with full control over students and courses.', p: ['Drag-and-drop schedule builder', 'Account management', 'Encrypted admin-code login'] },
  },
  roleEnter: 'Enter as ',
  accessLabel: 'RAQIB ACCESS',
  securityItems: [
    'Password hashing with bcrypt',
    'Signed JWT sessions in httpOnly cookies',
    'HTTPS with enforced HSTS',
    'Rate limiting on every sensitive route',
    'Double server-side validation',
    'Temporary codes that expire automatically',
  ],
  footer: {
    tagline: 'The smart attendance platform for Faculty of Science — Suez University.',
    secure: 'Secure connection · Protected data',
    platform: 'Platform',
    account: 'Access',
    legal: 'Legal',
    navTitle: 'Navigate',
    contactTitle: 'Contact',
    socialsTitle: 'Socials',
    status: 'All systems operational',
    statusLive: 'Live right now',
    kicker: 'The last frame',
    ctaLine1: "LET'S BUILD",
    ctaLine2: 'ATTENDANCE THAT MATTERS.',
    stackNote: 'Next.js · TypeScript · Prisma',
    linksPlatform: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how' },
      { label: 'Roles', href: '#roles' },
      { label: 'Security', href: '#security' },
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
    devRole: 'Full-Stack Developer',
    devBio: 'The engineer who built Raqib from first sketch to production — beautiful interfaces, real logic, security from line one.',
    devLoc: 'Suez, Egypt',
    devLinks: [
      { label: 'WhatsApp', href: 'https://wa.me/201065228072' },
      { label: 'Email', href: 'mailto:budiabdallah922@gmail.com' },
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
    hello: 'Welcome 👑',
    title: 'First time on Raqib?',
    sub: 'The smartest attendance platform in the Faculty of Science — scan to sign in, track your timetable and attendance rate live, all from the browser.',
    primary: 'Explore the platform',
    secondary: 'Create account',
    dismiss: 'Later',
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
