'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Form({
  className,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form className={cn('space-y-4', className)} {...props} />;
}

export function FormField({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1.5', className)} {...props} />;
}

export function FormMessage({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      className={cn(
        'rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-3 py-2 text-sm text-ember-300',
        className,
      )}
      role="alert"
    >
      {children}
    </p>
  );
}
