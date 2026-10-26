'use client';

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
import { LogoMark } from '@/components/shared/Logo';
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
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
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
      setError('أدخل بريدًا إلكترونيًا صحيحًا');
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
      setNotice(
        result.delivered
          ? 'أرسلنا كود التحقق إلى بريدك الإلكتروني.'
          : 'تم إنشاء كود التحقق. في وضع التطوير يظهر الكود هنا.',
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('كود التحقق يجب أن يكون 6 أرقام');
      return;
    }
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين');
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
            className="absolute inset-0 bg-[#06110d]/45 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="استعادة كلمة المرور"
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="card-glow relative w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_40px_120px_-24px_rgba(8,22,17,0.5)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-mesh-gold opacity-40" />
            <div className="relative border-b border-brand-900/[0.08] px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-gold-500/25 blur-xl" />
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-600/25 bg-gold-500/10 text-gold-700">
                      <KeyRound className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-700">
                      RECOVERY
                    </p>
                    <h2 className="mt-0.5 font-display text-lg font-extrabold text-ink-950">
                      استعادة كلمة المرور
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="إغلاق"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-900/10 bg-white/65 text-ink-400 transition hover:border-brand-500/30 hover:text-ink-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {['email', 'code', 'done'].map((item, index) => {
                  const order = item === 'email' ? 0 : item === 'code' ? 1 : 2;
                  const current = step === 'email' ? 0 : step === 'code' ? 1 : 2;
                  return (
                    <React.Fragment key={item}>
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold transition',
                          order < current &&
                            'border-brand-500/35 bg-brand-500/12 text-brand-700',
                          order === current &&
                            'border-gold-600/40 bg-gold-500/12 text-gold-700',
                          order > current &&
                            'border-brand-900/10 bg-white/60 text-ink-300',
                        )}
                      >
                        {order < current ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                      </span>
                      {index < 2 ? (
                        <span
                          className={cn(
                            'h-px flex-1',
                            order < current
                              ? 'bg-brand-500/30'
                              : 'bg-brand-900/10',
                          )}
                        />
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="relative px-6 py-5">
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
                    <p className="text-xs leading-6 text-ink-500">
                      اكتب البريد المسجل في حسابك، وسنرسل لك كود تحقق مكوّن من 6 أرقام.
                    </p>
                    <Field label="البريد الإلكتروني" htmlFor="forgot-email">
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
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] text-sm font-bold text-[#1c1503] shadow-[0_14px_36px_-14px_rgba(200,162,75,.6)] transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          جارٍ إرسال الكود...
                        </>
                      ) : (
                        'إرسال كود التحقق'
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
                    <div className="flex items-start gap-2 rounded-xl border border-brand-500/15 bg-brand-500/[0.05] px-3 py-2.5">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                      <div className="text-[11px] leading-5 text-ink-600">
                        {notice || 'تم إرسال الكود إلى بريدك.'}
                        <div className="mt-1 font-latin text-[10px] text-brand-700/70" dir="ltr">
                          {email} · {minutes}:{remaining}
                        </div>
                      </div>
                    </div>

                    {devCode ? (
                      <button
                        type="button"
                        onClick={() => setCode(devCode)}
                        className="flex w-full items-center justify-between rounded-xl border border-dashed border-amber-500/30 bg-amber-400/[0.08] px-3 py-2 text-[11px] text-amber-700 transition hover:bg-amber-400/[0.14]"
                        title="اضغط لملء الكود (وضع التطوير)"
                      >
                        <span>وضع التطوير — كود التحقق</span>
                        <span className="font-latin text-sm font-bold tracking-[0.35em]" dir="ltr">
                          {devCode}
                        </span>
                      </button>
                    ) : null}

                    <Field
                      label="كود التحقق"
                      htmlFor="forgot-code"
                      hint="6 أرقام وصلت إلى بريدك الإلكتروني"
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

                    <Field label="كلمة المرور الجديدة" htmlFor="forgot-password">
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

                    <Field
                      label="تأكيد كلمة المرور"
                      htmlFor="forgot-confirm"
                      error={
                        confirm && confirm !== password
                          ? 'كلمتا المرور غير متطابقتين'
                          : ''
                      }
                      success={
                        confirm && confirm === password ? 'متطابقتان' : ''
                      }
                    >
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
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] text-sm font-bold text-[#1c1503] shadow-[0_14px_36px_-14px_rgba(200,162,75,.6)] transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          جارٍ التحقق...
                        </>
                      ) : (
                        'تعيين كلمة المرور'
                      )}
                    </button>

                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('email');
                          setError('');
                        }}
                        className="flex items-center gap-1 text-ink-400 transition hover:text-ink-700"
                      >
                        <ArrowLeft className="h-3 w-3 rotate-180" />
                        تغيير البريد
                      </button>
                      <button
                        type="button"
                        onClick={() => void requestCode()}
                        disabled={loading || seconds > 540}
                        className="flex items-center gap-1 text-brand-700 transition hover:text-brand-800 disabled:opacity-40"
                      >
                        <RefreshCw className="h-3 w-3" />
                        {seconds > 0 ? 'إعادة إرسال' : 'اطلب كودًا جديدًا'}
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
                      <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/20" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-brand-500/25 bg-brand-500/10 text-brand-700">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                    </div>
                    <h3 className="font-display text-lg font-extrabold text-ink-950">
                      تم تحديث كلمة المرور
                    </h3>
                    <p className="mt-2 max-w-xs text-xs leading-6 text-ink-500">
                      يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة. جميع الجلسات
                      القديمة ستنتهي تلقائيًا.
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] text-sm font-bold text-[#1c1503] shadow-[0_14px_36px_-14px_rgba(200,162,75,.6)] transition hover:-translate-y-0.5"
                    >
                      العودة لتسجيل الدخول
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="relative flex items-center justify-center gap-2 border-t border-brand-900/[0.08] px-6 py-3 text-[10px] text-ink-400">
              <LogoMark className="h-4 w-4" tone="gold" />
              اتصال آمن · لن نشارك بريدك مع أي طرف ثالث
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
