'use client';

/**
 * رسالة ترحيب الزائر — «كارت ترحيب» أنيق يظهر مرة واحدة (بيوم) على الرئيسية:
 * كارت زجاجي كحلي بحدّ متدرّج أزرق×ذهبي، لوجو رقيب، خطوات مختصرة، وزرّين.
 * أنيميشن بسيط: دخول fade+scale متدرّج فقط — بلا هالات ضخمة ولا حلقات لا نهائية
 * (أداء أولًا) وإغلاق بـ Escape زي أي مودال محترم.
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShieldCheck, ChevronLeft, Sparkles } from 'lucide-react';
import { LogoMark } from '@/components/shared/Logo';
import { AcademicGateMark } from '@/components/stage/AcademicGateMark';
import { useLang } from '@/lib/i18n';
import { usePortalPrefs } from '@/lib/portal-prefs';

const KEY = 'raqib_welcome_v1';

/** يُفتح الترتيب خُدمي واحد لكل يوم — لتفضيل الرسالة كل صفحة جديدة. */
function isStale(mark: string) {
  return mark !== new Date().toISOString().slice(0, 10);
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function WelcomeGate() {
  const { t } = useLang();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const mark = window.localStorage.getItem(KEY);
      if (!mark || isStale(mark)) {
        setOpen(true);
      }
    } catch {
      /* تجاهل */
    }
    // مرة واحدة فقط لكل زيارة — السؤال تفضل مخفي بعد أول إغلاق.
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(KEY, new Date().toISOString().slice(0, 10));
    } catch { /* تجاهل */ }
  }, []);

  /* Escape يقفل الكارت — سلوك لوحات المفاتيح العالمي */
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="welcome-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.guest.title}
        >
          {/* scrim — أي نقرة في أي حتة تقفل */}
          <button
            type="button"
            onClick={close}
            aria-label="إغلاق"
            className="absolute inset-0 bg-[#03101d]/70 backdrop-blur-sm"
          />

          {/* كارت الترحيب */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="theatre-welcome relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/12 bg-[#071224]/92 text-center shadow-[0_44px_110px_-32px_rgba(2,10,30,0.95)] backdrop-blur-xl"
          >
            {/* شريط الافتتاح الذهبي × ضوء الأكاديمية */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-[2.5px] bg-[linear-gradient(to_left,transparent,#a3e635,#e6cb78,transparent)]" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse 62% 40% at 50% -8%, rgba(200,162,75,0.2), transparent 60%), radial-gradient(ellipse 42% 34% at 92% 104%, rgba(163,230,53,0.09), transparent 58%)',
              }}
            />

            {/* زر الإغلاق */}
            <button
              type="button"
              onClick={close}
              aria-label="إغلاق الترحيب"
              className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-[#e6cb78]/70 transition hover:border-[#e6cb78]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="relative px-6 pb-6 pt-8 sm:px-8 sm:pb-7">
              {/* ختم رقيب */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.55, type: 'spring', bounce: 0.35, delay: 0.08 }}
                className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-[#e6cb78]/40 bg-white shadow-[0_20px_46px_-16px_rgba(200,162,75,0.75)]"
              >
                <LogoMark className="h-10 w-10" framed={false} />
              </motion.div>

              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.45, ease: EASE }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#e6cb78]/35 bg-[#c8a24b]/[0.12] px-3.5 py-1.5 text-[10px] font-bold tracking-wide text-[#f0e0a9]"
              >
                <Sparkles className="h-3 w-3" />
                {t.guest.hello}
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.45, ease: EASE }}
                className="mt-3 font-display text-[1.6rem] font-black leading-snug tracking-[-0.02em] text-[#f6f9ef]"
              >
                {t.guest.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.45, ease: EASE }}
                className="mx-auto mt-2.5 max-w-xs text-[11.5px] leading-6 text-[#bfe7e2]/70"
              >
                {t.guest.sub}
              </motion.p>

              {/* الخطوات الثلاث — صف واحد مختصر بأرقام ذهبية */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.45, ease: EASE }}
                className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3"
                dir={t.dir}
              >
                {([1, 2, 3] as const).map((key) => (
                  <div key={key} className="flex flex-col items-center gap-1.5">
                    <span className="bg-[linear-gradient(120deg,#f0e0a9,#c8a24b)] bg-clip-text font-latin text-[13px] font-black tracking-[0.1em] text-transparent" dir="ltr">
                      {`0${key}`}
                    </span>
                    <span className="text-[9px] font-semibold leading-4 text-[#bfe7e2]/65">{t.guestSteps[key]}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.45, ease: EASE }}
                className="mt-5 flex w-full flex-col gap-2.5 sm:flex-row"
              >
                <Link
                  href="#features"
                  onClick={close}
                  className="group relative flex h-11 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78_75%,#f0e0a9)] px-4 text-[12px] font-extrabold text-[#1c1503] shadow-[0_16px_40px_-14px_rgba(200,162,75,0.65)] transition hover:-translate-y-0.5"
                  dir={t.dir}
                >
                  <span className="relative z-10">{t.guest.primary}</span>
                  <span aria-hidden className="absolute inset-y-0 -left-10 w-10 -skew-x-12 bg-white/25 blur-md transition-all duration-700 group-hover:left-[110%]" />
                </Link>
                <Link
                  href="/login?tab=register"
                  onClick={close}
                  className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-white/16 bg-white/[0.07] px-4 text-[12px] font-bold text-[#e8f3d2] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[#7fc0f4]/40 hover:text-white"
                  dir={t.dir}
                >
                  {t.guest.secondary}
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.58, duration: 0.45 }}
                className="mt-4 flex items-center justify-center gap-4"
              >
                <button
                  type="button"
                  onClick={close}
                  className="text-[10px] font-semibold text-[#bfe7e2]/45 transition hover:text-[#bfe7e2]/85"
                >
                  {t.guest.dismiss}
                </button>
                <span className="h-2.5 w-px bg-white/12" aria-hidden />
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-[#bfe7e2]/50">
                  <Heart className="h-3 w-3 fill-[#7fc0f4] text-[#7fc0f4]" />
                  <span className="bg-[linear-gradient(100deg,#e6cb78,#f0e0a9_45%,#7fc0f4)] bg-clip-text text-transparent">
                    {t.guest.madeWith}
                  </span>
                </p>
              </motion.div>

              {/* ختم الأمان الصغير */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.64, duration: 0.45 }}
                className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7fc0f4]/40"
              >
                <ShieldCheck className="h-3 w-3" />
                RAQiB Secure
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ============================================================== */
/* الترحيب الشخصي لكل دور — «أهلًا بك في رقيب» مرة واحدة في العمر   */
/* ============================================================== */

