'use client';
import { useAuthCopy } from './auth-copy';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AcademicGateMark } from '@/components/stage/AcademicGateMark';
import {
  Field,
  PasswordInput,
  PasswordStrength,
  ValidatedInput,
} from './fields';

type Step = 'email' | 'code' | 'done';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordModal({
  open,
  onClose,
  initialEmail = '',
}: {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
}) {
  const tr = useAuthCopy();
  const [step, setStep] = React.useState<Step>('email');
  const [email, setEmail] = React.useState(initialEmail);
  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [devCode, setDevCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [seconds, setSeconds] = React.useState(600);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setStep('email');
    setEmail((current) => current || initialEmail);
    setCode('');
    setPassword('');
    setConfirm('');
    setDevCode('');
    setError('');
    setNotice('');
    setLoading(false);
    setSeconds(600);
  }, [open, initialEmail]);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])') ?? []);
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open || step !== 'code') return;
    const timer = window.setInterval(() => {
      setSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, step]);

  const requestCode = async () => {
    setError('');
    setNotice('');
    if (!EMAIL_RE.test(email.trim())) {
      setError(tr("أدخل بريدًا إلكترونيًا صحيحًا"));
      return;
    }
    setLoading(true);
    try {
      const result = await api<{
        ok: boolean;
        delivered: boolean;
        expiresIn: number;
        devCode?: string;
      }>('/api/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setStep('code');
      setSeconds(result.expiresIn || 600);
      setDevCode(result.devCode || '');
      setNotice(tr("إذا كان البريد مرتبطًا بحساب نشط، ستصل رسالة التحقق إليه. راجع البريد غير المرغوب فيه أيضًا."));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError(tr("كود التحقق يجب أن يكون 6 أرقام"));
      return;
    }
    if (password.length < 8) {
      setError(tr("كلمة المرور يجب أن تكون 8 أحرف على الأقل"));
      return;
    }
    if (password !== confirm) {
      setError(tr("كلمتا المرور غير متطابقتين"));
      return;
    }
    setLoading(true);
    try {
      await api('/api/auth/reset', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          password,
          confirmPassword: confirm,
        }),
      });
      setStep('done');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(seconds / 60);
  const remaining = String(seconds % 60).padStart(2, '0');

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[160] flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-[#0d0509]/45 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={tr("استعادة كلمة المرور")}
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="auth-panel auth-panel--register relative w-full max-w-md overflow-hidden rounded-3xl border border-[#F28C28]/30 bg-[#221016]/95 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
          >
            <span className="auth-panel-top-bar" aria-hidden />
            <div className="auth-panel-ambient" aria-hidden />
            <div className="auth-panel-header">
              <div className="auth-panel-brand">
                <span className="auth-panel-brand-badge">
                  <KeyRound className="h-6 w-6 text-[#F28C28]" />
                </span>
                <div>
                  <p className="auth-panel-brand-name">{tr("رقيب")}</p>
                  <p className="auth-panel-brand-tagline" dir="ltr">RAQEEB · ACADEMIC THEATER</p>
                </div>
              </div>
              <span className="auth-panel-security-badge">
                <span className="auth-panel-security-dot" aria-hidden />
                {tr("بوابة آمنة")}</span>
            </div>
            <div className="auth-panel-act-label">
              <span>{tr("استعادة كلمة المرور")}</span>
              <span className="auth-panel-act-code" dir="ltr">ACT II / RECOVERY</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={tr("إغلاق")}
              className="btn-ghost absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-white/[0.06] hover:text-[#F8F5F2]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="auth-panel-content">
              <AnimatePresence mode="wait">
                {step === 'email' ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.24 }}
                    className="space-y-4"
                  >
                    <p className="text-[12px] leading-6 text-[#9CA3AF]">
                      {tr("اكتب البريد المسجل في حسابك، وسنرسل لك كود تحقق مكوّن من 6 أرقام.")}</p>
                    <Field label={tr("البريد الإلكتروني")} htmlFor="forgot-email">
                      <ValidatedInput
                        id="forgot-email"
                        type="email"
                        icon={Mail}
                        dir="ltr"
                        className="text-left"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void requestCode();
                          }
                        }}
                      />
                    </Field>
                    {error ? (
                      <p className="rounded-xl border border-ember-500/25 bg-ember-500/[0.06] px-3 py-2 text-xs text-ember-600">
                        {error}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void requestCode()}
                      disabled={loading}
                      className="btn-primary group flex h-11 w-full items-center justify-center gap-2 rounded-xl transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {tr("جارٍ إرسال الكود...")}</>
                      ) : (
                        tr("إرسال كود التحقق")
                      )}
                    </button>
                  </motion.div>
                ) : null}

                {step === 'code' ? (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.24 }}
                    className="space-y-4"
                  >
                    <div className="flex items-start gap-2 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/[0.08] px-3 py-2.5">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB45C]" />
                      <div className="text-[11px] leading-5 text-[#F8F5F2]">
                        {notice || tr("تم إرسال الكود إلى بريدك.")}
                        <div className="mt-1 font-latin text-[10px] text-[#FFB45C]/70" dir="ltr">
                          {email} · {minutes}:{remaining}
                        </div>
                      </div>
                    </div>

                    {devCode ? (
                      <button
                        type="button"
                        onClick={() => setCode(devCode)}
                        className="flex w-full items-center justify-between rounded-xl border border-dashed border-amber-500/30 bg-amber-400/[0.08] px-3 py-2 text-[11px] text-amber-700 transition hover:bg-amber-400/[0.14]"
                        title={tr("اضغط لملء الكود (وضع التطوير)")}
                      >
                        <span>{tr("وضع التطوير — كود التحقق")}</span>
                        <span className="font-latin text-sm font-bold tracking-[0.35em]" dir="ltr">
                          {devCode}
                        </span>
                      </button>
                    ) : null}

                    <Field
                      label={tr("كود التحقق")}
                      htmlFor="forgot-code"
                      hint={tr("6 أرقام وصلت إلى بريدك الإلكتروني")}
                    >
                      <ValidatedInput
                        id="forgot-code"
                        inputMode="numeric"
                        dir="ltr"
                        className="text-center font-latin text-lg tracking-[0.5em]"
                        maxLength={6}
                        placeholder="000000"
                        value={code}
                        onChange={(event) =>
                          setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                      />
                    </Field>

                    <Field label={tr("كلمة المرور الجديدة")} htmlFor="forgot-password">
                      <PasswordInput
                        id="forgot-password"
                        dir="ltr"
                        className="text-left"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <PasswordStrength value={password} />
                    </Field>

                    <Field label={tr("تأكيد كلمة المرور")} htmlFor="forgot-confirm">
                      <PasswordInput
                        id="forgot-confirm"
                        dir="ltr"
                        className="text-left"
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                      />
                    </Field>

                    {error ? (
                      <p className="rounded-xl border border-ember-500/25 bg-ember-500/[0.06] px-3 py-2 text-xs text-ember-600">
                        {error}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void resetPassword()}
                      disabled={loading}
                      className="btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {tr("جارٍ التحقق...")}</>
                      ) : (
                        tr("تعيين كلمة المرور")
                      )}
                    </button>

                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('email');
                          setError('');
                        }}
                        className="btn-ghost flex items-center gap-1 transition hover:text-[#F8F5F2]"
                      >
                        <ArrowLeft className="h-3 w-3 rotate-180" />
                        {tr("تغيير البريد")}</button>
                      <button
                        type="button"
                        onClick={() => void requestCode()}
                        disabled={loading || seconds > 540}
                        className="btn-ghost flex items-center gap-1 transition hover:text-[#F8F5F2] disabled:opacity-40"
                      >
                        <RefreshCw className="h-3 w-3" />
                        {seconds > 0 ? tr("إعادة إرسال") : tr("اطلب كودًا جديدًا")}
                      </button>
                    </div>
                  </motion.div>
                ) : null}

                {step === 'done' ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center py-6 text-center"
                  >
                    <div className="relative mb-4">
                      <div className="absolute inset-0 animate-ping rounded-full bg-[#F5B46B]/20" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#F5B46B]/30 bg-[#F5B46B]/10 text-[#F5B46B]">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                    </div>
                    <h3 className="font-display text-lg font-extrabold text-[#F8F5F2]">
                      {tr("تم تحديث كلمة المرور")}</h3>
                    <p className="mt-2 max-w-xs text-xs leading-6 text-[#9CA3AF]">
                      {tr("يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة. جميع الجلسات\n                      القديمة ستنتهي تلقائيًا.")}</p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-primary mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl transition hover:-translate-y-0.5"
                    >
                      {tr("العودة لتسجيل الدخول")}<ArrowLeft className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="auth-panel-footer">
              <div className="auth-panel-trust-bar">
                <span className="auth-panel-trust-item">
                  <ShieldCheck className="h-3 w-3" />
                  {tr("اتصال آمن")}</span>
                <span className="auth-panel-trust-divider" aria-hidden />
                <span className="auth-panel-trust-item font-latin tracking-wide">{tr("لا نشارك بريدك")}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}