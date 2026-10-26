'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-xl border border-brand-900/12 bg-white/65 px-4 text-sm text-ink-900 shadow-[0_1px_0_rgba(255,255,255,.9)_inset] placeholder:text-ink-400/55 outline-none transition duration-300 hover:border-brand-900/20 focus:border-brand-500/45 focus:bg-white/90 focus:ring-2 focus:ring-brand-500/12',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
