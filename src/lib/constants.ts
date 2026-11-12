export const APP_NAME = 'رقيب';
export const APP_NAME_EN = 'RAQiB';
export const FACULTY = 'كلية العلوم — جامعة السويس';
export const DEPARTMENT = 'قسم رياضيات وعلوم الحاسب';

export const COOKIE_NAME = 'raqib_token';
/**
 * عمر الجلسة:
 * — «تذكرني» ✅ → 30 يومًا: الجلسة محفوظة في القاعدة (Session) وكوكي httpOnly
 *   على جهاز المستخدم، وقابلة للإبطال من السيرفر في أي لحظة (revokedAt).
 * — بدون «تذكرني» → 12 ساعة فقط (كوكي جلسة يموت مع إغلاق المتصفح).
 * تقليل نافذة غير المتذكر يحدّ من أثر سرقة الكوكي أو الجهاز المفقود.
 */
export const SESSION_SHORT_IN = 60 * 60 * 12;
export const SESSION_REMEMBER_IN = 60 * 60 * 24 * 30;
/** للتوافق مع الاستخدامات القديمة (QR وسواها) — أقصر عمر */
export const JWT_EXPIRES_IN = SESSION_SHORT_IN;
export const QR_TTL_MS = 15 * 60 * 1000;
/** تدوير رمز QR داخل نفس المحاضرة — كل 10 ثوانٍ (WP3 / spec 5–10s) */
export const QR_ROTATE_MS = 10_000;
/** عمر الرمز الديناميكي بعد كل تدوير — JWT exp=15s كما في المواصفة */
export const QR_SESSION_TTL_MS = 15_000;
/** القيم المسموحة لمدة دوران QR من لوحة الأدمن (§6.7 — صف 20) */
export const QR_ROTATE_PRESETS = [5, 10, 15, 20] as const;

/**
 * قراءة إعداد «qr_rotation_seconds» من AppSetting.
 * القيم المسموحة 5/10/15/20 ثانية — أي قيمة أخرى أو فراغ يرجع للثابت 10.
 */
export function qrRotationMs(value: string | null | undefined) {
  const seconds = Math.round(Number(String(value ?? '').trim()));
  if (!Number.isFinite(seconds) || seconds <= 0) return QR_ROTATE_MS;
  return Math.min(20, Math.max(5, seconds)) * 1000;
}

export const RESET_CODE_TTL_MS = 10 * 60 * 1000;
export const RESET_MAX_ATTEMPTS = 5;

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

export const PUBLIC_PATHS = [  '/',
  '/login',
  '/register',
  '/privacy',
  '/terms',
  '/brand',
  '/status',
  '/changelog',
  // مؤقتًا: معاينة نظام التصميم (لا تعرض أي بيانات) — تُزال عند تسليم المرحلة 2
  '/design',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/admin',
  '/api/auth/forgot',
  '/api/auth/reset',
  '/api/auth/logout',
  // دخول البصمة عام بطبيعته: التحدي في كوكي httpOnly والتحقق في السيرفر.
  '/api/auth/passkey/auth-options',
  '/api/auth/passkey/auth-verify',
  '/api/upload/avatar',
  '/api/public/metrics',
  '/api/health',
];

// ─────────────────────────────────────────────────────────
// نظام الجداول — الشبكة والفترات وأنواع الكروت
// ─────────────────────────────────────────────────────────

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
