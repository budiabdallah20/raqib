'use client';

/**
 * 🐚 قالب بوابة الطالب — يغلّف الصفحات ويدير:
 * الوضع الليلي + حجم الخط + التباين + تقليل الحركة (على جسم الصفحة)،
 * ويوصل: لوحة الأوامر، الفاصلة العائمة، معالج التهيئة، التنبيهات، التذييل.
 */
import * as React from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { api } from '@/lib/api';
import { FONT_SCALE_PCT, usePortalPrefs } from '@/lib/portal-prefs';
import { CommandPalette } from './CommandPalette';
import { QuickDock } from './QuickDock';
import { ThemeToolsPanel } from './ThemeToolsPanel';
import { OnboardingModal } from './OnboardingModal';
import { PortalAgent } from './PortalAgent';
import type { AuthUser } from '@/types';

const ANY_KEY = 'raqib_hi_v1';

const ROLE_LABEL: Record<AuthUser['role'], string> = {
  STUDENT: 'طالبنا',
  PROFESSOR: 'دكتورنا',
  ADMIN: 'أيها الحارس',
};

/** بانر ترحيب فاخر — مرة واحدة في اليوم (نفس سك الداشبورد المشترك) */
function WelcomeBanner({ user }: { user: AuthUser }) {
  const [visible, setVisible] = React.useState(false);
  const [greeting, setGreeting] = React.useState('أهلًا بك');

  React.useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'صباح الخير' : hour < 17 ? 'نهار سعيد' : 'مساء الخير');
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (window.localStorage.getItem(ANY_KEY) !== today) {
        setVisible(true);
        window.localStorage.setItem(ANY_KEY, today);
      }
    } catch {
      /* تجاهل */
    }
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
              {greeting}، {user.role === 'STUDENT' ? ROLE_LABEL.STUDENT : ''}{' '}
              <span className="text-gold-gradient">{firstName}</span> 👑
            </p>
            <p className="mt-0.5 truncate text-[10.5px] text-ink-500">
              منورة لوحتك اليوم — جرّب <kbd className="rounded border border-brand-900/15 bg-white/70 px-1.5 py-0.5 font-latin text-[10px] font-bold text-ink-600">Ctrl + K</kbd> لفتح اللوحة الشاملة.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="إخفاء الترحيب"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/55 text-ink-400 transition hover:text-ink-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const prefs = usePortalPrefs();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    api<{ user: AuthUser }>('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  // ثيم البوابة: كلاسات الجسم + حجم خط الجذر — تُرفع كلها عند مغادرة صفحات الطالب
  React.useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    body.classList.toggle('portal-dark', prefs.theme === 'dark');
    body.classList.toggle('portal-hc', prefs.highContrast);
    body.classList.toggle('portal-prm', prefs.reduceMotion);
    root.style.fontSize = FONT_SCALE_PCT[prefs.fontScale];
    return () => {
      body.classList.remove('portal-dark', 'portal-hc', 'portal-prm');
      root.style.fontSize = '';
    };
  }, [prefs.theme, prefs.highContrast, prefs.reduceMotion, prefs.fontScale]);

  return (
    <div className="relative min-h-screen bg-grid">
      <div className="pointer-events-none absolute inset-0 bg-radial-brand" />
      <div className="relative">
        <Navbar user={user} />
        <main className="mx-auto max-w-6xl px-4 py-8 pb-24">
          {ready && user ? <WelcomeBanner user={user} /> : null}
          {children}
        </main>
        <footer className="border-t border-white/60 bg-white/45 py-6 text-center backdrop-blur-md">
          <p className="font-display text-xs font-bold text-ink-600">
            RAQiB · رقيب — بوابة الطالب
          </p>
          <p className="mt-1 text-[10.5px] text-ink-400">
            تفضيلاتك (الثيم · حجم الخط · ملاحظات التركيز) محفوظة على جهازك تنها
          </p>
        </footer>
      </div>
      <CommandPalette />
      <QuickDock />
      <ThemeToolsPanel />
      <OnboardingModal user={user} />
      <PortalAgent />
    </div>
  );
}

/** رابط تذييل داخل البوابة — يُستخدم من أي صفحة طالب */
export function PortalFooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gold-700 underline-offset-4 transition hover:underline">
      {children}
    </Link>
  );
}
