'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Fingerprint,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ROLE_HOME } from '@/lib/constants';
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

  React.useEffect(() => {
    setPkReady(passkeySupported());
  }, []);

  const idError =
    touched.id && identifier.trim().length < 3
      ? 'أدخل البريد أو رقم الهاتف أو الاسم الكامل'
      : '';
  const passError =
    touched.pass && password.length < 8
      ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
      : '';
  const idValid = touched.id && identifier.trim().length >= 3;
  const passValid = touched.pass && password.length >= 8;

  const params = useSearchParams();
  const homeFor = (role: string) => {
    const next = params.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) return next;
    return ROLE_HOME[role as AuthUser['role']] || '/';
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
      setError((err as Error).message);
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

  return (
    <div>
      <div className="mb-5">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand-500/18 bg-brand-500/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-700">
          <Sparkles className="h-3 w-3" />
          WELCOME BACK
        </div>
        <h2 className="font-display text-2xl font-extrabold text-ink-950">
          أهلًا بعودتك
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-6 text-ink-500">
          سجّل دخولك لمتابعة حضورك، محاضراتك، وتقاريرك في مكان واحد.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          label="البريد / رقم الهاتف / الاسم الكامل"
          htmlFor="login-identifier"
          error={idError}
          success={idValid ? 'جاهز' : ''}
        >
          <ValidatedInput
            id="login-identifier"
            icon={UserRound}
            autoComplete="username"
            placeholder="name@example.com أو 01000000000"
            value={identifier}
            invalid={Boolean(idError)}
            valid={idValid}
            onChange={(event) => setIdentifier(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, id: true }))}
          />
        </Field>

        <Field
          label="كلمة المرور"
          htmlFor="login-password"
          error={passError}
          success={passValid ? 'جاهزة' : ''}
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
          />
        </Field>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setRemember((current) => !current)}
            className="flex items-center gap-2 text-[11.5px] text-ink-500 transition hover:text-ink-800"
            aria-pressed={remember}
          >
            <span
              className={cn(
                'flex h-[17px] w-[17px] items-center justify-center rounded-[5px] border transition',
                remember
                  ? 'border-gold-500 bg-gold-500 text-[#1c1503] shadow-[0_2px_10px_-2px_rgba(200,162,75,.65)]'
                  : 'border-white/15 bg-white/[0.06]',
              )}
            >
              {remember ? <Check className="h-3 w-3" /> : null}
            </span>
            تذكرني لمدة 7 أيام
          </button>
          <button
            type="button"
            onClick={() => onForgot(EMAIL_RE.test(identifier.trim()) ? identifier.trim() : '')}
            className="text-[11.5px] font-semibold text-brand-700 transition hover:text-brand-800"
          >
            نسيت كلمة المرور؟
          </button>
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-ember-500/25 bg-ember-500/[0.06] px-3 py-2.5 text-[11.5px] leading-5 text-ember-600"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] text-sm font-extrabold text-[#1c1503] shadow-[0_16px_40px_-14px_rgba(200,162,75,.6)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-12px_rgba(200,162,75,.75)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ التحقق...
            </>
          ) : (
            <>
              دخول إلى المنصة
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-brand-900/10" />
        <span className="text-[10px] uppercase tracking-[0.25em] text-ink-400">
          أو
        </span>
        <span className="h-px flex-1 bg-brand-900/10" />
      </div>

      {pkReady ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={passkeyLogin}
            disabled={pkLoading}
            className="group flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#65a30d]/30 bg-[#a3e635]/10 text-sm font-extrabold text-[#3f6212] shadow-[inset_0_1px_0_rgba(255,255,255,.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#a3e635]/20 hover:shadow-[0_14px_34px_-16px_rgba(101,163,13,.55)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pkLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ طلب اللمسة...
              </>
            ) : (
              <>
                <Fingerprint className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                الدخول ببصمة الجهاز (Passkey)
              </>
            )}
          </button>
          {pkError ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-start gap-2 rounded-xl border border-ember-500/25 bg-ember-500/[0.06] px-3 py-2.5 text-[11.5px] leading-5 text-ember-600"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {pkError}
            </motion.div>
          ) : null}
          <p className="mt-1.5 text-center text-[10.5px] text-ink-400">
            بشارة الإصبع أو الوجه أو قفل الشاشة — أخف وأأمن من كلمة المرور.
          </p>
        </div>
      ) : null}

      <p className="mt-4 text-center text-[12px] text-ink-500">
        أول مرة على رقيب؟{' '}
        <button
          type="button"
          onClick={onSwitchTab}
          className="font-bold text-brand-700 underline-offset-4 transition hover:text-brand-800 hover:underline"
        >
          أنشئ حسابك الآن
        </button>
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-ink-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-gold-600" />
          اتصال مشفّر
        </span>
        <span className="flex items-center gap-1">
          <LockKeyhole className="h-3 w-3 text-gold-600" />
          حماية الجلسة
        </span>
        <span>·</span>
        <button
          type="button"
          onClick={onPolicy}
          className="transition hover:text-brand-700"
        >
          سياسة الخصوصية
        </button>
      </div>
    </div>
  );
}
