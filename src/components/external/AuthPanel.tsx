'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import './AuthPanel.css';

interface AuthPanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'login' | 'register' | 'admin';
}

/**
 * SSR-visible auth panel — deliberately a plain <div>.
 *
 * framer-motion's `initial={{ opacity: 0, y: 20, scale: 0.98 }}` used to ship
 * an inline `style="opacity:0"` in the SSR HTML, so the login card was
 * invisible without JavaScript or whenever hydration/rAF stalled. The
 * entrance is now a pure CSS animation (see AuthPanel.css) that starts from
 * 55% opacity and runs on the compositor: the panel is readable in every
 * environment, with or without JavaScript, throttled or not.
 */
export function AuthPanel({
  children,
  className,
  title,
  subtitle,
  headerAction,
  footer,
  variant = 'login',
}: AuthPanelProps) {
  const baseClass = cn('auth-panel', `auth-panel--${variant}`, 'auth-panel-enter', className);

  return (
    <div className={baseClass} role="region" aria-label={title}>
      <span className="auth-panel-top-bar" aria-hidden />
      <div className="auth-panel-ambient" aria-hidden />
      <div className="auth-panel-header">
        <div className="auth-panel-brand">
          <span className="auth-panel-brand-badge">
            <Image src="/brand/stage-mark.svg" width={28} height={32} alt="" />
          </span>
          <div>
            <p className="auth-panel-brand-name">رقيب</p>
            <p className="auth-panel-brand-tagline" dir="ltr">RAQEEB · ACADEMIC THEATER</p>
          </div>
        </div>
        <span className="auth-panel-security-badge">
          <span className="auth-panel-security-dot" aria-hidden />
          بوابة آمنة
        </span>
      </div>
      {title && (
        <div className="auth-panel-act-label">
          <span>{title}</span>
          <span className="auth-panel-act-code" dir="ltr">
            {variant === 'register' ? 'ACT II / ENROLL' : variant === 'admin' ? 'ACT II / CONTROL' : 'ACT II / ENTER'}
          </span>
        </div>
      )}
      {subtitle && <p className="auth-panel-subtitle">{subtitle}</p>}
      <div className="auth-panel-content">{children}</div>
      {footer && <div className="auth-panel-footer">{footer}</div>}
      <div className="auth-panel-trust-bar">
        <span className="auth-panel-trust-item">
          <span className="auth-panel-trust-icon" aria-hidden>🔒</span>
          اتصال مشفّر
        </span>
        <span className="auth-panel-trust-divider" aria-hidden />
        <span className="auth-panel-trust-item">
          <span className="auth-panel-trust-icon" aria-hidden>🛡️</span>
          JWT httpOnly
        </span>
        <span className="auth-panel-trust-divider" aria-hidden />
        <span className="auth-panel-trust-item">
          <span className="auth-panel-trust-icon" aria-hidden>⚡</span>
          Rate limit
        </span>
        <span className="auth-panel-trust-divider" aria-hidden />
        <span className="auth-panel-trust-item">
          <span className="auth-panel-trust-icon" aria-hidden>🔐</span>
          bcrypt
        </span>
      </div>
    </div>
  );
}
