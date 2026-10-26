'use client';

import * as React from 'react';
import { Navbar } from '@/components/Navbar';
import { api } from '@/lib/api';
import { X, Sparkles } from 'lucide-react';
import type { AuthUser } from '@/types';

const ROLE_LABEL: Record<AuthUser['role'], string> = {
  STUDENT: 'طالبنا',
  PROFESSOR: 'دكتورنا',
  ADMIN: 'أيها الحارس',
};

const ANY_KEY = 'raqib_hi_v1';

/** بانر ترحيب فاخر — يظهر مرة واحدة فقط في اليوم لكل مستخدم. */
function WelcomeBanner({ user }: { user: AuthUser }) {
  const [visible, setVisible] = React.useState(false);
  const [greeting, setGreeting] = React.useState('أهلًا بك');

  React.useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'صباح الخير' : hour < 17 ? 'نهار سعيد' : 'مساء الخير');

    const today = new Date().toISOString().slice(0, 10);
    let shown = false;
    try {
      shown = window.localStorage.getItem(ANY_KEY) === today;
    } catch { /* تجاهل */ }
    if (!shown) {
      setVisible(true);
      try {
        window.localStorage.setItem(ANY_KEY, today);
      } catch { /* تجاهل */ }
    }
  }, []);

  const dismiss = React.useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  const firstName = user.name.split(' ')[0] || user.name;

  return (
    <div className="animate-rise mb-6 overflow-hidden rounded-2xl border border-gold-500/25 bg-gradient-to-l from-gold-500/[0.10] via-white/50 to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.85)] backdrop-blur-md sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-500/25 bg-gold-500/[0.10] text-gold-700">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-extrabold text-ink-900">
              {greeting}، {ROLE_LABEL[user.role]}{' '}
              <span className="text-gold-gradient">{firstName}</span> 👑
            </p>
            <p className="mt-0.5 truncate text-[10.5px] text-ink-500">
              منورة لوحتك اليوم — شوف آخر التحديثات وكمّل شغل بسرعة ما.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="إخفاء الترحيب"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/55 text-ink-400 transition hover:text-ink-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    api<{ user: AuthUser }>('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  return (
    <div className="relative min-h-screen bg-grid">
      <div className="pointer-events-none absolute inset-0 bg-radial-brand" />
      <div className="relative">
        <Navbar user={user} />
        <main className="mx-auto max-w-6xl px-4 py-8">
          {ready && user ? <WelcomeBanner user={user} /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
