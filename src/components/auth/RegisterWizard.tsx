'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Fingerprint,
  GraduationCap,
  Hash,
  Loader2,
  Mail,
  ShieldCheck,
  Phone,
  Sparkles,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { api } from '@/lib/api';
import { enrollPasskey, passkeySupported } from '@/lib/passkey-client';
import { cn } from '@/lib/utils';
import type { AuthUser, Gender } from '@/types';
import { AvatarUpload } from './AvatarUpload';
import type { PolicyTab } from './PolicyModal';
import {
  Field,
  PasswordInput,
  PasswordStrength,
  ValidatedInput,
} from './fields';

type RoleChoice = 'STUDENT' | 'PROFESSOR';

type FormState = {
  role: RoleChoice | '';
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  studentCode: string;
  gender: Gender | '';
  birthDate: string;
  avatarUrl: string;
  faceEnrolled: boolean;
  fingerprintEnrolled: boolean;
  acceptTerms: boolean;
};

const INITIAL: FormState = {
  role: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  studentCode: '',
  gender: '',
  birthDate: '',
  avatarUrl: '',
  faceEnrolled: false,
  fingerprintEnrolled: false,
  acceptTerms: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s\-()]{7,18}$/;

const STEP_META = [
  {
    title: 'نوع الحساب',
    heading: 'ابدأ بهويتك',
    sub: 'اختر نوع حسابك، وسنجهّز لك التجربة المناسبة.',
  },
  {
    title: 'بياناتك',
    heading: 'بياناتك الأساسية',
    sub: 'معلومات بسيطة، وبعدها حسابك جاهز.',
  },
  {
    title: 'التفضيلات',
    heading: 'لمسات أخيرة',
    sub: 'كل ما هنا اختياري إلا النوع والموافقة على الشروط.',
  },
];

function validateAll(form: FormState) {
  const errors: Record<string, string> = {};

  if (!form.role) errors.role = 'اختر نوع الحساب للمتابعة';
  if (form.name.trim().length < 3) errors.name = 'الاسم الكامل مطلوب (3 أحرف على الأقل)';
  if (form.role === 'STUDENT' && !form.email.trim()) {
    errors.email = 'البريد الإلكتروني مطلوب للطلاب';
  } else if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
    errors.email = 'البريد الإلكتروني غير صحيح';
  }
  if (!PHONE_RE.test(form.phone.trim())) errors.phone = 'أدخل رقم هاتف صحيح';
  if (form.password.length < 10) errors.password = 'كلمة المرور يجب أن تكون 10 أحرف على الأقل';
  else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
    errors.password = 'استخدم حرفًا ورقمًا على الأقل';
  }
  if (!form.confirm) errors.confirm = 'أكّد كلمة المرور';
  else if (form.confirm !== form.password) errors.confirm = 'كلمتا المرور غير متطابقتين';
  if (!form.gender) errors.gender = 'اختر النوع للمتابعة';
  if (form.birthDate) {
    const date = new Date(form.birthDate);
    if (Number.isNaN(date.getTime())) errors.birthDate = 'تاريخ الميلاد غير صحيح';
    else if (date.getTime() > Date.now()) errors.birthDate = 'تاريخ الميلاد لا يمكن أن يكون في المستقبل';
  }
  if (!form.acceptTerms) errors.acceptTerms = 'يجب الموافقة على الشروط وسياسة الخصوصية';
  return errors;
}

const STEP_FIELDS: string[][] = [
  ['role'],
  ['name', 'email', 'phone', 'password', 'confirm'],
  ['gender', 'birthDate', 'acceptTerms'],
];

