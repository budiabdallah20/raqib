'use client';
import { useAuthCopy } from './auth-copy';

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
import { DEPARTMENT } from '@/lib/constants';
import { enrollPasskey, passkeySupported } from '@/lib/passkey-client';
import { setPortalPrefs } from '@/lib/portal-prefs';
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
  level: string;
  group: 'A' | 'B' | '';
  department: string;
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
  level: '',
  group: '',
  department: '',
  gender: '',
  birthDate: '',
  avatarUrl: '',
  faceEnrolled: false,
  fingerprintEnrolled: false,
  acceptTerms: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * موبايل مصري من 11 رقمًا (يبدأ بـ 01) — نفس قاعدة السيرفر حرفيًا.
 * نمسح فواصل الإدخال وتسقط مقدمة +20 إن حضرت.
 */
export const normalizeMobile = (value: string) =>
  value.trim().replace(/[\s\-()]/g, '').replace(/^\+?20(?=1[0125])/, '');

const MOBILE_RE = /^01[0125][0-9]{8}$/;

/** درجات الفرقة الأربع — نفس نظام الجدول الرسمي (نصية متسقة مع القاعدة) */
const LEVELS: { value: string; label: string }[] = [
  { value: '1', label: 'الفرقة الأولى' },
  { value: '2', label: 'الفرقة الثانية' },
  { value: '3', label: 'الفرقة الثالثة' },
  { value: '4', label: 'الفرقة الرابعة' },
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
  if (!form.phone.trim()) {
    errors.phone = 'رقم الموبايل مطلوب';
  } else if (!MOBILE_RE.test(normalizeMobile(form.phone))) {
    errors.phone = 'رقم الموبايل يجب أن يكون 11 رقمًا ويبدأ بـ 01 — مثل 01012345678';
  }
  if (form.password.length < 10) errors.password = 'كلمة المرور يجب أن تكون 10 أحرف على الأقل';
  else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
    errors.password = 'استخدم حرفًا ورقمًا على الأقل';
  }
  if (!form.confirm) errors.confirm = 'أكّد كلمة المرور';
  else if (form.confirm !== form.password) errors.confirm = 'كلمتا المرور غير متطابقتين';
  if (!form.gender) errors.gender = 'اختر النوع للمتابعة';
  if (form.role === 'STUDENT') {
    if (!form.level) errors.level = 'اختر الفرقة للمتابعة';
    if (!form.group) errors.group = 'اختر الجروب: A أو B';
    if (!form.department.trim()) errors.department = 'اختر القسم الأكاديمي';
  }
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

/**
 * حقول كل خطوة حسب الدور: الطالب يواصل خطوة ثالثة موسّعة
 * ببيانات تموضعه الأكاديمي (الفرقة/الجروب/القسم).
 */
function stepFields(step: number, role: FormState['role']): string[] {
  const fields = [...(STEP_FIELDS[step] ?? [])];
  if (step === STEP_FIELDS.length - 1 && role === 'STUDENT') {
    fields.push('level', 'group', 'department');
  }
  return fields;
}

