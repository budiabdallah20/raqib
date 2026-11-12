'use client';

/**
 * Hero — redesigned as a "main stage introduction" (Section B).
 * Composition: act badge → brand → headline → subheadline → CTAs → trust row,
 * with the live attendance terminal as the side glass exhibit card.
 * Motion policy: CSS-staggered entrances + one-shot transforms only.
 * Perf policy: no continuous shimmer/blur loops; metrics polling isolated here.
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  KeyRound,
  MonitorSmartphone,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { AcademicGateMark } from '@/components/stage/AcademicGateMark';
import { EASE, NumberTicker, QrArt, usePublicMetrics } from './landing-shared';

export function LandingHero() {
  const { t, lang } = useLang();
  const metrics = usePublicMetrics();
  const pct = Math.min(100, metrics?.metrics.attendancePct ?? 0);

  const trust = [
    { icon: ShieldCheck, label: t.hero.trustSecure },
    { icon: MonitorSmartphone, label: t.hero.trustNoApp },
    { icon: KeyRound, label: t.hero.trustFast },
  ];

  return (
    <section className="landing-hero relative mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:min-h-[100svh] lg:justify-center lg:pb-24">
      {/* Subtle curtain-edge framing (static, zero runtime cost) */}
      <div aria-hidden className="theatre-hero-curtain-edge pointer-events-none absolute inset-x-6 top-0 hidden h-2 rounded-b-sm opacity-70 lg:block" />

      <div className="landing-hero-copy relative z-10 flex flex-col items-center text-center">
        <div className="theatre-act-badge stagger-item" aria-label={lang === 'en' ? 'Act one: the academic stage' : 'الفصل الأول: المسرح الأكاديمي'} style={{ ['--d' as string]: '40ms' }}>
          <span>{lang === 'en' ? 'ACT I' : 'الفصل الأول'}</span>
          <span aria-hidden className="theatre-act-diamond" />
          <span>{lang === 'en' ? 'THE ACADEMIC STAGE' : 'المسرح الأكاديمي'}</span>
        </div>

        <div className="stagger-item mt-6 flex flex-wrap items-center justify-center gap-2.5" style={{ ['--d' as string]: '120ms' }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#F28C28]/35 bg-[#0D141F]/80 px-3.5 py-1.5 font-latin text-[9px] font-bold uppercase tracking-[0.24em] text-[#FFB45C] shadow-[0_4px_16px_-4px_rgba(200,162,75,0.3)]">
            <ScanLine className="h-3 w-3" />
            {t.hero.welcome}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#b8abb2]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFB45C]" />
            {t.hero.badge}
          </span>
        </div>

        <div className="landing-hero-brand stagger-item relative mt-7 flex flex-col items-center" style={{ ['--d' as string]: '200ms' }}>
          <AcademicGateMark className="h-14 w-14 drop-shadow-[0_0_18px_rgba(200,169,107,.45)]" decorative />
          <motion.span
            aria-hidden
            className="absolute left-1/2 top-1/2 -z-10 h-[140%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(200,162,75,0.30) 0%, rgba(200,162,75,0.06) 55%, transparent 75%)' }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
          />

          <motion.p
            aria-label="رقيب"
            className="relative select-none font-display text-[clamp(4rem,11vw,7.5rem)] font-black leading-[1.05] tracking-[-0.03em]"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
          >
            <span
              className="bg-[linear-gradient(100deg,#641B35_0%,#FFB45C_28%,#F8F5F2_50%,#FFB45C_72%,#641B35_100%)] bg-clip-text text-transparent [text-shadow:0_18px_50px_rgba(200,162,75,0.25)]"
            >
              رقيب
            </span>
          </motion.p>

          <motion.span
            aria-hidden
            className="mt-3 flex items-center gap-2.5"
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
          >
            <span className="h-px w-14 bg-gradient-to-l from-[#F28C28]/70 to-transparent sm:w-20" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[#FFB45C] shadow-[0_0_12px_rgba(200,162,75,0.9)]" />
            <span className="h-px w-14 bg-gradient-to-r from-[#F28C28]/70 to-transparent sm:w-20" />
          </motion.span>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="mt-2.5 font-latin text-[9px] font-bold uppercase tracking-[0.42em] text-[#b8abb2]/70"
            dir="ltr"
          >
            RAQEEB — Academic Presence
          </motion.span>
        </div>

        <h1 className="landing-hero-title word-reveal mt-7 font-display text-[clamp(2.4rem,5.3vw,4.6rem)] font-black leading-[1.16] tracking-[-0.025em] text-[#FFFFFF]">
          <span className="block">
            {t.hero.line1.map((word, i) => (
              <span
                key={`l1-${i}`}
                style={{ ['--d' as string]: `${120 + i * 90}ms` }}
                className={i === t.hero.line1.length - 1 ? 'text-gold-gradient' : ''}
              >
                {word}
                {i < t.hero.line1.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
          <span className="mt-1 block text-[#e5e7eb]">
            {t.hero.line2.map((word, i) => (
              <span
                key={`l2-${i}`}
                style={{ ['--d' as string]: `${390 + i * 90}ms` }}
                className={i === t.hero.line2.length - 1 ? 'text-gold-gradient' : ''}
              >
                {word}
                {i < t.hero.line2.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
        </h1>

        <p
          className="landing-hero-lead stagger-item mt-6 max-w-xl text-[15px] leading-[1.95] text-[#b8abb2] sm:text-[16px]"
          style={{ ['--d' as string]: '640ms' }}
        >
          {t.hero.sub}
        </p>

        <div className="landing-hero-actions stagger-item mt-8 flex flex-wrap items-center justify-center gap-3" style={{ ['--d' as string]: '760ms' }}>
          <Link
            href="/login?tab=register"
            className="group relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-[linear-gradient(110deg,#641B35,#F28C28_45%,#FFB45C_75%,#ffd4a3)] px-6 text-[13px] font-bold text-[#FFFFFF] shadow-[0_20px_46px_-16px_rgba(200,162,75,.7)] ring-1 ring-gold-300/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_62px_-14px_rgba(200,162,75,.8)]"
          >
            <span className="relative z-10">{t.hero.ctaPrimary}</span>
            <ArrowLeft className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.22),transparent_45%)]" />
            <span aria-hidden className="absolute inset-y-0 -left-12 w-12 -skew-x-12 bg-white/20 blur-md transition-all duration-700 group-hover:left-[110%]" />
          </Link>
          <Link
            href="#features"
            className="group inline-flex h-12 items-center gap-2.5 rounded-full border border-white/15 bg-[#211B20]/70 px-6 text-[13px] font-bold text-[#FFFFFF] shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F28C28]/45 hover:bg-[#3A1020]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]/60"
          >
            {t.hero.ctaSecondary}
            <ArrowUpRight className="h-4 w-4 text-[#F28C28] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="stagger-item mt-7 flex flex-wrap items-center justify-center gap-3" style={{ ['--d' as string]: '880ms' }}>
          {trust.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[10.5px] font-semibold text-[#c9cfd8]"
            >
              <Icon className="h-3.5 w-3.5 text-[#FFB45C]" />
              {label}
            </span>
          ))}
        </div>

        <div className="stagger-item mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-white/[0.08] pt-5" style={{ ['--d' as string]: '960ms' }}>
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {['م', 'ع', 'س', 'ن'].map((letter, i) => (
              <span
                key={letter}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#111014] text-[11px] font-bold text-[#211B20] shadow-sm ${
                  ['bg-[#FFB45C]', 'bg-[#FFB45C]', 'bg-[#F28C28]', 'bg-[#FFFFFF]'][i]
                }`}
              >
                {letter}
              </span>
            ))}
          </div>
          <div className="h-8 w-px bg-white/[0.10]" />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFB45C]/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFB45C]" />
            </span>
            <p className="text-[11px] font-medium leading-5 text-[#b8abb2]">
              {t.metrics.computedNote}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Terminal — the side glass exhibit */}
      <div className="theatre-hero-terminal stagger-item relative z-10 mx-auto mt-14 w-full max-w-[560px] lg:mt-20" style={{ ['--d' as string]: '420ms' }}>
        <div className="theatre-exhibit-tag" aria-hidden>{t.hero.exhibitTag}</div>
        <div aria-hidden className="absolute -inset-10 -z-10 rounded-[50px] bg-[radial-gradient(circle_at_55%_40%,rgba(200,162,75,.18),transparent_62%),radial-gradient(circle_at_20%_80%,rgba(103,216,234,.08),transparent_58%)]" />
        <div aria-hidden className="absolute -inset-5 -z-10 rounded-[42px] border border-[#F28C28]/25 [transform:rotate(-3deg)]" />
        <div aria-hidden className="absolute -inset-2 -z-10 rounded-[36px] border border-white/10" />

        <div className="relative rounded-[32px] border border-white/10 bg-[#211B20]/72 p-2.5 shadow-[0_34px_90px_-36px_rgba(0,0,0,.7),0_0_0_1px_rgba(200,162,75,0.08)] backdrop-blur-2xl">
          <div className="relative overflow-hidden rounded-[26px] bg-[#111014] px-4 py-5 text-[#FFFFFF] shadow-[inset_0_1px_0_rgba(255,255,255,.08)] sm:px-5">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(200,162,75,.18),transparent_46%),radial-gradient(circle_at_90%_100%,rgba(103,216,234,.12),transparent_48%)]" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:34px_34px] opacity-60" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AcademicGateMark className="h-7 w-7" decorative />
                <div>
                  <p className="font-display text-[13px] font-bold leading-none">رقيب</p>
                  <p className="mt-1 font-latin text-[8px] font-medium uppercase tracking-[0.2em] text-[#b8abb2]">Live attendance</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFB45C]/25 bg-[#FFB45C]/[0.08] px-2.5 py-1 font-latin text-[8px] font-bold uppercase tracking-[0.16em] text-[#FFB45C]">
                <span className="h-1 w-1 animate-pulse rounded-full bg-[#FFB45C]" />
                {t.mock.live}
              </span>
            </div>

            <div className="relative mt-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-[#b8abb2]">{t.mock.board}</p>
                <p className="mt-1 font-display text-lg font-bold tracking-[-0.02em] text-[#FFFFFF]">{t.mock.today}</p>
              </div>
              <div className="text-left">
                <p className="font-latin text-[8px] uppercase tracking-[0.18em] text-[#b8abb2]/70">{t.mock.area}</p>
              </div>
            </div>

            <div className="relative mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative rounded-[20px] border border-[#F28C28]/35 bg-[#FAF6EE] p-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
                <QrArt className="mx-auto max-w-[188px]" />
                <div className="mt-2 flex items-center justify-center gap-1.5 pb-0.5">
                  <ScanLine className="h-3 w-3 text-[#8F6E30]" />
                  <p className="text-[9px] font-bold text-[#140E02]">{t.mock.scan}</p>
                </div>
              </div>
              <div className="flex flex-row items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.045] p-3.5 sm:w-[118px] sm:flex-col sm:justify-center">
                <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#FFB45C 0deg ${pct * 3.6}deg, rgba(255,255,255,.10) ${pct * 3.6}deg 360deg)`,
                    }}
                  />
                  <div className="absolute inset-[5px] rounded-full bg-[#111014]" />
                  <div className="relative text-center">
                    <p className="font-latin text-[19px] font-bold leading-none text-white">
                      <NumberTicker value={metrics?.metrics.attendancePct} decimals={1} />
                    </p>
                    <p className="mt-1 font-latin text-[7px] uppercase tracking-[0.15em] text-[#b8abb2]">
                      {lang === 'en' ? 'live %' : 'حيّ'}
                    </p>
                  </div>
                </div>
                <div className="text-center sm:mt-1">
                  <p className="font-latin text-[8px] uppercase tracking-[0.16em] text-[#b8abb2]">{t.mock.pct}</p>
                  <p className="mt-1 font-latin text-[13px] font-bold text-[#FFB45C]">
                    <NumberTicker value={metrics?.metrics.scans} />
                    <span className="text-[0.6em] font-semibold opacity-80">
                      {' '}
                      {lang === 'en' ? 'scans' : 'مسحة'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-3 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.85, duration: 1.1, ease: EASE }}
                className="relative h-1.5 rounded-full bg-[linear-gradient(90deg,#FFB45C,#F28C28,#FFB45C)]"
              >
                <span aria-hidden className="absolute inset-y-0 right-0 w-6 bg-white/30 blur-sm" />
              </motion.div>
            </div>

            <div className="relative mt-4 space-y-2">
              {[
                {
                  label: t.metrics.lectures,
                  count: metrics?.metrics.lectures,
                  sub: lang === 'en' ? 'each with a rotating QR code' : 'لكل محاضرة رمز QR دوراني',
                  status: lang === 'en' ? 'live' : 'لحظي',
                  active: true,
                },
                {
                  label: t.metrics.scans,
                  count: metrics?.metrics.scans,
                  sub: lang === 'en' ? 'counted instantly in reports' : 'تُحتسب فوريًا في التقارير',
                  status: lang === 'en' ? 'verified' : 'موثق',
                  active: false,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                    row.active ? 'border-brand-300/20 bg-white/[0.07]' : 'border-white/[0.07] bg-white/[0.035]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold text-[#FFF8F0]/90">
                      <NumberTicker value={row.count} /> {row.label}
                    </p>
                    <p className="mt-0.5 text-[8px] text-brand-100/40">{row.sub}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 font-latin text-[7px] font-bold uppercase tracking-[0.12em] ${row.active ? 'bg-brand-400/15 text-brand-200' : 'bg-white/[0.06] text-brand-100/45'}`}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
