'use client';
import { useAuthCopy } from './auth-copy';

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
  'theater-input flex h-12 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm text-[#F8F5F2] shadow-[0_1px_0_rgba(255,255,255,.06)_inset] placeholder:text-[#a89aa2]/60 outline-none transition duration-300 hover:border-white/20 focus:border-[#F28C28]/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#F28C28]/25 disabled:opacity-50 min-h-[44px]';

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
  const tr = useAuthCopy();
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-semibold text-[#F8F5F2]"
        >
          {tr(label)}
        </label>
        {optional ? (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#a89aa2]">
            {tr("اختياري")}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="flex items-start gap-1.5 text-[11.5px] leading-5 text-red-300"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {tr(error)}
        </p>
      ) : success ? (
        <p className="flex items-center gap-1.5 text-[11.5px] text-[#F5B46B]">
          <Check className="h-3.5 w-3.5" />
          {tr(success)}
        </p>
      ) : hint ? (
        <p className="text-[11px] leading-5 text-[#a89aa2]">{tr(hint)}</p>
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
  <div className="relative input-wrapper" dir={props.dir}>
    {Icon ? (
      <Icon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F5B46B]/60 input-icon" />
    ) : null}
    <input
      ref={ref}
      className={cn(
        BASE_INPUT,
        Icon && 'pr-11',
        trailing && 'pl-12',
        invalid &&
          'border-red-400/60 bg-red-400/[0.08] focus:border-red-400 focus:ring-red-400/20',
        valid &&
          'border-[#F5B46B]/50 focus:border-[#F5B46B]/70 focus:ring-[#F5B46B]/15',
        !invalid &&
          !valid &&
          'focus:border-[#F28C28]/60 focus:ring-[#F28C28]/20',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
      aria-describedby={props['aria-describedby'] ?? (invalid && props.id ? `${props.id}-error` : undefined)}
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
  const tr = useAuthCopy();
  const [visible, setVisible] = React.useState(false);
  return (
    <ValidatedInput
      ref={ref}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#a89aa2] transition hover:bg-[#F5B46B]/[0.10] hover:text-[#F5B46B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]/50"
          aria-label={visible ? tr('إخفاء كلمة المرور') : tr('إظهار كلمة المرور')}
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
  { label: 'ضعيفة جدًا', color: 'bg-red-400', text: 'text-red-300' },
  { label: 'ضعيفة', color: 'bg-red-400', text: 'text-red-300' },
  { label: 'متوسطة', color: 'bg-[#F5B46B]', text: 'text-[#F5B46B]' },
  { label: 'قوية', color: 'bg-[#F5B46B]', text: 'text-[#F5B46B]' },
  { label: 'أسطورية', color: 'bg-[linear-gradient(90deg,#F5B46B,#F5B46B)]', text: 'text-[#F5B46B]' },
];

export function PasswordStrength({ value }: { value: string }) {
  const tr = useAuthCopy();
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
        <span className={meta.text}>{tr("قوة كلمة المرور:")}{tr(meta.label)}</span>
        <span className="text-[#a89aa2]">{tr("10+ أحرف، رقم، وحرف كبير")}</span>
      </div>
    </div>
  );
}
