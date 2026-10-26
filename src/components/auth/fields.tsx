'use client';

import * as React from 'react';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BASE_INPUT =
  'flex h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm text-[#f2f8e8] shadow-[0_1px_0_rgba(255,255,255,.06)_inset] placeholder:text-ink-400/60 outline-none transition duration-300 hover:border-white/20 focus:border-brand-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-brand-400/20 disabled:opacity-50';

export function Field({
  label,
  htmlFor,
  error,
  success,
  hint,
  optional,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  success?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-semibold text-ink-700"
        >
          {label}
        </label>
        {optional ? (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-ink-400">
            اختياري
          </span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="flex items-start gap-1.5 text-[11.5px] leading-5 text-ember-400"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : success ? (
        <p className="flex items-center gap-1.5 text-[11.5px] text-brand-600">
          <Check className="h-3.5 w-3.5" />
          {success}
        </p>
      ) : hint ? (
        <p className="text-[11px] leading-5 text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

export interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  invalid?: boolean;
  valid?: boolean;
  trailing?: React.ReactNode;
}

export const ValidatedInput = React.forwardRef<
  HTMLInputElement,
  ValidatedInputProps
>(({ icon: Icon, invalid, valid, trailing, className, ...props }, ref) => (
  <div className="relative" dir={props.dir}>
    {Icon ? (
      <Icon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400/60" />
    ) : null}
    <input
      ref={ref}
      className={cn(
        BASE_INPUT,
        Icon && 'pr-11',
        trailing && 'pl-12',
        invalid &&
          'border-ember-500/60 bg-ember-500/[0.08] focus:border-ember-500 focus:ring-ember-500/20',
        valid &&
          'border-brand-400/50 focus:border-brand-400/70 focus:ring-brand-400/15',
        !invalid &&
          !valid &&
          'focus:border-brand-400/60 focus:ring-brand-400/20',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
    {trailing ? (
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2">{trailing}</div>
    ) : null}
  </div>
));
ValidatedInput.displayName = 'ValidatedInput';

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<ValidatedInputProps, 'type' | 'trailing'>
>((props, ref) => {
  const [visible, setVisible] = React.useState(false);
  return (
    <ValidatedInput
      ref={ref}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition hover:bg-brand-400/[0.1] hover:text-brand-300"
          aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      }
      {...props}
    />
  );
});
PasswordInput.displayName = 'PasswordInput';

export function passwordScore(password: string) {
  if (!password) return 0;
  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  if (password.length < 8) return 1;
  return Math.max(1, Math.min(5, points));
}

const STRENGTH = [
  { label: 'ضعيفة جدًا', color: 'bg-ember-500', text: 'text-ember-400' },
  { label: 'ضعيفة', color: 'bg-ember-500', text: 'text-ember-400' },
  { label: 'متوسطة', color: 'bg-gold-400', text: 'text-gold-600' },
  { label: 'قوية', color: 'bg-brand-400', text: 'text-brand-600' },
  { label: 'أسطورية', color: 'bg-[linear-gradient(90deg,#a3e635,#c8a24b)]', text: 'text-gold-600' },
];

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const score = passwordScore(value);
  const meta = STRENGTH[score - 1] || STRENGTH[0];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-500',
              index < score ? meta.color : 'bg-white/[0.08]',
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10.5px]">
        <span className={meta.text}>قوة كلمة المرور: {meta.label}</span>
        <span className="text-ink-400">8+ أحرف، رقم، وحرف كبير</span>
      </div>
    </div>
  );
}
