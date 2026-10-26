export const APP_NAME = 'رقيب';
export const APP_NAME_EN = 'RAQiB';
export const APP_TAGLINE = 'الحضور صار أذكى. والوقت صار لك.';
export const FACULTY = 'كلية العلوم — جامعة السويس';
export const DEPARTMENT = 'قسم رياضيات وعلوم الحاسب';
export const UNIVERSITY = 'جامعة السويس';

export const COOKIE_NAME = 'raqib_token';
export const JWT_EXPIRES_IN = 60 * 60 * 24 * 7;
export const QR_TTL_MS = 15 * 60 * 1000;
/** تدوير رمز QR داخل نفس المحاضرة — كل 20 ثانية (WP3) */
export const QR_ROTATE_MS = 20_000;
/** عمر الرمز بعد كل تدوير — هامش لتغطية أي تأخير في الشبكة */
export const QR_SESSION_TTL_MS = 60_000;

export const RESET_CODE_TTL_MS = 10 * 60 * 1000;
export const RESET_MAX_ATTEMPTS = 5;

export const ROLES = {
  STUDENT: 'STUDENT',
  PROFESSOR: 'PROFESSOR',
  ADMIN: 'ADMIN',
} as const;

export const ROLE_HOME: Record<string, string> = {
  STUDENT: '/student',
  PROFESSOR: '/professor',
  ADMIN: '/admin',
};

export const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'طالب',
  PROFESSOR: 'دكتور',
  ADMIN: 'أدمن',
};

export const GENDER_LABEL: Record<string, string> = {
  MALE: 'ذكر',
  FEMALE: 'أنثى',
  UNDISCLOSED: 'أفضل عدم الذكر',
};

export const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/privacy',
  '/terms',
  '/brand',
  '/status',
  '/changelog',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/admin',
  '/api/auth/forgot',
  '/api/auth/reset',
  '/api/auth/logout',
  '/api/upload/avatar',
  '/api/public/metrics',
  '/api/health',
];

// ─────────────────────────────────────────────────────────
// نظام الجداول — الشبكة والفترات وأنواع الكروت
// ─────────────────────────────────────────────────────────
export type SchedKind = 'LECTURE' | 'SECTION' | 'LAB';

// day في DB: 2=الاثنين 3=الثلاثاء 4=الأربعاء 5=الخميس (الجريد الرسمي)
export const SCHED_DAYS: { day: number; ar: string }[] = [
  { day: 2, ar: 'الاثنين' },
  { day: 3, ar: 'الثلاثاء' },
  { day: 4, ar: 'الأربعاء' },
  { day: 5, ar: 'الخميس' },
];

export const SCHED_PERIODS: { period: number; label: string; time: string; from: string; to: string }[] = [
  { period: 1, label: 'الحصة الأولى', time: '08:30 – 10:30', from: '08:30', to: '10:30' },
  { period: 2, label: 'الحصة الثانية', time: '10:30 – 12:30', from: '10:30', to: '12:30' },
  { period: 3, label: 'الحصة الثالثة', time: '12:30 – 14:30', from: '12:30', to: '14:30' },
  { period: 4, label: 'الحصة الرابعة', time: '14:30 – 16:30', from: '14:30', to: '16:30' },
];

export const SCHED_KIND_LABEL: Record<string, string> = {
  LECTURE: 'محاضرة',
  SECTION: 'سكشن',
  LAB: 'معمل',
};

export const SCHED_GROUPS = ['A', 'B'] as const;