type WelcomeRole = 'STUDENT' | 'PROFESSOR' | 'ADMIN';

type MeUser = {
  id: string;
  name: string;
  role: string;
  studentCode?: string | null;
  level?: string | null;
  group?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
};

const WELCOME_KEYS: Record<WelcomeRole, string> = {
  STUDENT: 'raqib_welcomed_student_v1',
  PROFESSOR: 'raqib_welcomed_professor_v1',
  ADMIN: 'raqib_welcomed_admin_v1',
};

/** هوية كل بوابة — ألوانها الحاكمة (§2.2) ووصفها الرسمي */
const ROLE_WELCOME: Record<
  WelcomeRole,
  {
    home: string;
    label: string;
    hint: string;
    action: string;
    accent: string;
    accentSoft: string;
    ring: string;
    text: string;
  }
> = {
  STUDENT: {
    home: '/student',
    label: 'بوابة الطالب',
    hint: 'سجّل حضورك بمسح رمز المحاضرة، وتابع نسبتك ومقرراتك لحظة بلحظة.',
    action: 'ادخل لوحة الطالب',
    accent: '#3b82f6',
    accentSoft: 'rgba(99,102,241,0.12)',
    ring: 'focus-visible:ring-indigo-400',
    text: 'text-indigo-700',
  },
  PROFESSOR: {
    home: '/professor',
    label: 'بوابة الدكتور',
    hint: 'افتح محاضرة، واعرض رمز الحضور الدوراني، وتابع زمرة الزمرة من لوحتك.',
    action: 'ادخل لوحة الدكتور',
    accent: '#10b981',
    accentSoft: 'rgba(16,185,129,0.12)',
    ring: 'focus-visible:ring-emerald-400',
    text: 'text-emerald-700',
  },
  ADMIN: {
    home: '/admin',
    label: 'بوابة الأدمن',
    hint: 'هذه المفاتيح الرسمية للجداول والحسابات والحكامة — استعملها بحكمة تدبير.',
    action: 'ادخل لوحة الإدارة',
    accent: '#f59e0b',
    accentSoft: 'rgba(245,158,11,0.13)',
    ring: 'focus-visible:ring-amber-400',
    text: 'text-amber-700',
  },
};

