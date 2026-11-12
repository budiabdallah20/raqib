'use client';
import { useAuthCopy } from './auth-copy';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Fingerprint,
  Keyboard,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { api } from '@/lib/api';
import { safeReturnPath } from '@/lib/safe-return';
import { loginWithPasskey, passkeySupported } from '@/lib/passkey-client';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/types';
import { Field, PasswordInput, ValidatedInput } from './fields';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({
  onForgot,
  onSwitchTab,
  onPolicy,
}: {
  onForgot: (email: string) => void;
  onSwitchTab: () => void;
  onPolicy: () => void;
}) {
  const tr = useAuthCopy();
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [touched, setTouched] = React.useState<{ id: boolean; pass: boolean }>({
    id: false,
    pass: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pkReady, setPkReady] = React.useState(false);
  const [pkLoading, setPkLoading] = React.useState(false);
  const [pkError, setPkError] = React.useState('');
  /** تحذير Caps Lock أثناء كتابة كلمة المرور — لمسة UX حقيقية */
  const [capsOn, setCapsOn] = React.useState(false);

  React.useEffect(() => {
    setPkReady(passkeySupported());
  }, []);

  /* مفتاح error في الـ key يجبر الأنيميشن يعيد الاهتزاز مع كل خطأ جديد */
  const [errorKey, setErrorKey] = React.useState(0);
  const showError = (message: string) => {
    setError(message);
    setErrorKey((k) => k + 1);
  };

  const idError =
    touched.id && identifier.trim().length < 3
      ? tr("أدخل البريد أو رقم الهاتف أو الاسم الكامل")
      : '';
  const passError =
    touched.pass && password.length < 8
      ? tr("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      : '';
  const idValid = touched.id && identifier.trim().length >= 3;
  const passValid = touched.pass && password.length >= 8;

  const params = useSearchParams();
  const homeFor = (role: string) => {
    const next = params.get('next');
    return safeReturnPath(next, role);
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setTouched({ id: true, pass: true });
    if (identifier.trim().length < 3 || password.length < 8) return;

    setLoading(true);
    try {
      const data = await api<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          remember,
        }),
      });
      router.replace(homeFor(data.user.role));
      router.refresh();
    } catch (err) {
      showError((err as Error).message);
      setLoading(false);
    }
  }

  async function passkeyLogin() {
    setPkError('');
    setPkLoading(true);
    try {
      const result = await loginWithPasskey(identifier.trim() || undefined);
      router.replace(result.user ? homeFor(result.user.role) : '/');
      router.refresh();
    } catch (err) {
      setPkError((err as Error).message);
    } finally {
      setPkLoading(false);
    }
  }

  /* تتبّع Caps Lock — getModifierState مدعوم في كل المتصفحات الحديثة */
  const detectCaps = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsOn(e.getModifierState?.('CapsLock') ?? false);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#F28C28]/30 bg-[#F28C28]/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#FFB45C]">
          <Sparkles className="h-3 w-3" />
          WELCOME BACK
        </div>
        <h2 className="font-display text-[1.5rem] font-black leading-snug text-[#F8F5F2]">
          {tr("أهلًا بعودتك 👋")}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#9CA3AF]">
          {tr("سجّل دخولك لمتابعة حضورك، محاضراتك، وتقاريرك في مكان واحد.")}</p>
      </div>

      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field
          label={tr("البريد / رقم الهاتف / الاسم الكامل")}
          htmlFor="login-identifier"
          error={idError}
          success={idValid ? tr("جاهز") : ''}
        >
          <ValidatedInput
            id="login-identifier"
            icon={UserRound}
            autoFocus
            autoComplete="username"
            placeholder={tr("name@example.com أو 01000000000")}
            value={identifier}
            invalid={Boolean(idError)}
            valid={idValid}
            onChange={(event) => setIdentifier(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, id: true }))}
          />
        </Field>

        <Field
          label={tr("كلمة المرور")}
          htmlFor="login-password"
          error={passError}
          success={passValid ? tr("جاهزة") : ''}
        >
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            invalid={Boolean(passError)}
            valid={passValid}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, pass: true }))}
            onKeyUp={detectCaps}
            onKeyDown={detectCaps}
          />
        </Field>

        {/* تحذير Caps Lock — يظهر فقط وهو مفعّل */}
        {capsOn ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 rounded-lg border border-[#F28C28]/30 bg-[#F28C28]/10 px-3 py-2 text-[11px] font-semibold text-[#FFB45C]"
            role="status"
          >
            <Keyboard className="h-3.5 w-3.5" />
            {tr("Caps Lock مفعّل — كلمة المرور حساسة لحالة الأحرف")}</motion.p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setRemember((current) => !current)}
            className="flex items-center gap-2 text-[12px] text-[#9CA3AF] transition hover:text-[#F8F5F2]"
            aria-pressed={remember}
          >
            <span
              className={cn(
                'flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border transition',
                remember
                  ? 'border-[#F28C28] bg-[#F28C28] text-[#111014] shadow-[0_2px_10px_-2px_rgba(242,140,40,.65)]'
                  : 'border-white/15 bg-white/[0.06]',
              )}
            >
              {remember ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
            {tr("تذكرني لمدة 30 يومًا على هذا الجهاز")}</button>
          <button
            type="button"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => onForgot(EMAIL_RE.test(identifier.trim()) ? identifier.trim() : '')}
            className="text-[12px] font-semibold text-[#FFB45C] transition hover:text-[#FFD4A3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]/50 rounded"
          >
            {tr("نسيت كلمة المرور؟")}</button>
        </div>

        {error ? (
          <motion.div
            key={errorKey}
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: [0, -7, 7, -5, 5, 0] }}
            transition={{ duration: 0.42, ease: 'easeInOut' }}
            className="flex items-start gap-2 rounded-xl border border-ember-500/30 bg-ember-500/[0.09] px-3 py-2.5 text-[11.5px] leading-5 text-ember-400"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-extrabold text-[#1a0c10] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {tr("جارٍ التحقق...")}</>
          ) : (
            <>
              {tr("دخول إلى المنصة")}<ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              <kbd className="absolute left-3 hidden rounded-md border border-[#1a0c10]/20 bg-[#1a0c10]/10 px-1.5 py-0.5 font-latin text-[9px] font-bold text-[#1a0c10]/70 sm:block" dir="ltr">
                ↵ Enter
              </kbd>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#9CA3AF]">
          {tr("أو")}</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {pkReady ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={passkeyLogin}
            disabled={pkLoading}
            className="btn-secondary group flex h-12 w-full items-center justify-center gap-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B46B]/50 min-h-[44px] min-w-[44px]"
          >
            {pkLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {tr("جارٍ طلب اللمسة...")}</>
            ) : (
              <>
                <Fingerprint className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                {tr("الدخول ببصمة الجهاز (Passkey)")}</>
            )}
          </button>
          {pkError ? (
            <motion.div
              key={pkError}
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: [0, -7, 7, -5, 5, 0] }}
              transition={{ duration: 0.42, ease: 'easeInOut' }}
              className="mt-3 flex items-start gap-2 rounded-xl border border-ember-500/30 bg-ember-500/[0.09] px-3 py-2.5 text-[11.5px] leading-5 text-ember-400"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {pkError}
            </motion.div>
          ) : null}
          <p className="mt-2 text-center text-[11px] text-[#9CA3AF]">
            {tr("بصمة الإصبع أو الوجه أو قفل الشاشة — أخف وأأمن من كلمة المرور.")}</p>
        </div>
      ) : null}

      <p className="mt-5 text-center text-[13px] text-[#9CA3AF]">
        {tr("أول مرة على رقيب؟")}{' '}
        <button
          type="button"
          onClick={onSwitchTab}
          className="btn-ghost font-bold underline-offset-4 transition hover:text-[#FFD4A9] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]/50 rounded"
        >
          {tr("أنشئ حسابك الآن")}</button>
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-[#9CA3AF]">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-[#FFB45C]" />
          {tr("اتصال مشفّر")}</span>
        <span className="flex items-center gap-1">
          <LockKeyhole className="h-3.5 w-3.5 text-[#FFB45C]" />
          {tr("حماية الجلسة")}</span>
        <span>·</span>
        <button
          type="button"
          onClick={onPolicy}
          className="transition hover:text-[#FFB45C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]/50 rounded"
        >
          {tr("سياسة الخصوصية")}</button>
      </div>
    </div>
  );
}