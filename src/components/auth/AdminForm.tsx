'use client';
import { useAuthCopy } from './auth-copy';

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
  const tr = useAuthCopy();
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
      setError(tr("كود الإدارة يتكون من 16 رقمًا بالكامل"));
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
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-ember-500/20 bg-ember-500/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ember-400">
          <ShieldAlert className="h-3.5 w-3.5" />
          RESTRICTED ACCESS
        </div>
        <h2 className="font-display text-2xl font-extrabold text-[#FAF5F2]">
          {tr("خزنة الإدارة")}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#9CA3AF]">
          {tr("هذه المنطقة مخصصة لمسؤولي المنصة فقط. أدخل كود الدخول السري المكوّن من\n          16 رقمًا.")}</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-[#F28C28]/30 bg-[#180B12]/90 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#FFB45C]">
              <Fingerprint className="h-4 w-4 text-[#F28C28]" />
              {tr("كود الإدارة السري")}</div>
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              className="btn-ghost flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] transition hover:bg-white/[0.06] hover:text-[#FAF5F2]"
            >
              {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {visible ? tr("إخفاء") : tr("إظهار")}
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
                  className="theater-input h-14 w-[22%] rounded-xl border border-[#F28C28]/30 bg-[#221016] text-center font-latin text-lg font-bold tracking-[0.28em] text-[#FFB45C] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] outline-none transition placeholder:text-[#a89aa2]/40 hover:border-[#F28C28]/50 focus:border-[#FFB45C] focus:bg-[#1d0e15] focus:ring-2 focus:ring-[#F28C28]/25 sm:w-16 sm:text-xl"
                />
                {group < 3 ? (
                  <span className="text-[#F28C28]/40" aria-hidden="true">
                    ·
                  </span>
                ) : null}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-[#9CA3AF]">
              <LockKeyhole className="h-3 w-3 text-[#F28C28]" />
              {tr("مشفّر بـ bcrypt")}</span>
            <span
              className={cn(
                'font-latin tracking-[0.2em]',
                filled === 16 ? 'text-[#F5B46B]' : 'text-[#9CA3AF]/60',
              )}
              dir="ltr"
            >
              {filled}/16
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-[#F28C28]/25 bg-[#F28C28]/[0.08] px-3 py-2.5 text-[10.5px] leading-5 text-[#FFB45C]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {tr("محاولات الدخول محدودة. أي محاولة غير مصرح بها يتم حظرها وتسجيلها.")}</div>

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
          className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-xl transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {tr("جارٍ التحقق...")}</>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              {tr("فتح خزنة الإدارة")}</>
          )}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-center gap-3 text-[10px] text-[#9CA3AF]">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-[#FFB45C]" />
          {tr("تسجيل محاولات الدخول")}</span>
        <span>·</span>
        <button
          type="button"
          onClick={onPolicy}
          className="btn-ghost transition hover:text-[#FFD4A3]"
        >
          {tr("سياسة الاستخدام")}</button>
      </div>
    </div>
  );
}