export function RegisterWizard({ onPolicy }: { onPolicy: (tab: PolicyTab) => void }) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [step, setStep] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = React.useState<Record<number, boolean>>({});
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [createdUser, setCreatedUser] = React.useState<AuthUser | null>(null);
  // حسابات الدكاترة تُنشأ بحالة انتظار موافقة الإدارة
  const [pendingUser, setPendingUser] = React.useState<AuthUser | null>(null);

  const errors = validateAll(form);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const errorFor = (key: string) =>
    touched[key] || attempted[step] ? errors[key] : '';

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError('');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const next = () => {
    setAttempted((current) => ({ ...current, [step]: true }));
    if (STEP_FIELDS[step].some((field) => errors[field])) return;
    goTo(Math.min(2, step + 1));
  };

  const back = () => goTo(Math.max(0, step - 1));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    // Enter في الخطوات 1-2 → تكميلة للخطوة (سلاسة)، الخطوة 3 → تسجيل فعلي
    if (step < 2) {
      setAttempted((current) => ({ ...current, [step]: true }));
      if (!STEP_FIELDS[step].some((field) => errors[field])) {
        goTo(Math.min(2, step + 1));
      }
      return;
    }

    setAttempted({ 0: true, 1: true, 2: true });
    const current = validateAll(form);
    if (Object.keys(current).length) {
      const firstStep = STEP_FIELDS.findIndex((fields) =>
        fields.some((field) => current[field]),
      );
      if (firstStep >= 0 && firstStep !== step) goTo(firstStep);
      return;
    }
    if (uploading) {
      setError('انتظر انتهاء رفع الصورة أولًا');
      return;
    }

    setLoading(true);
    try {
      const data = await api<{ user: AuthUser; pending?: boolean }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            role: form.role,
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            confirmPassword: form.confirm,
            gender: form.gender,
            birthDate: form.birthDate,
            studentCode: form.studentCode,
            avatarUrl: form.avatarUrl,
            acceptTerms: true,
          }),
        },
      );
      if (data.pending) {
        // لا جلسة ولا تحويل: الحساب ينتظر موافقة الإدارة
        setPendingUser(data.user);
        setLoading(false);
        return;
      }
      setCreatedUser(data.user); // لحظة الترحيب — يدور قراراته: بصمة الآن أو الدخول
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  const percent = Math.round(((step + 1) / 3) * 100);

  // بصمة الجهاز اختيارية بعد إنشاء الطالب حسابه (الجلسة جاهزة هنا تلقائيًا)
  const [pkReady, setPkReady] = React.useState(false);
  const [pkBusy, setPkBusy] = React.useState(false);
  const [pkDone, setPkDone] = React.useState(false);
  const [pkErr, setPkErr] = React.useState('');
  React.useEffect(() => setPkReady(passkeySupported()), []);

  const enterDashboard = React.useCallback(() => {
    if (!createdUser) return;
    router.replace(createdUser.role === 'PROFESSOR' ? '/professor' : '/student');
    router.refresh();
  }, [createdUser, router]);

  async function passkeyEnroll() {
    setPkErr('');
    setPkBusy(true);
    try {
      const result = await enrollPasskey();
      if (result.ok) {
        setPkDone(true);
        window.setTimeout(enterDashboard, 900);
      }
    } catch (err) {
      setPkErr((err as Error).message);
    } finally {
      setPkBusy(false);
    }
  }

  // حساب دكتور جديد: ينتظر موافقة الإدارة (لا جلسة ولا تحويل تلقائي)
  if (pendingUser) {
    const firstName = pendingUser.name.split(' ')[0] || pendingUser.name;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-gold-600/20 bg-gradient-to-b from-white/85 to-white/60 p-8 text-center shadow-glass backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold-600/30 bg-gold-500/[0.12] shadow-[0_0_40px_-8px_rgba(200,162,75,0.4)]">
            <ShieldCheck className="h-7 w-7 text-gold-700" />
          </span>
          <h2 className="mt-4 font-display text-xl font-extrabold text-ink-950">
            تم استلام طلبك،{' '}
            <span className="text-gold-gradient">{firstName}</span>
          </h2>
          <p className="mt-2 text-[12px] leading-6 text-ink-500">
            حساب عضو هيئة التدريس يحتاج موافقة إدارة المنصة قبل التفعيل.
            سيتمكن حسابك من تسجيل الدخول بعد المراجعة.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign('/login')}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-brand-500/25 bg-brand-500/[0.07] px-5 text-sm font-extrabold text-brand-700 transition hover:bg-brand-500/[0.12]"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </motion.div>
    );
  }

  // لحظة الترحيب بعد إنشاء الحساب مباشرة
  if (createdUser) {
    const firstName = createdUser.name.split(' ')[0] || createdUser.name;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-b from-white/88 to-white/62 p-8 text-center shadow-glass backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-36 w-36 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="relative">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.55, type: 'spring', bounce: 0.45 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/[0.1] shadow-[0_0_40px_-8px_rgba(20,121,95,0.45)]"
          >
            <Check className="h-7 w-7 text-brand-700" />
          </motion.span>
          <h2 className="mt-4 font-display text-xl font-extrabold text-ink-950">
            أهلًا بك في رقيب،{' '}
            <span className="text-gold-gradient">{firstName}</span> 👑
          </h2>
          <p className="mt-2 text-[12px] leading-6 text-ink-500">
            حسابك جاهز ومحفوظ بأمان.
            {pkReady && !pkDone ? ' ولو حابب — سجّل بصمة جهازك دلوقتي، أو دوقت!' : ''}
          </p>
          <div className="mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-brand-900/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-brand-700 to-gold-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ originX: 0 }}
              transition={{ duration: 1.3, ease: 'easeInOut' }}
            />
          </div>

          {pkReady ? (
            <div className="mt-6 w-full px-1">
              {pkDone ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/[0.08] px-4 py-2 text-[11.5px] font-extrabold text-brand-700">
                  <Fingerprint className="h-4 w-4" />
                  بصمتك اتسجلت 🎉 جاري التحويل...
                </span>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={passkeyEnroll}
                    disabled={pkBusy}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#22736c]/30 bg-[#4db8ae]/12 px-4 text-[12.5px] font-extrabold text-[#14403d] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4db8ae]/22 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pkBusy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        لمس جهازك دلوقتي...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="h-4 w-4" />
                        سجّل بصمتك
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={enterDashboard}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1f19] px-4 text-[12.5px] font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#12312a]"
                  >
                    ادخل لوحتك
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {pkErr && !pkDone ? (
                <p role="alert" className="mt-2.5 text-[11px] leading-5 text-ember-600">
                  {pkErr}
                </p>
              ) : null}
              <p className="mt-3 text-[10px] leading-5 text-ink-400">
                بصمة الوجه أو الإصبع أو قفل الشاشة — بتدخّلك بدون كلمة مرور، والتحقق يحصل على جهازك فقط.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={enterDashboard}
              className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1f19] px-5 text-[12.5px] font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#12312a]"
            >
              ادخل لوحتك
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand-500/18 bg-brand-500/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-700">
            <Sparkles className="h-3 w-3" />
            JOIN RAQIB
          </div>
          <h2 className="font-display text-2xl font-extrabold text-ink-950">
            {STEP_META[step].heading}
          </h2>
          <p className="mt-1.5 text-[12px] leading-6 text-ink-500">
            {STEP_META[step].sub}
          </p>
        </div>
        <span className="mt-1 shrink-0 rounded-full border border-brand-900/10 bg-white/60 px-2.5 py-1 font-latin text-[10px] text-ink-400" dir="ltr">
          {step + 1} / 3
        </span>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          {STEP_META.map((meta, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <button
                key={meta.title}
                type="button"
                onClick={() => {
                  if (index < step) goTo(index);
                }}
                disabled={index > step}
                className={cn(
                  'flex items-center gap-1.5 text-[10px] font-semibold transition',
                  active && 'text-brand-700',
                  done && 'text-brand-600 hover:text-brand-700',
                  !active && !done && 'text-ink-300',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border text-[9px]',
                    active && 'border-brand-500/40 bg-brand-500/12 text-brand-700',
                    done && 'border-brand-500/30 bg-brand-500/10 text-brand-700',
                    !active && !done && 'border-brand-900/10 bg-white/55',
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{meta.title}</span>
              </button>
            );
          })}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-brand-900/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-brand-700 via-brand-500 to-gold-500"
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -22 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <RoleCard
                    active={form.role === 'STUDENT'}
                    icon={GraduationCap}
                    title="طالب"
                    subtitle="حضور، مقررات، وتقارير"
                    points={['مسح QR للحضور', 'متابعة نسبة الحضور']}
                    onClick={() => update('role', 'STUDENT')}
                  />
                  <RoleCard
                    active={form.role === 'PROFESSOR'}
                    icon={Stethoscope}
                    title="دكتور"
                    subtitle="محاضرات ورموز حضور"
                    points={['فتح محاضرة وتوليد QR', 'متابعة حضور الطلاب']}
                    onClick={() => update('role', 'PROFESSOR')}
                  />
                </div>
                {errorFor('role') ? (
                  <p className="flex items-center gap-1.5 text-[11px] text-ember-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errorFor('role')}
                  </p>
                ) : null}
                <div className="rounded-xl border border-brand-500/15 bg-brand-500/[0.05] px-3 py-2.5 text-[10.5px] leading-5 text-ink-500">
                  دكتور؟ بريدك الإلكتروني اختياري — يمكنك المتابعة برقم هاتفك
                  والاسم الكامل فقط.
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-3.5">
                <Field
                  label="الاسم الكامل"
                  htmlFor="reg-name"
                  error={errorFor('name')}
                  success={touched.name && !errors.name ? 'يبدو جيدًا' : ''}
                >
                  <ValidatedInput
                    id="reg-name"
                    icon={UserRound}
                    autoComplete="name"
                    placeholder="مثال: أحمد محمد علي"
                    value={form.name}
                    invalid={Boolean(errorFor('name'))}
                    valid={Boolean(touched.name && !errors.name)}
                    onChange={(event) => update('name', event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                  />
                </Field>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field
                    label="البريد الإلكتروني"
                    htmlFor="reg-email"
                    optional={form.role === 'PROFESSOR'}
                    error={errorFor('email')}
                    success={touched.email && !errors.email && form.email ? 'صحيح' : ''}
                    hint={
                      form.role === 'PROFESSOR'
                        ? 'اختياري — لاستقبال إشعارات المنصة'
                        : undefined
                    }
                  >
                    <ValidatedInput
                      id="reg-email"
                      type="email"
                      icon={Mail}
                      dir="ltr"
                      className="text-left"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={form.email}
                      invalid={Boolean(errorFor('email'))}
                      valid={Boolean(touched.email && !errors.email && form.email)}
                      onChange={(event) => update('email', event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                    />
                  </Field>

                  <Field
                    label="رقم الهاتف"
                    htmlFor="reg-phone"
                    error={errorFor('phone')}
                    success={touched.phone && !errors.phone ? 'صحيح' : ''}
                  >
                    <ValidatedInput
                      id="reg-phone"
                      type="tel"
                      icon={Phone}
                      dir="ltr"
                      className="text-left"
                      autoComplete="tel"
                      placeholder="01xxxxxxxxx"
                      value={form.phone}
                      invalid={Boolean(errorFor('phone'))}
                      valid={Boolean(touched.phone && !errors.phone)}
                      onChange={(event) => update('phone', event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
                    />
                  </Field>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field
                    label="كلمة المرور"
                    htmlFor="reg-password"
                    error={errorFor('password')}
                  >
                    <PasswordInput
                      id="reg-password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={form.password}
                      invalid={Boolean(errorFor('password'))}
                      onChange={(event) => update('password', event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                    />
                  </Field>

                  <Field
                    label="تأكيد كلمة المرور"
                    htmlFor="reg-confirm"
                    error={errorFor('confirm')}
                    success={
                      form.confirm && form.confirm === form.password
                        ? 'متطابقتان'
                        : ''
                    }
                  >
                    <PasswordInput
                      id="reg-confirm"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={form.confirm}
                      invalid={Boolean(errorFor('confirm'))}
                      valid={Boolean(form.confirm && form.confirm === form.password)}
                      onChange={(event) => update('confirm', event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, confirm: true }))}
                    />
                  </Field>
                </div>
                <PasswordStrength value={form.password} />

                {form.role === 'STUDENT' ? (
                  <Field
                    label="الرقم الجامعي"
                    htmlFor="reg-student-code"
                    optional
                    hint="يمكنك إضافته لاحقًا أو تركه فارغًا"
                  >
                    <ValidatedInput
                      id="reg-student-code"
                      icon={Hash}
                      dir="ltr"
                      className="text-left"
                      placeholder="2024001"
                      value={form.studentCode}
                      onChange={(event) => update('studentCode', event.target.value)}
                    />
                  </Field>
                ) : null}

                <Field label="الصورة الشخصية" htmlFor="reg-avatar" optional>
                  <AvatarUpload
                    value={form.avatarUrl}
                    onChange={(url) => update('avatarUrl', url)}
                    onBusy={setUploading}
                  />
                </Field>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field
                    label="تاريخ الميلاد"
                    htmlFor="reg-birth"
                    optional
                    error={errorFor('birthDate')}
                    hint="يساعدنا في تخصيص تجربتك"
                  >
                    <ValidatedInput
                      id="reg-birth"
                      type="date"
                      icon={CalendarDays}
                      dir="ltr"
                      className="text-left"
                      max={new Date().toISOString().slice(0, 10)}
                      value={form.birthDate}
                      invalid={Boolean(errorFor('birthDate'))}
                      onChange={(event) => update('birthDate', event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, birthDate: true }))}
                    />
                  </Field>

                  <Field label="النوع" htmlFor="reg-gender" error={errorFor('gender')}>
                    <div id="reg-gender" className="grid grid-cols-3 gap-1.5">
                      {[
                        { value: 'MALE', label: 'ذكر' },
                        { value: 'FEMALE', label: 'أنثى' },
                        { value: 'UNDISCLOSED', label: 'أفضل عدم الذكر' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => update('gender', option.value as Gender)}
                          className={cn(
                            'rounded-xl border px-2 py-2 text-[10.5px] font-semibold transition',
                            form.gender === option.value
                              ? 'border-brand-500/45 bg-brand-500/12 text-brand-700'
                              : 'border-brand-900/10 bg-white/60 text-ink-400 hover:border-brand-500/25 hover:text-ink-800',
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#22736c]/25 bg-[#4db8ae]/[0.08] px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#22736c]/30 bg-[#8fd6cf]/25 text-[#14403d]">
                    <Fingerprint className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11.5px] font-semibold text-ink-800">
                      بصمة الجهاز (Passkey)
                    </span>
                    <span className="block text-[9.5px] leading-5 text-ink-400">
                      بصمة إصبعك أو وجهك أو قفل شاشة الموبايل — بتتفعّل بعد إنشاء
                      الحساب مباشرة (اختياري) وبتدخّلك بدون كلمة مرور. لا نجمع أي
                      بيانات بيومترية — التأكيد يحصل على جهازك كإشارة موقعة فقط.
                    </span>
                  </span>
                </div>

                <div>
                  <div
                    role="checkbox"
                    tabIndex={0}
                    aria-checked={form.acceptTerms}
                    onClick={() => update('acceptTerms', !form.acceptTerms)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        update('acceptTerms', !form.acceptTerms);
                      }
                    }}
                    className="flex w-full cursor-pointer items-start gap-2.5 rounded-xl border border-brand-900/10 bg-white/60 px-3 py-3 text-right transition hover:border-brand-500/25"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition',
                        form.acceptTerms
                          ? 'border-brand-600 bg-brand-600 text-cream'
                          : 'border-brand-900/15 bg-white/70',
                      )}
                    >
                      {form.acceptTerms ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="text-[11px] leading-5 text-ink-500">
                      أوافق على{' '}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onPolicy('terms');
                        }}
                        className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                      >
                        الشروط والأحكام
                      </button>{' '}
                      و{' '}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onPolicy('privacy');
                        }}
                        className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                      >
                        سياسة الخصوصية
                      </button>
                      ، وأؤكد صحة بياناتي.
                    </span>
                  </div>
                  {errorFor('acceptTerms') ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ember-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errorFor('acceptTerms')}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-start gap-2 rounded-xl border border-ember-500/25 bg-ember-500/[0.07] px-3 py-2.5 text-[11.5px] leading-5 text-ember-600"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        ) : null}

        <div className="mt-5 flex items-center gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              disabled={loading}
              className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-brand-900/10 bg-white/60 px-4 text-xs font-semibold text-ink-500 transition hover:border-brand-500/25 hover:text-ink-900 disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" />
              رجوع
            </button>
          ) : null}

          {step < 2 ? (
            <button
              type="button"
              onClick={next}
              className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] text-sm font-extrabold text-[#1c1503] shadow-[0_16px_40px_-14px_rgba(200,162,75,.6)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-12px_rgba(20,121,95,0.65)]"
            >
              متابعة
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] text-sm font-extrabold text-[#1c1503] shadow-[0_16px_40px_-14px_rgba(200,162,75,.6)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-12px_rgba(20,121,95,0.65)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ إنشاء الحساب...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  إنشاء الحساب
                </>
              )}
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-ink-400">
        <CheckCircle2 className="h-3 w-3 text-gold-600" />
        بياناتك محمية ومشفّرة · يمكنك حذف حسابك في أي وقت
      </div>
    </div>
  );
}

