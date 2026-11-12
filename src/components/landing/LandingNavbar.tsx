'use client';

/**
 * Landing navbar — moved verbatim out of the former LandingPage monolith.
 * Owns its own `scrolled` flag (rAF-throttled) and mobile-menu state so the
 * page root stays render-stable.
 */

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Menu, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { AcademicGateLogo } from '@/components/stage/AcademicGateMark';
import { ClockChip, DateChip, EASE, NAV_ANCHORS, useScrollFlag } from './landing-shared';

export function LandingNavbar() {
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const scrolled = useScrollFlag(16);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/10 bg-[#111014]/78 shadow-[0_18px_45px_-32px_rgba(0,0,0,.9)] backdrop-blur-2xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link href="/" className="group flex shrink-0 items-center" aria-label="رقيب — الصفحة الرئيسية">
          <AcademicGateLogo />
        </Link>

        <nav className="hidden items-center gap-0.5 rounded-full border border-[#F28C28]/25 bg-[#211B20]/85 p-1 shadow-[0_10px_30px_-18px_rgba(0,0,0,.85),inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-xl lg:flex">
          {NAV_ANCHORS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative rounded-full px-4 py-2 text-[13px] font-semibold text-[#FFF8F0]/65 transition-all duration-300 hover:bg-[#F28C28]/10 hover:text-[#FFFFFF]"
            >
              {t.nav[item.key]}
              <span className="absolute inset-x-4 -bottom-[1px] h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-[#F28C28]/70 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-1.5 md:flex">
            <ClockChip />
            <DateChip />
          </div>
          <LanguageToggle />
          <Link
            href="/login"
            className="hidden rounded-full px-3.5 py-2 text-[12px] font-bold text-[#cfc0c7] transition-colors hover:text-[#FFB45C] sm:inline-flex"
          >
            {t.nav.login}
          </Link>
          <Link
            href="/login?tab=register"
            className="group relative hidden h-10 items-center gap-2 overflow-hidden rounded-full bg-[linear-gradient(135deg,#641B35_0%,#F28C28_45%,#FFB45C_75%,#ffd4a3_100%)] px-4 text-[12px] font-bold text-[#FFFFFF] shadow-[0_14px_32px_-12px_rgba(200,162,75,.55),inset_0_1px_0_rgba(255,255,255,.35)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-108 hover:shadow-[0_20px_40px_-12px_rgba(200,162,75,.65)] sm:inline-flex"
          >
            <span className="relative z-10">{t.nav.start}</span>
            <ArrowLeft className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span aria-hidden className="absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.18),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F28C28]/30 bg-[#F28C28]/10 text-[#FFB45C] backdrop-blur-md transition-all duration-300 hover:bg-[#F28C28]/20 lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="border-t border-white/10 bg-[#111014]/95 shadow-[0_34px_70px_-34px_rgba(0,0,0,.95)] backdrop-blur-2xl lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-5 sm:px-8">
              {NAV_ANCHORS.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.055, duration: 0.3 }}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-semibold text-[#FFF8F0]/75 transition-colors hover:bg-white/[0.06] hover:text-[#FFFFFF]"
                >
                  {t.nav[item.key]}
                  <ArrowUpRight className="h-4 w-4 text-[#FFF8F0]/35" />
                </motion.a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                <Link onClick={closeMenu} href="/login" className="flex h-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-[13px] font-bold text-[#FFF8F0] transition-colors hover:bg-white/[0.1]">
                  {t.nav.login}
                </Link>
                <Link onClick={closeMenu} href="/login?tab=register" className="flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#641B35_0%,#F28C28_45%,#FFB45C_75%,#ffd4a3_100%)] text-[13px] font-bold text-[#FFFFFF] shadow-[0_12px_28px_-12px_rgba(200,162,75,.55)]">
                  {t.nav.start}
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-3 flex items-center justify-between px-2">
                <span className="font-latin text-[9px] font-bold uppercase tracking-[0.24em] text-[#FFF8F0]/45">Academic presence</span>
                <LanguageToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
