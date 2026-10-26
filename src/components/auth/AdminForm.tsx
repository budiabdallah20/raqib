'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/types';

const GROUPS = [0, 1, 2, 3];

export function AdminForm({ onPolicy }: { onPolicy: () => void }) {
  const router = useRouter();
  const [digits, setDigits] = React.useState<string[]>(['', '', '', '']);
  const [visible, setVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const inputs = React.useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join('');
  const filled = code.length;

  const setGroup = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    setDigits((current) => {
      const next = [...current];
      next[index] = clean;
      return next;
    });
    if (clean.length === 4 && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 16);
    if (!pasted) return;
    event.preventDefault();
    const chunks = [0, 1, 2, 3].map((index) => pasted.slice(index * 4, index * 4 + 4));
    setDigits(chunks);
    const nextIndex = Math.min(3, Math.floor(pasted.length / 4));
    inputs.current[nextIndex]?.focus();
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (code.length !== 16) {
      setError('كود الإدارة يتكون من 16 رقمًا بالكامل');
      inputs.current[Math.min(3, Math.floor(code.length / 4))]?.focus();
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ user: AuthUser }>('/api/auth/admin', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      router.replace(data.user.role === 'ADMIN' ? '/admin' : '/');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
      setDigits(['', '', '', '']);
      inputs.current[0]?.focus();
    }
  }

  return (
    <div>
      <div className="mb-5">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-ember-500/20 bg-ember-500/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-ember-600">
          <ShieldAlert className="h-3 w-3" />
          RESTRICTED ACCESS
        </div>
        <h2 className="font-display text-2xl font-extrabold text-ink-950">
          خزنة الإدارة
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-6 text-ink-500">
          هذه المنطقة مخصصة لمسؤولي المنصة فقط. أدخل كود الدخول السري المكوّن من
          16 رقمًا.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-ember-500/15 bg-ember-500/[0.035] p-4 shadow-[0_1px_0_rgba(255,255,255,.8)_inset]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-ink-600">
              <Fingerprint className="h-4 w-4 text-ember-600/80" />
              كود الإدارة السري
            </div>
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] text-ink-400 transition hover:bg-brand-500/[0.06] hover:text-brand-700"
            >
              {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {visible ? 'إخفاء' : 'إظهار'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
            {GROUPS.map((group) => (
              <React.Fragment key={group}>
                <input
                  ref={(element) => {
                    inputs.current[group] = element;
                  }}
                  type={visible ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={`المجموعة ${group + 1} من كود الإدارة`}
                  maxLength={4}
                  placeholder="••••"
                  value={digits[group]}
                  onChange={(event) => setGroup(group, event.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Backspace' &&
                      !digits[group] &&
                      group > 0
                    ) {
                      inputs.current[group - 1]?.focus();
                    }
                  }}
                  className="h-14 w-[22%] rounded-xl border border-brand-900/12 bg-white/70 text-center font-latin text-lg font-bold tracking-[0.28em] text-brand-800 shadow-[0_1px_0_rgba(255,255,255,.9)_inset] outline-none transition placeholder:text-ink-300 focus:border-brand-500/50 focus:bg-white/95 focus:ring-2 focus:ring-brand-500/12 sm:w-16 sm:text-xl"
                />
                {group < 3 ? (
                  <span className="text-brand-900/15" aria-hidden="true">
                    ·
                  </span>
                ) : null}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-ink-400">
              <LockKeyhole className="h-3 w-3" />
              مشفّر بـ bcrypt
            </span>
            <span
              className={cn(
                'font-latin tracking-[0.2em]',
                filled === 16 ? 'text-brand-700' : 'text-ink-300',
              )}
              dir="ltr"
            >
              {filled}/16
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-400/[0.08] px-3 py-2.5 text-[10.5px] leading-5 text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          محاولات الدخول محدودة. أي محاولة غير مصرح بها يتم حظرها وتسجيلها.
        </div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
            transition={{ duration: 0.45 }}
            className="flex items-start gap-2 rounded-xl border border-ember-500/25 bg-ember-500/[0.06] px-3 py-2.5 text-[11.5px] leading-5 text-ember-600"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        ) : null}

        <button
          type="submit"
          disabled={loading || code.length !== 16}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] text-sm font-extrabold text-[#1c1503] shadow-[0_16px_40px_-14px_rgba(200,162,75,.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ التحقق...
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              فتح خزنة الإدارة
            </>
          )}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-center gap-3 text-[10px] text-ink-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-gold-600" />
          تسجيل محاولات الدخول
        </span>
        <span>·</span>
        <button
          type="button"
          onClick={onPolicy}
          className="transition hover:text-brand-700"
        >
          سياسة الاستخدام
        </button>
      </div>
    </div>
  );
}