function RoleCard({
  active,
  icon: Icon,
  title,
  subtitle,
  points,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  points: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-3.5 text-right transition duration-300',
        active
          ? 'border-brand-500/45 bg-brand-500/[0.07] shadow-gold-soft'
          : 'border-brand-900/10 bg-white/55 hover:border-brand-500/25 hover:bg-white/80',
      )}
      aria-pressed={active}
    >
      <div
        className={cn(
          'absolute -left-6 -top-6 h-20 w-20 rounded-full blur-2xl transition',
          active ? 'bg-brand-500/20' : 'bg-brand-500/0 group-hover:bg-brand-500/10',
        )}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl border transition',
            active
              ? 'border-brand-500/35 bg-brand-500/12 text-brand-700'
              : 'border-brand-900/10 bg-white/70 text-ink-400',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border transition',
            active
              ? 'border-brand-600/60 bg-brand-600 text-cream'
              : 'border-brand-900/15 bg-white/70 text-transparent',
          )}
        >
          <Check className="h-3 w-3" />
        </span>
      </div>
      <p className="relative mt-3 font-display text-sm font-bold text-ink-950">{title}</p>
      <p className="relative text-[10px] text-ink-400">{subtitle}</p>
      <ul className="relative mt-2 space-y-1">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-1 text-[9.5px] text-ink-500">
            <span className="h-1 w-1 rounded-full bg-brand-500/60" />
            {point}
          </li>
        ))}
      </ul>
    </button>
  );
}
