'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7faf7] disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        default:
          'bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] text-[#1c1503] shadow-[0_14px_36px_-14px_rgba(200,162,75,.55)] hover:-translate-y-0.5 hover:brightness-[1.06] hover:shadow-[0_20px_48px_-14px_rgba(200,162,75,.7)] active:translate-y-0 active:scale-[0.985]',
        outline:
          'border border-brand-900/12 bg-white/60 text-ink-800 shadow-[0_1px_0_rgba(255,255,255,.85)_inset] hover:-translate-y-0.5 hover:border-brand-500/30 hover:bg-white/85 hover:text-ink-950',
        ghost: 'text-ink-500 hover:bg-brand-500/[0.08] hover:text-ink-950',
        danger:
          'bg-gradient-to-l from-ember-700 to-ember-500 text-white shadow-ember hover:brightness-110',
        subtle:
          'border border-brand-900/10 bg-brand-500/[0.06] text-ink-700 hover:border-brand-500/25 hover:bg-brand-500/[0.1] hover:text-ink-950',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