export function RegisterWizard({ onPolicy, initialRole }: { onPolicy: (tab: PolicyTab) => void; initialRole?: RoleChoice }) {
  const tr = useAuthCopy();
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(() => ({ ...INITIAL, role: initialRole ?? '' }));
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
    touched[key] || attempted[step] ? tr(errors[key] || '') : '';

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError('');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // أقسام حية من القاعدة عبر /api/public/metrics — وصاحبها ثابت احتياطي أنيق
  const [departments, setDepartments] = React.useState<string[]>([]);

  /* حماية من البوتات — بلا أي تأثير على تجربة الإنسان:
     honeypot حقل مخفي لا يراه الإنسان، وروبوتات التعبئة الآلية تملؤه.
     وmountedAtRef يقيس زمن التعبئة الفعلي (الروبوت يُرسل في أجزاء من الثانية). */
  const [honeypot, setHoneypot] = React.useState('');
  const mountedAtRef = React.useRef(Date.now());

  // القسم يُختار من أقسام حية من القاعدة — وإن لم تصل فقسم الكلية الاعتمادي يُختم الباب فيه
  const departmentOptions = (departments.length ? departments : [DEPARTMENT]).map(
    (name) => ({ value: name, label: name }),
  );

  React.useEffect(() => {
    let alive = true;
    api<{ departments?: string[] }>('/api/public/metrics')
      .then((data) => {
        if (!alive) return;
        const list = (data.departments ?? []).filter(
          (name) => typeof name === 'string' && name.trim().length > 1,
        );
        setDepartments(list.slice(0, 12));
      })
      .catch(() => {
        /* القاعدة مغمضة — ثابت DEPARTMENT يكسي الموضع */
      });
    return () => {
      alive = false;
    };
  }, []);

  const stepErrorFields = stepFields(step, form.role);

  const next = () => {
    setAttempted((current) => ({ ...current, [step]: true }));
    if (stepErrorFields.some((field) => errors[field])) return;
    goTo(Math.min(2, step + 1));
  };

  const back = () => goTo(Math.max(0, step - 1));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    // Enter في الخطوتين 1-2 → تكميل للخطوة التالية (سلاسة)، الخطوة 3 → تسجيل فعلي
    if (step < 2) {
      setAttempted((current) => ({ ...current, [step]: true }));
      if (!stepErrorFields.some((field) => errors[field])) {
        goTo(Math.min(2, step + 1));
      }
      return;
    }

    setAttempted({ 0: true, 1: true, 2: true });
    const current = validateAll(form);
    if (Object.keys(current).length) {
      let firstStep = -1;
      for (let index = 0; index < STEP_FIELDS.length; index += 1) {
        const fields = stepFields(index, form.role);
        if (fields.some((field) => current[field])) {
          firstStep = index;
          break;
        }
      }
      if (firstStep >= 0 && firstStep !== step) goTo(firstStep);
      return;
    }
    if (uploading) {
      setError(tr("انتظر انتهاء رفع الصورة أولًا"));
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
            // بيانات الطالب الأكاديمية — موثّقة في السجل وتغذي بوابة الطالب
            ...(form.role === 'STUDENT'
              ? {
                  level: form.level,
                  group: form.group,
                  department: form.department,
                }
              : {}),
            avatarUrl: form.avatarUrl,
            acceptTerms: true,
            // حماية من البوتات: حقل الفخ + زمن التعبئة الفعلي
            website: honeypot,
            elapsedMs: Date.now() - mountedAtRef.current,
          }),
        },
      );
      if (data.pending) {
        // لا جلسة ولا تحويل: الحساب ينتظر موافقة الإدارة
        setPendingUser(data.user);
        setLoading(false);
        return;
      }
      // الطالب يخرج من التهيئة فورًا: بوابته تختصر الأسئلة المكررة
      if (data.user.role === 'STUDENT') {
        setPortalPrefs({
          level: form.level,
          group: form.group,
          major: form.department,
          onboarded: true,
        });
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
        className="relative overflow-hidden rounded-2xl border border-gold-600/20 bg-gradient-to-b from-[#241019]/95 to-[#180B12]/90 p-8 text-center shadow-glass backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#FF914D]/40 bg-[#FF914D]/[0.15] shadow-[0_0_40px_-8px_rgba(255,145,77,0.4)]">
            <ShieldCheck className="h-7 w-7 text-[#FFB45C]" />
          </span>
          <h2 className="mt-4 font-display text-xl font-extrabold text-[#F8F5F2]">
            {tr("تم استلام طلبك،")}{' '}
            <span className="text-gold-gradient">{firstName}</span>
          </h2>
          <p className="mt-2 text-[12px] leading-6 text-[#a89aa2]">
            {tr("حساب عضو هيئة التدريس يحتاج موافقة إدارة المنصة قبل التفعيل.\n            سيتمكن حسابك من تسجيل الدخول بعد المراجعة.")}</p>
          <button
            type="button"
            onClick={() => window.location.assign('/login')}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-[#FF914D]/35 bg-[#FF914D]/[0.10] px-5 text-sm font-extrabold text-[#FFB45C] transition hover:bg-[#FF914D]/[0.18]"
          >
            {tr("العودة لتسجيل الدخول")}</button>
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
        className="relative overflow-hidden rounded-2xl border border-[#FF914D]/30 bg-[#221016]/95 p-8 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-[#F5B46B]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 h-36 w-36 rounded-full bg-[#FF914D]/15 blur-3xl" />
        <div className="relative">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.55, type: 'spring', bounce: 0.45 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#F5B46B]/40 bg-[#F5B46B]/[0.12] text-[#F5B46B] shadow-[0_0_40px_-8px_rgba(245,180,107,0.45)]"
          >
            <Check className="h-7 w-7 text-[#F5B46B]" />
          </motion.span>
          <h2 className="mt-4 font-display text-xl font-extrabold text-[#F8F5F2]">
            {tr("أهلًا بك في رقيب،")}{' '}
            <span className="text-gold-gradient">{firstName}</span> 👑
          </h2>
          <p className="mt-2 text-[12px] leading-6 text-[#a89aa2]">
            {tr("حسابك جاهز ومحفوظ بأمان.")}{pkReady && !pkDone ? ' إن شئت سجّل بصمة جهازك الآن، أو انتقل مباشرة إلى بوابتك.' : ''}
          </p>
          <div className="mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-[#F5B46B] to-[#FFB45C]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ originX: 0 }}
              transition={{ duration: 1.3, ease: 'easeInOut' }}
            />
          </div>

          {pkReady ? (
            <div className="mt-6 w-full px-1">
              {pkDone ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#F5B46B]/30 bg-[#F5B46B]/[0.12] px-4 py-2 text-[11.5px] font-extrabold text-[#F5B46B]">
                  <Fingerprint className="h-4 w-4" />
                  {tr("بصمة جهازك جاهزة 🎉 جارٍ التحويل...")}</span>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={passkeyEnroll}
                    disabled={pkBusy}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#F5B46B]/30 bg-[#F5B46B]/[0.12] px-4 text-[12.5px] font-extrabold text-[#F5B46B] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F5B46B]/[0.2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pkBusy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {tr("بانتظار لمسة جهازك...")}</>
                    ) : (
                      <>
                        <Fingerprint className="h-4 w-4" />
                        {tr("سجّل بصمتك")}</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={enterDashboard}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#842441,#FF914D_55%,#F5B46B)] px-4 text-[12.5px] font-extrabold text-[#1a0c10] shadow-[0_12px_30px_-10px_rgba(255,145,77,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
                  >
                    {tr("الدخول إلى بوابتك")}<ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {pkErr && !pkDone ? (
                <p role="alert" className="mt-2.5 text-[11px] leading-5 text-ember-400">
                  {pkErr}
                </p>
              ) : null}
              <p className="mt-3 text-[10px] leading-5 text-[#a89aa2]">
                {tr("بصمة الوجه أو الإصبع أو قفل الشاشة تفتح لك البوابة دون كلمة مرور، ولا يجوز التحقق إلا على جهازك وحدَه.")}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={enterDashboard}
              className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#842441,#FF914D_55%,#F5B46B)] px-5 text-[12.5px] font-extrabold text-[#1a0c10] shadow-[0_12px_30px_-10px_rgba(255,145,77,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              {tr("الدخول إلى بوابتك")}<ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Build staircase steps for the external component
  const staircaseSteps = [
    {
      number: 1,
      label: tr("نوع الحساب"),
      description: tr("اختر نوع حسابك، وسنجهّز لك التجربة المناسبة."),
      illuminated: step === 0,
      content: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <RoleCard
              active={form.role === 'STUDENT'}
              icon={GraduationCap}
              title={tr("طالب")}
              subtitle={tr("حضور، مقررات، وتقارير")}
              points={[tr("مسح QR للحضور"), tr("متابعة نسبة الحضور")]}
              onClick={() => update('role', 'STUDENT')}
            />
            <RoleCard
              active={form.role === 'PROFESSOR'}
              icon={Stethoscope}
              title={tr("دكتور")}
              subtitle={tr("محاضرات ورموز حضور")}
              points={[tr("فتح محاضرة وتوليد QR"), tr("متابعة حضور الطلاب")]}
              onClick={() => update('role', 'PROFESSOR')}
            />
          </div>
          {errorFor('role') ? (
            <p className="flex items-center gap-1.5 text-[11px] text-ember-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {errorFor('role')}
            </p>
          ) : null}
          <div className="rounded-xl border border-[#F28C28]/25 bg-[#F28C28]/[0.07] px-3 py-2.5 text-[10.5px] leading-5 text-[#FFB45C]">
            {tr("دكتور؟ بريدك الإلكتروني اختياري — يمكنك المتابعة برقم هاتفك\n            والاسم الكامل فقط.")}</div>
        </div>
      ),
    },
    {
      number: 2,
      label: tr("بياناتك"),
      description: tr("معلومات بسيطة، وبعدها حسابك جاهز."),
      illuminated: step === 1,
      content: (
        <div className="space-y-4">
          <Field
            label={tr("الاسم الكامل")}
            htmlFor="reg-name"
            error={errorFor('name')}
            success={touched.name && !errors.name ? tr("يبدو جيدًا") : ''}
          >
            <ValidatedInput
              id="reg-name"
              icon={UserRound}
              autoComplete="name"
              placeholder={tr("مثال: أحمد محمد علي")}
              value={form.name}
              invalid={Boolean(errorFor('name'))}
              valid={Boolean(touched.name && !errors.name)}
              onChange={(event) => update('name', event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, name: true }))}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={tr("البريد الإلكتروني")}
              htmlFor="reg-email"
              optional={form.role === 'PROFESSOR'}
              error={errorFor('email')}
              success={touched.email && !errors.email && form.email ? tr("صحيح") : ''}
              hint={
                form.role === 'PROFESSOR'
                  ? tr("اختياري — لاستقبال إشعارات المنصة")
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
              label={tr("رقم الهاتف")}
              htmlFor="reg-phone"
              error={errorFor('phone')}
              success={touched.phone && !errors.phone ? tr("صحيح") : ''}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={tr("كلمة المرور")}
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
              label={tr("تأكيد كلمة المرور")}
              htmlFor="reg-confirm"
              error={errorFor('confirm')}
              success={
                form.confirm && form.confirm === form.password
                  ? tr("متطابقتان")
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
            <Field label={tr("الرقم الجامعي")} htmlFor="reg-student-code" optional hint={tr("يمكنك إضافته لاحقًا أو تركه فارغًا")}>
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

          <Field label={tr("الصورة الشخصية")} htmlFor="reg-avatar" optional>
            <AvatarUpload
              value={form.avatarUrl}
              onChange={(url) => update('avatarUrl', url)}
              onBusy={setUploading}
            />
          </Field>
        </div>
      ),
    },
    {
      number: 3,
      label: tr("التفضيلات"),
      description: tr("كل ما هنا اختياري إلا النوع والموافقة على الشروط."),
      illuminated: step === 2,
      content: (
        <div className="space-y-5">
          {form.role === 'STUDENT' ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#F28C28]/40 bg-[#F28C28]/[0.12]">
                  <GraduationCap className="h-3.5 w-3.5 text-[#FFB45C]" />
                </span>
                <span className="text-[11.5px] font-extrabold text-[#F8F5F2]">
                  {tr("تموضعك الأكاديمي في كلية العلوم")}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={tr("الفرقة")} error={errorFor('level')}>
                  <div
                    role="radiogroup"
                    aria-label={tr("اختيار الفرقة")}
                    className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"
                  >
                    {LEVELS.map((option) => (
                      <ChipOption
                        key={option.value}
                        selected={form.level === option.value}
                        onClick={() => {
                          update('level', option.value);
                          setTouched((current) => ({ ...current, level: true }));
                        }}
                      >
                        {tr(option.label)}
                      </ChipOption>
                    ))}
                  </div>
                </Field>

                <Field label={tr("الجروب")} error={errorFor('group')}>
                  <div
                    role="radiogroup"
                    aria-label={tr("اختيار الجروب")}
                    className="grid grid-cols-2 gap-1.5"
                  >
                    {[{ value: 'A' as const }, { value: 'B' as const }].map((option) => (
                      <ChipOption
                        key={option.value}
                        selected={form.group === option.value}
                        onClick={() => {
                          update('group', option.value);
                          setTouched((current) => ({ ...current, group: true }));
                        }}
                        dir="ltr"
                      >
                        {tr("جروب")}{option.value}
                      </ChipOption>
                    ))}
                  </div>
                </Field>
              </div>

              <Field
                label={tr("القسم الأكاديمي")}
                error={errorFor('department')}
                hint={
                  departments.length
                    ? tr("أقسام مقروءة حيًّا من مقررات المنصة المسجَّلة")
                    : undefined
                }
              >
                <div
                  role="radiogroup"
                  aria-label={tr("اختيار القسم الأكاديمي")}
                  className="flex flex-wrap gap-1.5"
                >
                  {departmentOptions.map((option) => (
                    <ChipOption
                      key={option.value}
                      selected={form.department === option.value}
                      onClick={() => {
                        update('department', option.value);
                        setTouched((current) => ({ ...current, department: true }));
                      }}
                    >
                      {tr(option.label)}
                    </ChipOption>
                  ))}
                </div>
              </Field>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={tr("تاريخ الميلاد")}
              htmlFor="reg-birth"
              optional
              error={errorFor('birthDate')}
              hint={tr("يساعدنا في تخصيص تجربتك")}
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

            <Field label={tr("النوع")} htmlFor="reg-gender" error={errorFor('gender')}>
              <div id="reg-gender" className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'MALE', label: tr("ذكر") },
                  { value: 'FEMALE', label: tr("أنثى") },
                  { value: 'UNDISCLOSED', label: tr("أفضل عدم الذكر") },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update('gender', option.value as Gender)}
                    className={cn(
                      'rounded-xl border px-2 py-2 text-[10.5px] font-semibold transition',
                      form.gender === option.value
                        ? 'border-[#F28C28]/50 bg-[#F28C28]/[0.14] text-[#FFB45C] shadow-[0_0_20px_-8px_rgba(242,140,40,0.5)]'
                        : 'border-white/10 bg-white/[0.05] text-[#a89aa2] hover:border-[#F28C28]/30 hover:text-[#F8F5F2]',
                    )}
                  >
                    {tr(option.label)}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#F5B46B]/25 bg-[#F5B46B]/[0.07] px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#F5B46B]/30 bg-[#F5B46B]/[0.12] text-[#F5B46B]">
              <Fingerprint className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11.5px] font-semibold text-[#F8F5F2]">
                {tr("بصمة الجهاز (Passkey)")}</span>
              <span className="block text-[9.5px] leading-5 text-[#a89aa2]">
                {tr("بصمة إصبعك أو وجهك أو قفل شاشة هاتفك — تُفعَّل فور إنشاء\n                الحساب (اختياري) وتدخّلك دون كلمة مرور. لا نجمَع أي بيانات\n                بيومترية — تأكيد التحقق يصل من جهازك كإشارة موقعة فحسب.")}</span>
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
              className="flex w-full cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-right transition hover:border-[#F28C28]/35"
            >
              <span
                className={cn(
                  'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition',
                  form.acceptTerms
                    ? 'border-[#F28C28] bg-[#F28C28] text-[#180B12]'
                    : 'border-white/20 bg-white/[0.06]',
                )}
              >
                {form.acceptTerms ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="text-[11px] leading-5 text-[#a89aa2]">
                {tr("أوافق على")}{' '}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPolicy('terms');
                  }}
                  className="font-semibold text-[#FFB45C] underline-offset-2 hover:underline"
                >
                  {tr("الشروط والأحكام")}</button>{' '}
                {tr("و")}{' '}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPolicy('privacy');
                  }}
                  className="font-semibold text-[#FFB45C] underline-offset-2 hover:underline"
                >
                  {tr("سياسة الخصوصية")}</button>
                {tr("، وأؤكد صحة بياناتي.")}</span>
            </div>
            {errorFor('acceptTerms') ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ember-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {errorFor('acceptTerms')}
              </p>
            ) : null}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#FFB45C]/25 bg-[#FFB45C]/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFB45C]">
            <Sparkles className="h-3 w-3" />
            JOIN RAQIB
          </div>
          <h2 className="font-display text-2xl font-black text-[#F8F5F2]">
            {[tr("نوع الحساب"), tr("بياناتك"), tr("التفضيلات")][step]}
          </h2>
          <p className="mt-1.5 text-[12px] leading-6 text-[#a89aa2]">
            {step === 2 && form.role === 'STUDENT'
              ? tr("فرقتك وجروبك وقسمك تُخصّصان بوابتك، والنوع والموافقة تكمِلان تسجيلك.")
              : [tr("اختر نوع حسابك، وسنجهّز لك التجربة المناسبة."), tr("معلومات بسيطة، وبعدها حسابك جاهز."), tr("كل ما هنا اختياري إلا النوع والموافقة على الشروط.")][step]}
          </p>
        </div>
        <span className="mt-1 shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-latin text-[10px] text-[#a89aa2]" dir="ltr">
          {step + 1} / 3
        </span>
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          {[tr("نوع الحساب"), tr("بياناتك"), tr("التفضيلات")].map((meta, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <button
                key={meta}
                type="button"
                onClick={() => {
                  if (index < step) goTo(index);
                }}
                disabled={index > step}
                className={cn(
                  'flex items-center gap-1.5 text-[10px] font-semibold transition min-h-[44px]',
                  active && 'text-[#FFB45C]',
                  done && 'text-[#F5B46B] hover:text-[#F5B46B]',
                  !active && !done && 'text-[#a89aa2]/60',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border text-[9px]',
                    active && 'border-[#F28C28]/45 bg-[#F28C28]/[0.12] text-[#FFB45C]',
                    done && 'border-[#F5B46B]/35 bg-[#F5B46B]/[0.10] text-[#F5B46B]',
                    !active && !done && 'border-white/10 bg-white/[0.06] text-[#a89aa2]',
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{meta}</span>
              </button>
            );
          })}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-[#F5B46B] via-[#FF914D] to-[#FFB45C]"
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        {/* honeypot — مخفي تمامًا عن الإنسان (CSS) وعن قارئات الشاشة */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
          <label htmlFor="reg-website">Website</label>
          <input
            id="reg-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <section key={step} className="p2-registration-step" aria-label={staircaseSteps[step].label}>
            <h3>{staircaseSteps[step].label}</h3>
            <p>{staircaseSteps[step].description}</p>
            {staircaseSteps[step].content}
          </section>
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

        <div className="mt-6 flex items-center gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              disabled={loading}
              className="btn-ghost flex h-11 items-center justify-center gap-1.5 rounded-xl transition hover:border-[#F28C28]/35 hover:text-[#F8F5F2] disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" />
              {tr("رجوع")}</button>
          ) : null}

          {step < 2 ? (
            <button
              type="button"
              onClick={next}
              className="btn-primary group flex h-11 flex-1 items-center justify-center gap-2 rounded-xl transition-all duration-500 hover:-translate-y-0.5"
            >
              {tr("متابعة")}<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary group flex h-11 flex-1 items-center justify-center gap-2 rounded-xl transition-all duration-500 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tr("جارٍ إنشاء الحساب...")}</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {tr("إنشاء الحساب")}</>
              )}
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-[#a89aa2]">
        <CheckCircle2 className="h-3 w-3 text-[#FFB45C]" />
        {tr("بياناتك محمية ومشفّرة · يمكنك حذف حسابك في أي وقت")}</div>
    </div>
  );
}

function ChipOption({
  selected,
  onClick,
  children,
  dir,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dir?: 'ltr' | 'rtl';
}) {
  const tr = useAuthCopy();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      dir={dir}
      className={cn(
        'flex min-h-[44px] items-center justify-center gap-1 rounded-xl border px-3 py-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 focus-visible:ring-offset-[#221016]',
        selected
          ? 'border-[#F28C28]/50 bg-[#F28C28]/[0.12] text-[#FFB45C] shadow-[0_0_24px_-8px_rgba(242,140,40,.5)]'
          : 'border-white/10 bg-white/[0.05] text-[#a89aa2] hover:border-[#F28C28]/30 hover:bg-white/[0.08] hover:text-[#F8F5F2]',
      )}
    >
      {selected ? <Check className="h-3 w-3 shrink-0" /> : null}
      <span className="truncate">{children}</span>
    </button>
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
  const tr = useAuthCopy();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-4 text-right transition duration-300 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]',
        active
          ? 'border-[#F28C28]/50 bg-[#F28C28]/[0.08] shadow-[0_0_32px_-10px_rgba(242,140,40,.55)]'
          : 'border-white/10 bg-white/[0.04] hover:border-[#F28C28]/30 hover:bg-white/[0.07]',
      )}
      aria-pressed={active}
    >
      <div
        className={cn(
          'absolute -left-6 -top-6 h-20 w-20 rounded-full blur-2xl transition',
          active ? 'bg-[#F28C28]/[0.18]' : 'bg-transparent group-hover:bg-[#F28C28]/[0.08]',
        )}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl border transition',
            active
              ? 'border-[#F28C28]/40 bg-[#F28C28]/[0.12] text-[#FFB45C]'
              : 'border-white/10 bg-white/[0.06] text-[#a89aa2]',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border transition',
            active
              ? 'border-[#F28C28] bg-[#F28C28] text-[#180B12]'
              : 'border-white/15 bg-white/[0.06] text-transparent',
          )}
        >
          <Check className="h-3 w-3" />
        </span>
      </div>
      <p className="relative mt-3 font-display text-sm font-bold text-[#F8F5F2]">{title}</p>
      <p className="relative text-[10px] text-[#a89aa2]">{subtitle}</p>
      <ul className="relative mt-2 space-y-1">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-1 text-[9.5px] text-[#a89aa2]">
            <span className="h-1 w-1 rounded-full bg-[#FFB45C]/70" />
            {point}
          </li>
        ))}
      </ul>
    </button>
  );
}