function firstNameOf(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

/**
 * مودال الترحيب المعتمد على الجلسة: يُظهر «أهلًا بك في رقيب» مرة واحدة
 * لكل دور (مخزنة في localStorage)، مخصصًا بالاسم والفرقة والجروب والقسم.
 */
export function PortalWelcome({ active }: { active: boolean }) {
  const pathname = usePathname();
  const prefs = usePortalPrefs();
  const [user, setUser] = React.useState<MeUser | null>(null);
  const [open, setOpen] = React.useState(false);
  const probedRoutes = React.useRef(new Set<string>());

  const isAuthRoute =
    typeof pathname === 'string' &&
    (pathname.startsWith('/login') || pathname.startsWith('/register'));

  /* فحص الجلسة عند تغيّر المسار — مَرة لمسار واحد، وبأدق رفق */
  React.useEffect(() => {
    if (!active || !pathname || isAuthRoute) return;
    if (probedRoutes.current.has(pathname)) return;
    probedRoutes.current.add(pathname);
    let alive = true;
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((res) => (res.ok ? (res.json() as Promise<{ user?: MeUser }>) : null))
      .then((data) => {
        if (alive && data?.user?.id && data.user.name) setUser(data.user);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [active, pathname, isAuthRoute]);

  const role = (
    user?.role === 'STUDENT' || user?.role === 'PROFESSOR' || user?.role === 'ADMIN'
      ? user.role
      : null
  ) as WelcomeRole | null;

  /**
   * بموافقة إيقاع مُريح: الطالب الذي لم يُكمل تهيئة بوابته يُنتظر حتى
   * تُغلق نافذة التهيئة — فلا يتراخران على بعضهما.
   */
  const welcomeReady =
    active && role !== null && !isAuthRoute && (role !== 'STUDENT' || prefs.onboarded);

  React.useEffect(() => {
    if (!welcomeReady || !role) return;
    try {
      if (!window.localStorage.getItem(WELCOME_KEYS[role])) {
        setOpen(true);
      }
    } catch {
      /* وضع خصوصي — نُعرض الترحيب دون تخزين */
      setOpen(true);
    }
  }, [welcomeReady, role]);

  const dismiss = React.useCallback(() => {
    setOpen(false);
    if (!role) return;
    try {
      window.localStorage.setItem(WELCOME_KEYS[role], '1');
    } catch {
      /* لا مساحة — نُرضي المرة هذه فقط */
    }
  }, [role]);

  /* ترك لوحة صامتة قبل أي عرض نضّيف */
  if (!user || !role || isAuthRoute) return null;
  const meta = ROLE_WELCOME[role];

  const identityChips: { label: string; value: string }[] = [];
  const studentLevel = user.level || prefs.level;
  const studentGroup = user.group || prefs.group;
  const studentDept = user.department || prefs.major;
  if (role === 'STUDENT') {
    if (user.studentCode) identityChips.push({ label: 'الكود', value: user.studentCode });
    if (studentLevel) identityChips.push({ label: 'الفرقة', value: studentLevel });
    if (studentGroup) identityChips.push({ label: 'الجروب', value: studentGroup });
    if (studentDept) identityChips.push({ label: 'القسم', value: studentDept });
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="portal-welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[98] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`أهلًا بك في رقيب — ${meta.label}`}
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="إغلاق الترحيب"
            className="absolute inset-0 bg-[#0a0d17]/55 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 34, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 22, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`card-glow relative w-full max-w-md overflow-hidden rounded-3xl border border-[#C8A24B]/35 bg-[#0B1120]/95 p-7 text-center shadow-[0_44px_110px_-26px_rgba(0,0,0,0.95)] backdrop-blur-2xl ${meta.ring}`}
            style={{ borderColor: `${meta.accent}4d` }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full blur-3xl"
              style={{ backgroundColor: meta.accentSoft }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-14 h-52 w-52 rounded-full blur-3xl"
              style={{ backgroundColor: meta.accentSoft }}
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.25]" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-12 top-0 h-px"
              style={{ background: `linear-gradient(to left, transparent, ${meta.accent}99, transparent)` }}
            />

            <button
              type="button"
              onClick={dismiss}
              aria-label="إغلاق"
              className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[#94A3B8] transition hover:border-[#C8A24B]/35 hover:text-[#FAF6EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="relative">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <span
                  className="absolute inset-0 animate-pulse-ring rounded-full border"
                  style={{ borderColor: `${meta.accent}66` }}
                />
                <span
                  className="absolute inset-0 rounded-full blur-sm"
                  style={{ backgroundColor: meta.accentSoft }}
                />
                <motion.div
                  initial={{ scale: 0.7, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.12, duration: 0.6, type: 'spring', bounce: 0.45 }}
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C8A24B]/35 bg-[#090F19] text-[#E6CB78] shadow-[0_18px_44px_-20px_rgba(200,162,75,.4)]"
                >
                  <AcademicGateMark className="h-10 w-10" />
                </motion.div>
              </div>

              <span
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-bold"
                style={{ borderColor: `${meta.accent}59`, backgroundColor: meta.accentSoft, color: meta.accent }}
              >
                <ShieldCheck className="h-3 w-3" />
                {meta.label}
              </span>

              <h2 className="mt-3 font-display text-2xl font-extrabold text-[#FAF6EE]">
                أهلًا بك في رقيب،{' '}
                <span className="text-gold-gradient">{firstNameOf(user.name)}</span>
              </h2>
              <p className="mx-auto mt-2.5 max-w-sm text-[12px] leading-6 text-[#94A3B8]">
                {meta.hint}
              </p>

              {identityChips.length > 0 ? (
                <div className="mx-auto mt-5 flex max-w-sm flex-wrap items-center justify-center gap-2">
                  {identityChips.map((chip) => (
                    <span
                      key={chip.label + chip.value}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[10.5px] font-semibold text-[#FAF6EE]"
                    >
                      <span className="text-[#94A3B8]">{chip.label}:</span>
                      <span dir={chip.label === 'الكود' ? 'ltr' : undefined}>{chip.value}</span>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href={meta.home}
                  onClick={dismiss}
                  className="group flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-[12.5px] font-extrabold text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ backgroundColor: meta.accent, boxShadow: `0 16px 40px -14px ${meta.accent}a3` }}
                  dir="rtl"
                >
                  {meta.action}
                  <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                </Link>
                <button
                  type="button"
                  onClick={dismiss}
                  className={`flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-4 text-[12.5px] font-bold text-[#94A3B8] transition hover:-translate-y-0.5 hover:bg-white/[0.12] hover:text-[#FAF6EE] focus-visible:outline-none focus-visible:ring-2 ${meta.ring}`}
                  dir="rtl"
                >
                  تعرّفت — أكمِلوا
                </button>
              </div>

              <p className={`mt-4 flex items-center justify-center gap-1.5 text-[10px] font-medium ${meta.text}`}>
                <Sparkles className="h-3 w-3" />
                هذه الترحيبة تظهر أول مرة فقط — لن تُقلّقك في الزيارات القادمة.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
