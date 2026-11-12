'use client';
import { useAuthCopy } from './auth-copy';

import * as React from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ShieldCheck, UserPlus, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AcademicGateMark } from '@/components/stage/AcademicGateMark';
import { LoginForm } from './LoginForm';
import { RegisterWizard } from './RegisterWizard';
import { AdminForm } from './AdminForm';
import { PolicyModal, type PolicyTab } from './PolicyModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { AdmissionTicket } from './AdmissionTicket';

export type AuthTab = 'login' | 'register' | 'admin';
export type AuthIntent = 'student' | 'professor' | 'admin';

const TAB_META: Record<AuthTab, { label: string; icon: React.ComponentType<{ className?: string }>; hint: string }> = {
  login: { label: 'دخول', icon: UserRound, hint: 'بحسابك الحالي' },
  register: { label: 'حساب جديد', icon: UserPlus, hint: 'سجّل بياناتك' },
  admin: { label: 'إدارة', icon: KeyRound, hint: 'للحسابات الإدارية' },
};

const TAB_ORDER: AuthTab[] = ['login', 'register', 'admin'];

export function AuthCard({ initialTab = 'login', intent }: { initialTab?: AuthTab; intent?: AuthIntent }) {
  const tr = useAuthCopy();
  const [tab, setTab] = React.useState<AuthTab>(initialTab);
  const [policyTab, setPolicyTab] = React.useState<PolicyTab | null>(null);
  const [recovery, setRecovery] = React.useState({ open: false, email: '' });

  const getVariant = (tab: AuthTab) => {
    if (tab === 'register') return 'register';
    if (tab === 'admin') return 'admin';
    return 'login';
  };

  const getTitle = (tab: AuthTab, intent?: AuthIntent) => {
    if (tab === 'register') {
      if (intent === 'professor') return tr("بوابة الدكتور");
      if (intent === 'student') return tr("بوابة الطالب");
      return tr("إنشاء حساب");
    }
    if (tab === 'admin') return tr("بوابة الإدارة");
    if (intent === 'student') return tr("بوابة الطالب");
    if (intent === 'professor') return tr("بوابة الدكتور");
    if (intent === 'admin') return tr("بوابة الإدارة");
    return tr("تسجيل الدخول");
  };

  const getSubtitle = (tab: AuthTab) => {
    if (tab === 'register') return tr("سجّل بياناتك للانضمام إلى رقيب");
    if (tab === 'admin') return tr("الدخول بكود الإدارة المشفّر");
    return tr("أهلًا بعودتك — سجّل دخولك للمتابعة");
  };

  return (
    <>
      <AdmissionTicket
        variant={getVariant(tab)}
        title={getTitle(tab, intent)}
        subtitle={getSubtitle(tab)}
        footer={
          <div className="auth-panel-trust-bar">
            <span className="auth-panel-trust-item">
              <ShieldCheck className="h-3 w-3" />
              {tr("الدخول وفق صلاحيات حسابك")}</span>
          </div>
        }
      >
        {/* Tab Bar */}
        <div
          role="tablist"
          aria-label={tr("نوع الدخول")}
          className="auth-tab-bar relative mx-4 mb-6 grid grid-cols-3 gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1 shadow-[inset_0_2px_10px_rgba(0,0,0,.45)]"
        >
          {TAB_ORDER.map((key) => {
            const meta = TAB_META[key];
            const Icon = meta.icon;
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                title={tr(meta.hint)}
                className={cn(
                  'relative rounded-xl px-2 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60',
                  active && 'text-[#1a0c10]',
                  !active && 'text-[#a89aa2] hover:text-[#F8F5F2]'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="auth-tab-pill"
                    className="absolute inset-0 rounded-xl bg-[linear-gradient(110deg,#842441,#FF914D_55%,#F5B46B)] shadow-[0_10px_30px_-10px_rgba(255,145,77,.65)]"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-1.5',
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', active ? 'text-[#1a0c10]' : 'text-[#a89aa2]')} />
                  <span className={cn('text-[11.5px] font-bold sm:text-[12.5px]')}>
                    {tr(meta.label)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Intent indicator */}
        {intent && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-4 mb-4 text-center text-[11px] leading-5 text-[#b8abb2]"
          >
            {tr("اختيار البوابة يحدد مسار العرض فقط؛ الدخول يخضع لصلاحيات حسابك المعتمدة.")}</motion.p>
        )}

        {/* Content */}
        <div className="auth-content">
          {tab === 'login' && (
            <LoginForm
              onForgot={(email) => setRecovery({ open: true, email })}
              onSwitchTab={() => setTab('register')}
              onPolicy={() => setPolicyTab('privacy')}
            />
          )}
          {tab === 'register' && (
            <RegisterWizard
              onPolicy={setPolicyTab}
              initialRole={intent === 'professor' ? 'PROFESSOR' : intent === 'student' ? 'STUDENT' : undefined}
            />
          )}
          {tab === 'admin' && <AdminForm onPolicy={() => setPolicyTab('privacy')} />}
        </div>
      </AdmissionTicket>

      <PolicyModal
        open={policyTab !== null}
        initialTab={policyTab ?? 'privacy'}
        onClose={() => setPolicyTab(null)}
      />
      <ForgotPasswordModal
        open={recovery.open}
        initialEmail={recovery.email}
        onClose={() => setRecovery((current) => ({ ...current, open: false }))}
      />
    </>
  );
}
