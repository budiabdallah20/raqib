'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoginForm } from './LoginForm';
import { RegisterWizard } from './RegisterWizard';
import { AdminForm } from './AdminForm';
import { PolicyModal, type PolicyTab } from './PolicyModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export type AuthTab = 'login' | 'register' | 'admin';

export function AuthCard({ initialTab = 'login' }: { initialTab?: AuthTab }) {
  const [tab, setTab] = React.useState<AuthTab>(initialTab);
  const [policyTab, setPolicyTab] = React.useState<PolicyTab | null>(null);
  const [forgotEmail, setForgotEmail] = React.useState<string | null>(null);

  const tabs: { key: AuthTab; label: string }[] = [
    { key: 'login', label: 'دخول' },
    { key: 'register', label: 'حساب جديد' },
    { key: 'admin', label: 'إدارة' },
  ];

  return (
    <>
      <div className="card-glow relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0b0e08]/80 p-4 shadow-glass backdrop-blur-2xl sm:p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 42% at 50% -6%, rgba(163,230,53,0.08), transparent 62%), radial-gradient(ellipse 40% 34% at 88% 100%, rgba(200,162,75,0.10), transparent 60%)',
          }}
        />

        <div className="relative mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-ink-400">
            <ShieldCheck className="h-3 w-3 text-brand-400" />
            بوابة آمنة
          </span>
          <span className="inline-flex items-center gap-1.5 font-latin text-[9px] uppercase tracking-[0.22em] text-gold-400/70">
            <Sparkles className="h-3 w-3 animate-pulse" />
            RAQIB SECURE
          </span>
        </div>

        <div
          role="tablist"
          aria-label="نوع الدخول"
          className="relative grid grid-cols-3 gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1 shadow-[inset_0_2px_10px_rgba(0,0,0,.45)]"
        >
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className="relative rounded-xl px-3 py-2 text-[12.5px] font-bold transition-colors"
            >
              {tab === item.key && (
                <motion.span
                  layoutId="auth-tab-pill"
                  className="absolute inset-0 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] shadow-[0_10px_30px_-10px_rgba(200,162,75,.7)]"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                />
              )}
              <span
                className={cn(
                  'relative z-10',
                  tab === item.key ? 'text-[#1c1503]' : 'text-ink-400 hover:text-ink-600',
                )}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div className="relative mt-5">
          {tab === 'login' && (
            <LoginForm
              onForgot={setForgotEmail}
              onSwitchTab={() => setTab('register')}
              onPolicy={() => setPolicyTab('privacy')}
            />
          )}
          {tab === 'register' && <RegisterWizard onPolicy={setPolicyTab} />}
          {tab === 'admin' && <AdminForm onPolicy={() => setPolicyTab('privacy')} />}
        </div>

        <div className="relative mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/[0.07] pt-4 text-[10px] text-ink-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold-400" />
            اتصال مشفّر
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span>JWT httpOnly</span>
          <span className="h-3 w-px bg-white/10" />
          <span>Rate limit</span>
        </div>
      </div>

      <PolicyModal
        open={policyTab !== null}
        initialTab={policyTab ?? 'privacy'}
        onClose={() => setPolicyTab(null)}
      />
      <ForgotPasswordModal
        open={forgotEmail !== null}
        initialEmail={forgotEmail ?? ''}
        onClose={() => setForgotEmail(null)}
      />
    </>
  );
}
