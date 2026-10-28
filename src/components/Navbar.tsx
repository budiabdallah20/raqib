'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROLE_LABEL } from '@/lib/constants';
import { api } from '@/lib/api';
import type { AuthUser } from '@/types';
import { Logo } from '@/components/shared/Logo';

/* ─────────────────────────────────────────────────────────
   جرس الإشعارات — ينجرف كل دقيقة + فتح قائمة مباشرة (WP4)
   ───────────────────────────────────────────────────────── */
type Notif = {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function NotificationsBell() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notif[]>([]);
  const [unread, setUnread] = React.useState(0);

  const load = React.useCallback(() => {
    api<{ items: Notif[]; unread: number }>('/api/notifications')
      .then((d) => {
        setItems(d.items);
        setUnread(d.unread);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  async function markAllRead() {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    try {
      await api('/api/notifications', { method: 'POST', body: JSON.stringify({ all: true }) });
    } catch { /* تجاهل */ }
  }

  // آخر 3 إشعارات غير مقروءة كنص عائم
  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread > 0) void markAllRead();
        }}
        aria-label="الإشعارات"
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition ${
          unread > 0
            ? 'border-gold-500/30 bg-gold-500/[0.10] text-gold-700'
            : 'border-white/70 bg-white/60 text-ink-500 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] hover:text-ink-900'
        }`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute bottom-10 right-0 z-50 w-80 max-w-[90vw] rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_24px_60px_-24px_rgba(19,56,44,.38)] backdrop-blur-2xl">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-xs font-bold text-ink-700">الإشعارات</p>
            <button onClick={() => setOpen(false)} aria-label="إغلاق" className="text-ink-400 hover:text-ink-900">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="py-8 text-center text-xs text-ink-400">لا إشعارات بعد — ستوصلك تلقائيًا مع أهم الأحداث</p>
            )}
            {items.map((n) => {
              const inner = (
                <div className="flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${!n.readAt ? 'bg-gold-500' : 'bg-ink-200'}`} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink-850">{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-500">{n.body}</p>}
                    <p className="mt-1 text-[9.5px] text-ink-400">
                      {new Date(n.createdAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              );
              const shell = `block rounded-xl px-3 py-2.5 transition hover:bg-brand-500/[0.06] ${!n.readAt ? 'bg-gold-500/[0.07]' : ''}`;
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => setOpen(false)} className={shell}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id} className={shell}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const NAV_LINKS: Record<string, { href: string; label: string; icon?: React.ReactNode }[]> = {
  STUDENT: [
    { href: '/student', label: 'الرئيسية' },
    { href: '/student/schedule', label: 'جدولي' },
    { href: '/student/tasks', label: 'تاسكاتي' },
  ],
  PROFESSOR: [
    { href: '/professor', label: 'الرئيسية' },
    { href: '/professor/schedule', label: 'جدولي' },
    { href: '/professor/grades', label: 'الدرجات' },
    { href: '/professor/tasks', label: 'تاسكات' },
    { href: '/professor/resources', label: 'ملفات' },
  ],
  ADMIN: [
    { href: '/admin', label: 'الرئيسية' },
    { href: '/admin/schedule', label: 'الجداول' },
    { href: '/admin/students', label: 'الطلاب' },
    { href: '/admin/professors', label: 'الدكاترة' },
    { href: '/admin/courses', label: 'المواد' },
    { href: '/admin/settings', label: 'الإعدادات' },
  ],
};

export function Navbar({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // تجاهل
    }
    router.replace('/login');
  }

  const links = user ? NAV_LINKS[user.role] || [] : [];

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[#f7faf7]/82 shadow-[0_14px_38px_-32px_rgba(19,56,44,.32)] backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <Link href={user ? navHome(user.role) : '/'}>
            <Logo markClassName="h-8 w-8" />
          </Link>
          <span className="hidden rounded-full border border-brand-500/15 bg-brand-500/[0.06] px-2 py-0.5 text-[9px] text-brand-700/70 sm:block">
            منصة الحضور
          </span>
          {links.length > 0 && (
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? 'bg-brand-500/10 text-brand-700'
                        : 'text-ink-500 hover:text-ink-950'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-ink-800">{user.name}</p>
              <p className="text-[10px] text-brand-700/60">{ROLE_LABEL[user.role]}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        ) : null}
      </div>
      {links.length > 0 && (
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  active ? 'bg-brand-500/10 text-brand-700' : 'text-ink-500'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

function navHome(role: string) {
  const map: Record<string, string> = {
    STUDENT: '/student',
    PROFESSOR: '/professor',
    ADMIN: '/admin',
  };
  return map[role] || '/';
}
