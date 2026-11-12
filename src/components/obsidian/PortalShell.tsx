'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronLeft, LogOut, Menu, Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';
import {
  PORTAL_NAV,
  ROLE_AVATAR_FALLBACK,
  ROLE_TITLE,
  type PortalNavGroup,
} from './nav';

type ShellUser = {
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
} | null;

function Logomark() {
  return (
    <span className="relative grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_10px_28px_-10px_rgba(59,130,246,.9),inset_0_1px_0_rgba(255,255,255,.4)]">
      <Sparkles className="h-4 w-4 text-white" aria-hidden />
    </span>
  );
}

function NavList({
  groups,
  pathname,
  onNavigate,
}: {
  groups: PortalNavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="o-eyebrow mb-2 px-3">{group.title}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const body = (
                <>
                  <Icon className="o-nav-icon h-4 w-4 shrink-0 text-obs-text3" aria-hidden />
                  <span className="truncate">{item.label}</span>
                  {item.soon ? (
                    <span className="ms-auto rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] font-bold text-obs-text3">
                      قريبًا
                    </span>
                  ) : null}
                </>
              );

              return (
                <li key={item.href}>
                  {item.soon ? (
                    <span className="o-nav-item cursor-not-allowed opacity-55">{body}</span>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      data-active={active ? 'true' : 'false'}
                      aria-current={active ? 'page' : undefined}
                      className="o-nav-item"
                    >
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function PortalShell({
  role,
  title,
  subtitle,
  user,
  actions,
  children,
}: {
  role: Role;
  title: string;
  subtitle?: string;
  user?: ShellUser;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/';
  const groups = PORTAL_NAV[role];
  const [drawer, setDrawer] = React.useState(false);
  const initials = (user?.name || ROLE_AVATAR_FALLBACK[role]).trim().slice(0, 2);

  React.useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const sidebar = (
    <>
      <div className="flex items-center gap-2.5 px-1 pb-6">
        <Logomark />
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-extrabold tracking-tight text-obs-text">
            رقيب
          </p>
          <p className="truncate text-[10px] font-semibold text-obs-text3">{ROLE_TITLE[role]}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <NavList groups={groups} pathname={pathname} onNavigate={() => setDrawer(false)} />
      </div>

      <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-b from-white/[0.12] to-white/[0.03] text-[11px] font-extrabold text-obs-text">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-obs-text">{user?.name ?? 'زائر'}</p>
            <p className="truncate text-[10px] text-obs-text3">{user?.email ?? 'غير مسجل الدخول'}</p>
          </div>
          <Link
            href="/api/auth/logout"
            aria-label="تسجيل الخروج"
            className="grid h-7 w-7 place-items-center rounded-lg text-obs-text3 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <div className="obsidian">
      <div className="o-aurora" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <div className="o-grain" aria-hidden />

      <div className="relative z-[2] flex min-h-screen">
        {/* ── desktop sidebar (right in RTL) ─────────────────────────── */}
        <aside className="o-glass sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-e px-3 py-5 lg:flex">
          {sidebar}
        </aside>

        {/* ── mobile drawer ─────────────────────────────────────────── */}
        {drawer ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="إغلاق القائمة"
              onClick={() => setDrawer(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <aside className="o-glass absolute inset-y-0 end-0 flex w-[280px] flex-col border-s px-3 py-5">
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="إغلاق"
                className="absolute start-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-obs-text2"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebar}
            </aside>
          </div>
        ) : null}

        {/* ── main column ───────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="o-glass sticky top-0 z-30 border-b px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                aria-label="فتح القائمة"
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-obs-text2 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="o-heading truncate text-[17px] sm:text-[19px]">{title}</h1>
                {subtitle ? (
                  <p className="mt-0.5 truncate text-[11px] text-obs-text3">{subtitle}</p>
                ) : null}
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11.5px] font-semibold text-obs-text3 transition hover:border-white/20 hover:text-obs-text2"
                >
                  <Search className="h-3.5 w-3.5" />
                  بحث
                  <kbd className="rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-obs-text3">
                    Ctrl K
                  </kbd>
                </button>
                <button
                  type="button"
                  aria-label="الإشعارات"
                  className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-obs-text2 transition hover:border-white/20 hover:text-obs-text"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute end-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_2px_rgba(96,165,250,.6)]" />
                </button>
              </div>

              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pb-10">
            {children}
          </main>
        </div>
      </div>

      {/* ── mobile bottom navigation ────────────────────────────────── */}
      <nav className="o-glass fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t px-2 py-1.5 lg:hidden">
        {groups[0]!.items.slice(0, 4).map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.soon ? pathname : item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[9.5px] font-bold transition',
                active ? 'text-blue-300' : 'text-obs-text3',
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
              <span className="truncate">{item.label}</span>
              {active ? (
                <span className="h-0.5 w-4 rounded-full bg-gradient-to-r from-blue-400 to-violet-400 shadow-[0_0_8px_rgba(96,165,250,.8)]" />
              ) : (
                <span className="h-0.5 w-4" />
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[9.5px] font-bold text-obs-text3"
        >
          <ChevronLeft className="h-[18px] w-[18px]" aria-hidden />
          <span>المزيد</span>
          <span className="h-0.5 w-4" />
        </button>
      </nav>
    </div>
  );
}
