'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BellRing,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Fingerprint,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Logo, LogoMark } from '@/components/shared/Logo';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { WelcomeGate } from '@/components/shared/WelcomeGate';
import { PolicyModal, type PolicyTab } from '@/components/auth/PolicyModal';
import { TECH_LOGOS, TechLogoMark } from '@/components/shared/TechLogos';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const NAV_ANCHORS = [
  { href: '#features', key: 'features' },
  { href: '#how', key: 'how' },
  { href: '#roles', key: 'roles' },
  { href: '#security', key: 'security' },
] as const;

const FEATURE_ICONS = [QrCode, LayoutDashboard, BarChart3, BellRing, ShieldCheck, GraduationCap];
const FEATURE_TINTS = [
  'bg-brand-500/10 text-brand-700 ring-brand-500/20',
  'bg-gold-500/12 text-gold-700 ring-gold-500/25',
  'bg-ink-500/10 text-ink-700 ring-ink-500/20',
  'bg-ember-500/10 text-ember-600 ring-ember-500/18',
  'bg-brand-700/10 text-brand-800 ring-brand-700/20',
  'bg-gold-600/10 text-gold-800 ring-gold-600/20',
];

const STEP_ICONS = [Fingerprint, ScanLine, Zap];

const ROLE_META = [
  { key: 'student' as const, icon: GraduationCap, accent: '#a3e635', tint: 'from-brand-500/14' },
  { key: 'professor' as const, icon: BookOpen, accent: '#c8a24b', tint: 'from-gold-500/16' },
  { key: 'admin' as const, icon: LayoutDashboard, accent: '#204136', tint: 'from-ink-500/14' },
];

type Metrics = {
  students: number;
  lectures: number;
  scans: number;
  attendancePct: number;
};

type PublicMetrics = {
  metrics: Metrics;
  demoMode?: boolean;
  updatedAt?: string;
};

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 26 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' as const },
    transition: { duration: 0.72, delay, ease: EASE },
  };
}

function NumberTicker({
  value,
  decimals = 0,
  suffix = '',
}: {
  value: number | null | undefined;
  decimals?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (value == null) return;
    const start = performance.now();
    const from = 0;
    const duration = 900;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [value]);

  if (value == null) return <span className="text-ink-300">—</span>;
  const text = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('en-US');
  return (
    <span className="tabular-nums">
      {text}
      {suffix && <span className="text-[0.55em] font-semibold text-ink-500">{suffix}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* QR artwork                                                          */
/* ------------------------------------------------------------------ */

const QR_SIZE = 21;

function qrModuleOn(row: number, col: number) {
  const finderZones = [
    [0, 0],
    [0, QR_SIZE - 7],
    [QR_SIZE - 7, 0],
  ];
  for (const [r0, c0] of finderZones) {
    const dr = row - r0;
    const dc = col - c0;
    if (dr >= 0 && dr < 7 && dc >= 0 && dc < 7) {
      const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
      if (ring === 3) return true;
      if (ring <= 1) return true;
      return false;
    }
  }
  // quiet zones around the eyes keep the pattern readable
  if (row < 8 && col < 8) return false;
  if (row < 8 && col > QR_SIZE - 9) return false;
  if (row > QR_SIZE - 9 && col < 8) return false;
  const mixed = (row * 17 + col * 31 + row * col * 7 + (row ^ col) * 13) % 29;
  return mixed < 13 || (row * 3 + col * 5) % 11 === 0;
}

const QR_CELLS = Array.from({ length: QR_SIZE * QR_SIZE }, (_, i) => {
  const row = Math.floor(i / QR_SIZE);
  const col = i % QR_SIZE;
  return { row, col, on: qrModuleOn(row, col) };
});

function QrArt({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative grid aspect-square w-full rounded-[14px] bg-white p-2.5 shadow-[0_18px_45px_-24px_rgba(8,22,17,.45)] ${className}`}
      style={{ gridTemplateColumns: `repeat(${QR_SIZE}, minmax(0, 1fr))` }}
      role="img"
      aria-label="رمز حضور رقيب"
    >
      {QR_CELLS.map((cell) => (
        <span
          key={`${cell.row}-${cell.col}`}
          className={`aspect-square rounded-[1.5px] ${cell.on ? 'bg-[#101608]' : 'bg-transparent'}`}
        />
      ))}
      <span aria-hidden className="pointer-events-none absolute inset-2 rounded-[10px] border border-brand-500/0" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-2 h-8 animate-scan rounded-full bg-[linear-gradient(180deg,rgba(163,230,53,0),rgba(163,230,53,.5),rgba(200,162,75,.2),rgba(163,230,53,0))] blur-[1px]"
      />
      <span aria-hidden className="pointer-events-none absolute left-1.5 top-1.5 h-4 w-4 rounded-tl-[6px] border-l-2 border-t-2 border-gold-500/70" />
      <span aria-hidden className="pointer-events-none absolute bottom-1.5 right-1.5 h-4 w-4 rounded-br-[6px] border-b-2 border-r-2 border-gold-500/70" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small chrome                                                        */
/* ------------------------------------------------------------------ */

function ClockChip() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-2.5 py-1.5 font-latin text-[10px] font-semibold tracking-[0.12em] text-ink-600 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] backdrop-blur-md">
      <Clock3 className="h-3 w-3 text-brand-600" />
      <span dir="ltr">{now ? now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
      <span className="h-1 w-1 rounded-full bg-gold-500/70" />
    </span>
  );
}

function DateChip() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => setNow(new Date()), []);
  return (
    <span className="hidden items-center gap-1.5 rounded-full border border-white/70 bg-white/45 px-2.5 py-1.5 font-latin text-[10px] font-semibold tracking-[0.12em] text-ink-600 backdrop-blur-md 2xl:inline-flex">
      <span dir="ltr">{now ? now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}</span>
    </span>
  );
}

function StatusPill({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-latin text-[9px] font-bold uppercase tracking-[0.18em] ${
        dark
          ? 'border-brand-300/20 bg-white/[0.06] text-brand-100'
          : 'border-brand-500/20 bg-white/60 text-brand-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]'
      } backdrop-blur-md`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400/60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
      </span>
      All systems operational
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Landing page                                                        */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  const { t, lang } = useLang();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [policyOpen, setPolicyOpen] = React.useState(false);
  const [policyTab, setPolicyTab] = React.useState<PolicyTab>('privacy');
  const [metrics, setMetrics] = React.useState<PublicMetrics | null>(null);

  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
  }, [lang, t.dir]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  React.useEffect(() => {
    let alive = true;
    fetch('/api/public/metrics', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('metrics'))))
      .then((data: PublicMetrics) => {
        if (alive) setMetrics(data);
      })
      .catch(() => {
        /* the page is designed to read beautifully before the numbers arrive */
      });
    return () => {
      alive = false;
    };
  }, []);

  const openPolicy = (tab: PolicyTab) => {
    setPolicyTab(tab);
    setPolicyOpen(true);
  };

  const closeMenu = () => setMenuOpen(false);

  const stats = [
    { label: t.metrics.students, value: metrics?.metrics.students, icon: Users, suffix: '' },
    { label: t.metrics.lectures, value: metrics?.metrics.lectures, icon: BookOpen, suffix: '' },
    { label: t.metrics.scans, value: metrics?.metrics.scans, icon: ScanLine, suffix: '' },
    { label: t.metrics.attendance, value: metrics?.metrics.attendancePct, icon: BarChart3, decimals: 1, suffix: '%' },
  ];

  return (
    <div className="relative min-h-screen overflow-clip bg-[#f7faf7] text-ink-950">
      {/* ambient canvas */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gold opacity-70" />
        <div className="absolute inset-0 bg-grid opacity-[0.30] [mask-image:linear-gradient(180deg,#000_0%,#000_54%,transparent_100%)]" />
        <div className="orb -left-32 top-[8%] h-[30rem] w-[30rem] bg-brand-400/20" />
        <div className="orb -right-28 top-[2%] h-[24rem] w-[24rem] bg-gold-400/18" />
        <div className="orb left-[36%] top-[42%] h-[26rem] w-[26rem] bg-brand-300/10" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/45 to-transparent" />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* navigation                                                       */}
      {/* ---------------------------------------------------------------- */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/70 bg-[#f7faf7]/78 shadow-[0_18px_45px_-32px_rgba(19,56,44,.32)] backdrop-blur-2xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
          <Link href="/" className="group flex shrink-0 items-center" aria-label="رقيب — الصفحة الرئيسية">
            <Logo markClassName="h-10 w-10 transition-transform duration-500 group-hover:rotate-[-4deg]" />
          </Link>

          <nav className="hidden items-center gap-0.5 rounded-full border border-white/60 bg-white/38 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] backdrop-blur-xl lg:flex">
            {NAV_ANCHORS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group relative rounded-full px-4 py-2 text-[13px] font-semibold text-ink-600 transition-colors duration-200 hover:bg-white/65 hover:text-ink-950"
              >
                {t.nav[item.key]}
                <span className="absolute inset-x-4 -bottom-[1px] h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-gold-500/70 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
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
              className="hidden rounded-full px-3 py-2 text-[12px] font-semibold text-ink-600 transition-colors hover:text-ink-950 sm:inline-flex"
            >
              {t.nav.login}
            </Link>
            <Link
              href="/login?tab=register"
              className="group relative hidden h-10 items-center gap-2 overflow-hidden rounded-full bg-[#0b1f19] px-4 text-[12px] font-bold text-[#f6fbf7] shadow-[0_12px_30px_-12px_rgba(11,31,25,.45)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#123429] hover:shadow-[0_18px_38px_-12px_rgba(11,31,25,.5)] sm:inline-flex"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/55 text-ink-700 backdrop-blur-md transition-colors hover:bg-white lg:hidden"
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
              className="border-t border-white/70 bg-[#f7faf7]/95 backdrop-blur-2xl lg:hidden"
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
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-semibold text-ink-700 transition-colors hover:bg-white/70 hover:text-ink-950"
                  >
                    {t.nav[item.key]}
                    <ArrowUpRight className="h-4 w-4 text-ink-300" />
                  </motion.a>
                ))}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-950/[0.06] pt-4">
                  <Link onClick={closeMenu} href="/login" className="flex h-11 items-center justify-center rounded-full border border-ink-950/10 bg-white/60 text-[13px] font-bold text-ink-800">
                    {t.nav.login}
                  </Link>
                  <Link onClick={closeMenu} href="/login?tab=register" className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#0b1f19] text-[13px] font-bold text-white">
                    {t.nav.start}
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="mt-3 flex items-center justify-between px-2">
                  <span className="font-latin text-[9px] font-bold uppercase tracking-[0.24em] text-ink-400">Academic presence</span>
                  <LanguageToggle />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* -------------------------------------------------------------- */}
        {/* hero                                                           */}
        {/* -------------------------------------------------------------- */}
        <section className="relative mx-auto w-full max-w-7xl px-5 pb-12 pt-12 sm:px-8 sm:pt-20 lg:pb-24 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 xl:gap-16">
            <div className="relative z-10">
              <div className="stagger-item flex flex-wrap items-center gap-2.5" style={{ ['--d' as string]: '40ms' }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/25 bg-white/55 px-3 py-1.5 font-latin text-[9px] font-bold uppercase tracking-[0.24em] text-gold-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-md">
                  <Sparkles className="h-3 w-3" />
                  {t.hero.welcome}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink-400">
                  <span className="h-1 w-1 rounded-full bg-brand-500" />
                  {t.hero.badge}
                </span>
              </div>

              <h1 className="word-reveal mt-7 font-display text-[clamp(2.7rem,6.8vw,5.2rem)] font-bold leading-[0.98] tracking-[-0.055em] text-ink-950">
                <span className="block">
                  {t.hero.line1.map((word, i) => (
                    <span
                      key={`l1-${i}`}
                      style={{ ['--d' as string]: `${120 + i * 90}ms` }}
                      className={i === t.hero.line1.length - 1 ? 'text-mint-gradient' : ''}
                    >
                      {word}
                      {i < t.hero.line1.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </span>
                <span className="mt-1 block text-ink-800">
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
                className="stagger-item mt-6 max-w-xl text-[15px] leading-[1.95] text-ink-600 sm:text-[16px]"
                style={{ ['--d' as string]: '640ms' }}
              >
                {t.hero.sub}
              </p>

              <div className="stagger-item mt-8 flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '760ms' }}>
                <Link
                  href="/login?tab=register"
                  className="group relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78_75%,#f0e0a9)] px-6 text-[13px] font-bold text-[#1c1503] shadow-[0_20px_46px_-16px_rgba(200,162,75,.7)] ring-1 ring-gold-300/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_62px_-14px_rgba(200,162,75,.8)]"
                >
                  <span className="relative z-10">{t.hero.ctaPrimary}</span>
                  <ArrowLeft className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.22),transparent_45%)]" />
                  <span aria-hidden className="absolute inset-y-0 -left-12 w-12 -skew-x-12 bg-white/20 blur-md transition-all duration-700 group-hover:left-[110%]" />
                </Link>
                <Link
                  href="/login"
                  className="group inline-flex h-12 items-center gap-2.5 rounded-full border border-ink-950/10 bg-white/55 px-6 text-[13px] font-bold text-ink-800 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/25 hover:bg-white/80"
                >
                  {t.hero.ctaSecondary}
                  <ArrowUpRight className="h-4 w-4 text-ink-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="stagger-item mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5" style={{ ['--d' as string]: '860ms' }}>
                {[
                  { icon: ShieldCheck, label: t.hero.trustSecure },
                  { icon: QrCode, label: t.hero.trustNoApp },
                  { icon: Zap, label: t.hero.trustFast },
                ].map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-500">
                    <item.icon className="h-3.5 w-3.5 text-brand-600" />
                    {item.label}
                  </span>
                ))}
              </div>

              <div className="stagger-item mt-10 flex items-center gap-4 border-t border-ink-950/[0.07] pt-5" style={{ ['--d' as string]: '940ms' }}>
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {['م', 'ع', 'س', 'ن'].map((letter, i) => (
                    <span
                      key={letter}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7faf7] text-[11px] font-bold text-white shadow-sm ${
                        ['bg-brand-600', 'bg-[#2c3d10]', 'bg-gold-600', 'bg-ink-700'][i]
                      }`}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
                <div className="h-8 w-px bg-ink-950/[0.08]" />
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400/50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                  </span>
                  <p className="text-[11px] font-medium leading-5 text-ink-500">
                    {t.footer.collage}
                  </p>
                </div>
              </div>
            </div>

            {/* attendance terminal */}
            <div className="stagger-item relative mx-auto w-full max-w-[500px] lg:max-w-none" style={{ ['--d' as string]: '420ms' }}>
              <div aria-hidden className="absolute -inset-10 -z-10 rounded-[50px] bg-[radial-gradient(circle_at_55%_40%,rgba(163,230,53,.14),transparent_64%)] blur-2xl" />
              <div aria-hidden className="absolute -inset-5 -z-10 rounded-[42px] border border-gold-500/20 [transform:rotate(-3deg)]" />
              <div aria-hidden className="absolute -inset-2 -z-10 rounded-[36px] border border-white/70" />

              <div className="relative rounded-[32px] border border-white/80 bg-white/55 p-2.5 shadow-[0_34px_90px_-36px_rgba(19,56,44,.48)] backdrop-blur-2xl">
                <div className="relative overflow-hidden rounded-[26px] bg-[#0a0c07] px-4 py-5 text-[#f2f8e8] shadow-[inset_0_1px_0_rgba(255,255,255,.08)] sm:px-5">
                  <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(163,230,53,.2),transparent_46%),radial-gradient(circle_at_90%_100%,rgba(200,162,75,.18),transparent_48%)]" />
                  <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:34px_34px] opacity-60" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LogoMark framed={false} className="h-7 w-7" />
                      <div>
                        <p className="font-display text-[13px] font-bold leading-none">رقيب</p>
                        <p className="mt-1 font-latin text-[8px] font-medium uppercase tracking-[0.2em] text-brand-200/55">Live attendance</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-300/20 bg-brand-300/[0.08] px-2.5 py-1 font-latin text-[8px] font-bold uppercase tracking-[0.16em] text-brand-200">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-brand-300" />
                      {t.mock.live}
                    </span>
                  </div>

                  <div className="relative mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-brand-100/55">{t.mock.board}</p>
                      <p className="mt-1 font-display text-lg font-bold tracking-[-0.02em]">{t.mock.today}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-latin text-[8px] uppercase tracking-[0.18em] text-brand-100/40">{t.mock.area}</p>
                    </div>
                  </div>

                  <div className="relative mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="relative rounded-[20px] border border-white/15 bg-[#f7faf7] p-2.5">
                      <QrArt className="mx-auto max-w-[188px]" />
                      <div className="mt-2 flex items-center justify-center gap-1.5 pb-0.5">
                        <ScanLine className="h-3 w-3 text-brand-700" />
                        <p className="text-[9px] font-bold text-ink-700">{t.mock.scan}</p>
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.045] p-3.5 sm:w-[118px] sm:flex-col sm:justify-center">
                      <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full">
                        <div
                          aria-hidden
                          className="absolute inset-0 rounded-full"
                          style={{
                            background:
                              'conic-gradient(#bef264 0deg 320deg, rgba(255,255,255,.10) 320deg 360deg)',
                          }}
                        />
                        <div className="absolute inset-[5px] rounded-full bg-[#0a0c07]" />
                        <div className="relative text-center">
                          <p className="font-latin text-[19px] font-bold leading-none text-white">98.4</p>
                          <p className="mt-1 font-latin text-[7px] uppercase tracking-[0.15em] text-brand-200/55">accuracy</p>
                        </div>
                      </div>
                      <div className="text-center sm:mt-1">
                        <p className="font-latin text-[8px] uppercase tracking-[0.16em] text-brand-100/45">{t.mock.pct}</p>
                        <p className="mt-1 font-latin text-[13px] font-bold text-gold-200">78.6%</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-3 overflow-hidden rounded-full bg-white/[0.08]">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '78.6%' }}
                      transition={{ delay: 0.85, duration: 1.1, ease: EASE }}
                      className="relative h-1.5 rounded-full bg-[linear-gradient(90deg,#65a30d,#a3e635,#bef264,#c8a24b)]"
                    >
                      <span aria-hidden className="absolute inset-y-0 right-0 w-6 bg-white/30 blur-sm" />
                    </motion.div>
                  </div>

                  <div className="relative mt-4 space-y-2">
                    {[
                      { course: t.mock.courseA, time: t.mock.timeA, status: t.mock.statusDone, pct: '92%', active: true },
                      { course: t.mock.courseB, time: t.mock.timeB, status: t.mock.statusNext, pct: '—', active: false },
                    ].map((lecture) => (
                      <div
                        key={lecture.course}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                          lecture.active ? 'border-brand-300/20 bg-white/[0.07]' : 'border-white/[0.07] bg-white/[0.035]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-bold text-[#f2f8e8]/90">{lecture.course}</p>
                          <p className="mt-0.5 text-[8px] text-brand-100/40">{lecture.time} · {t.mock.room}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-1 font-latin text-[7px] font-bold uppercase tracking-[0.12em] ${lecture.active ? 'bg-brand-400/15 text-brand-200' : 'bg-white/[0.06] text-brand-100/45'}`}>
                          {lecture.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-gold-400/25 bg-gold-400/[0.10] py-2.5 text-[10px] font-bold text-gold-100 transition-colors hover:bg-gold-400/[0.16]"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    {t.mock.scan}
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 18, y: 8 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.1, duration: 0.7, ease: EASE }}
                className="absolute -left-3 bottom-20 hidden items-center gap-2.5 rounded-2xl border border-white/80 bg-white/80 px-3.5 py-2.5 shadow-[0_18px_40px_-24px_rgba(19,56,44,.42)] backdrop-blur-xl sm:flex lg:-left-7"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-ink-800">{t.mock.signed}</p>
                  <p className="mt-0.5 font-latin text-[8px] tracking-[0.12em] text-ink-400">{t.mock.signedTime}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -18, y: -8 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.25, duration: 0.7, ease: EASE }}
                className="absolute -right-3 top-24 hidden items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 shadow-[0_18px_40px_-24px_rgba(19,56,44,.42)] backdrop-blur-xl sm:flex lg:-right-6"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-500" />
                </span>
                <span className="font-latin text-[9px] font-bold uppercase tracking-[0.16em] text-ink-600">{t.metrics.attendance}</span>
                <span className="font-latin text-[11px] font-bold text-ink-900">+12.4%</span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* tech marquee                                                   */}
        {/* -------------------------------------------------------------- */}
        <section aria-label="Technology stack" className="relative border-y border-ink-950/[0.06] bg-white/30 py-5 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 sm:px-8">
            <span className="hidden shrink-0 font-latin text-[9px] font-bold uppercase tracking-[0.26em] text-ink-400 md:block">Built with</span>
            <div className="relative flex-1 overflow-hidden mask-fade-x">
              <div className="flex w-max animate-marquee items-center gap-9 hover:[animation-play-state:paused]">
                {[...TECH_LOGOS, ...TECH_LOGOS].map((tech, i) => (
                  <span key={`${tech.name}-${i}`} className="flex shrink-0 items-center gap-2 text-ink-400/80 transition-colors hover:text-brand-700">
                    <TechLogoMark index={i % TECH_LOGOS.length} className="h-4 w-4" />
                    <span className="font-latin text-[10px] font-semibold tracking-[0.12em]">{tech.name}</span>
                  </span>
                ))}
              </div>
            </div>
            <span className="hidden shrink-0 font-latin text-[9px] font-medium tracking-[0.16em] text-ink-300 sm:block">{t.footer.stackNote}</span>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* live metrics                                                   */}
        {/* -------------------------------------------------------------- */}
        <section className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-latin text-[9px] font-bold uppercase tracking-[0.28em] text-gold-700">Live metrics</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-ink-950 sm:text-3xl">
                {t.metrics.computedNote}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {metrics?.demoMode && (
                <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 font-latin text-[9px] font-bold uppercase tracking-[0.16em] text-gold-700">
                  {t.metrics.demoBadge}
                </span>
              )}
              <StatusPill />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                {...fadeUp(i * 0.06)}
                className="card-glow group relative overflow-hidden rounded-[24px] border border-gold-500/15 bg-white/55 p-5 shadow-[0_22px_55px_-38px_rgba(28,44,10,.36),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/35 hover:bg-white/75 hover:shadow-[0_28px_60px_-30px_rgba(200,162,75,.5)]"
              >
                <span aria-hidden className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/[0.1] text-gold-700 ring-1 ring-gold-500/20 shadow-[0_0_24px_-6px_rgba(200,162,75,.4)]">
                    <stat.icon className="h-4 w-4" />
                  </span>
                  <span className="font-latin text-[9px] font-bold tracking-[0.2em] text-ink-300">0{i + 1}</span>
                </div>
                <p className="mt-5 font-display text-[2rem] font-bold leading-none tracking-[-0.045em] text-brand-sheen animate-counter-glow">
                  <NumberTicker value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-[10px] font-medium leading-5 text-ink-500">{stat.label}</p>
                <span aria-hidden className="mt-4 block h-1 w-8 rounded-full bg-gradient-to-r from-brand-500 to-gold-500 opacity-60 transition-all duration-300 group-hover:w-14 group-hover:opacity-100" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* features                                                       */}
        {/* -------------------------------------------------------------- */}
        <section id="features" className="relative scroll-mt-24 border-t border-ink-950/[0.06] py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
              <motion.div {...fadeUp()}>
                <div className="flex items-center gap-3">
                  <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold-500/70" />
                  <span className="font-latin text-[9px] font-bold uppercase tracking-[0.3em] text-gold-700">01 — Platform</span>
                </div>
                <h2 className="mt-5 max-w-lg font-display text-[clamp(2.1rem,4.6vw,3.7rem)] font-bold leading-[1.02] tracking-[-0.05em] text-ink-950">
                  {t.sections.everything}{' '}
                  <span className="text-mint-gradient">{t.sections.everythingGold}</span>
                </h2>
              </motion.div>
              <motion.p {...fadeUp(0.08)} className="max-w-xl text-[14px] leading-[1.95] text-ink-600 lg:justify-self-end">
                {t.sections.everythingSub}
              </motion.p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {t.features.map((feature, i) => {
                const Icon = FEATURE_ICONS[i] ?? QrCode;
                return (
                  <motion.article
                    key={feature.title}
                    {...fadeUp(0.04 * i)}
                    className="card-glow group relative overflow-hidden rounded-[26px] border border-white/75 bg-white/52 p-6 shadow-[0_24px_60px_-42px_rgba(28,44,10,.4),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/35 hover:bg-white/72 hover:shadow-[0_30px_70px_-36px_rgba(200,162,75,.48)] sm:p-7"
                  >
                    <span aria-hidden className="absolute inset-x-8 top-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-gold-500/65 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
                    <span aria-hidden className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-400/[0.06] blur-2xl transition-colors duration-500 group-hover:bg-brand-400/[0.12]" />
                    <div className="flex items-start justify-between">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${FEATURE_TINTS[i] ?? FEATURE_TINTS[0]}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-latin text-[10px] font-bold tracking-[0.22em] text-ink-300">0{i + 1}</span>
                    </div>
                    <h3 className="mt-6 font-display text-[17px] font-bold tracking-[-0.02em] text-ink-950">{feature.title}</h3>
                    <p className="mt-2.5 text-[12px] leading-[1.9] text-ink-500">{feature.body}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-ink-950/[0.06] pt-4">
                      <span className="font-latin text-[8px] font-bold uppercase tracking-[0.22em] text-ink-300">Raqib module</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-ink-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* how it works — dark jewel band                                 */}
        {/* -------------------------------------------------------------- */}
        <section id="how" className="relative scroll-mt-24 px-3 sm:px-5">
          <div className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-[38px] bg-[#0a0c07] px-5 py-20 text-[#f2f8e8] shadow-[0_40px_100px_-46px_rgba(10,12,7,.72)] sm:px-8 sm:py-24">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(163,230,53,.2),transparent_44%),radial-gradient(circle_at_88%_100%,rgba(200,162,75,.2),transparent_48%)]" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:58px_58px] opacity-50 [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />
            <div aria-hidden className="absolute -right-10 top-4 font-display text-[22vw] font-bold leading-none text-white/[0.026]">03</div>

            <div className="relative mx-auto max-w-6xl">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                <motion.div {...fadeUp()}>
                  <div className="flex items-center gap-3">
                    <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold-400/70" />
                    <span className="font-latin text-[9px] font-bold uppercase tracking-[0.3em] text-gold-300/80">{t.sections.stepsKicker}</span>
                  </div>
                  <h2 className="mt-5 font-display text-[clamp(2.2rem,4.8vw,3.9rem)] font-bold leading-[1.02] tracking-[-0.05em]">
                    {t.sections.steps}{' '}
                    <span className="text-gold-gradient">{t.sections.stepsGold}</span>
                  </h2>
                </motion.div>
                <motion.p {...fadeUp(0.08)} className="max-w-lg text-[13px] leading-[1.95] text-brand-100/55 lg:justify-self-end">
                  {t.sections.rolesSub}
                </motion.p>
              </div>

              <div className="relative mt-14 grid gap-4 md:grid-cols-3">
                <div aria-hidden className="absolute left-[12%] right-[12%] top-12 hidden h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent md:block" />
                {(['1', '2', '3'] as const).map((key, i) => {
                  const step = t.stepCards[key];
                  const Icon = STEP_ICONS[i];
                  return (
                    <motion.div
                      key={key}
                      {...fadeUp(0.1 + i * 0.08)}
                      className="group relative rounded-[24px] border border-white/[0.10] bg-white/[0.045] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-gold-300/25 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-300/20 bg-gold-300/[0.08] text-gold-200 shadow-[0_0_28px_-8px_rgba(200,162,75,.35)]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="font-latin text-[28px] font-bold leading-none text-white/[0.09]">0{i + 1}</span>
                      </div>
                      <h3 className="mt-7 font-display text-lg font-bold tracking-[-0.02em] text-[#f2faf4]">{step.title}</h3>
                      <p className="mt-2.5 text-[12px] leading-[1.9] text-brand-100/50">{step.body}</p>
                      <div className="mt-6 h-px w-full bg-gradient-to-r from-white/[0.08] to-transparent" />
                      <p className="mt-4 font-latin text-[8px] font-bold uppercase tracking-[0.22em] text-brand-200/30">Step {key} / 03</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* roles                                                          */}
        {/* -------------------------------------------------------------- */}
        <section id="roles" className="relative scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <motion.div {...fadeUp()} className="flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold-500/70" />
                <span className="font-latin text-[9px] font-bold uppercase tracking-[0.3em] text-gold-700">{t.sections.rolesKicker}</span>
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold-500/70" />
              </motion.div>
              <motion.h2 {...fadeUp(0.05)} className="mt-5 font-display text-[clamp(2.15rem,4.8vw,3.9rem)] font-bold leading-[1.02] tracking-[-0.05em] text-ink-950">
                {t.sections.roles} <span className="text-mint-gradient">{t.sections.rolesGold}</span>
              </motion.h2>
              <motion.p {...fadeUp(0.1)} className="mt-4 text-[13px] leading-[1.95] text-ink-500">
                {t.sections.rolesSub}
              </motion.p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {ROLE_META.map((meta, i) => {
                const role = t.roleCards[meta.key];
                const Icon = meta.icon;
                return (
                  <motion.article
                    key={meta.key}
                    {...fadeUp(0.06 * i)}
                    className="group relative overflow-hidden rounded-[28px] border border-white/75 bg-white/55 p-6 shadow-[0_26px_65px_-44px_rgba(19,56,44,.44),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/75 hover:shadow-[0_32px_72px_-38px_rgba(19,56,44,.46)] sm:p-7"
                  >
                    <div aria-hidden className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${meta.tint} to-transparent opacity-70`} />
                    <div aria-hidden className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-white/60" />
                    <div className="relative flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/75 shadow-sm" style={{ color: meta.accent }}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-latin text-[10px] font-bold tracking-[0.24em] text-ink-300">0{i + 1}</span>
                    </div>
                    <h3 className="relative mt-6 font-display text-[1.45rem] font-bold tracking-[-0.03em] text-ink-950">{role.t}</h3>
                    <p className="relative mt-2.5 min-h-[68px] text-[12px] leading-[1.9] text-ink-500">{role.b}</p>
                    <ul className="relative mt-3 space-y-2.5">
                      {role.p.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-[11px] font-medium text-ink-600">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-700">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/login"
                      className="relative mt-7 flex items-center justify-between rounded-full border border-ink-950/[0.08] bg-white/50 px-4 py-2.5 text-[11px] font-bold text-ink-700 transition-all duration-300 group-hover:border-brand-500/25 group-hover:bg-white/80 group-hover:text-ink-950"
                    >
                      {t.roleEnter} {role.t}
                      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* security                                                       */}
        {/* -------------------------------------------------------------- */}
        <section id="security" className="relative scroll-mt-24 border-y border-ink-950/[0.06] bg-white/25 py-20 backdrop-blur-sm sm:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <motion.div {...fadeUp()}>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold-500/70" />
                <span className="font-latin text-[9px] font-bold uppercase tracking-[0.3em] text-gold-700">{t.sections.securityKicker}</span>
              </div>
              <h2 className="mt-5 font-display text-[clamp(2.15rem,4.6vw,3.8rem)] font-bold leading-[1.02] tracking-[-0.05em] text-ink-950">
                {t.sections.securityTitle} <span className="text-gold-gradient">{t.sections.securityGold}</span>
              </h2>
              <p className="mt-4 max-w-xl text-[13px] leading-[1.95] text-ink-500">{t.sections.securitySub}</p>

              <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {t.securityItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 rounded-xl border border-white/60 bg-white/40 px-3 py-2.5 text-[11px] font-medium leading-5 text-ink-600 backdrop-blur-sm">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[#1c1503] shadow-[0_0_0_3px_rgba(200,162,75,.18),0_0_14px_rgba(200,162,75,.5)]">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div {...fadeUp(0.12)} className="relative">
              <div aria-hidden className="absolute -inset-8 -z-10 rounded-[50px] bg-brand-400/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#0a0c07] p-8 text-[#f2f8e8] shadow-[0_36px_90px_-44px_rgba(10,12,7,.7)] sm:p-10">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(163,230,53,.16),transparent_55%),radial-gradient(circle_at_80%_100%,rgba(200,162,75,.14),transparent_45%)]" />
                <div aria-hidden className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
                <div aria-hidden className="absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-300/10" />
                <div aria-hidden className="absolute left-1/2 top-1/2 h-[140px] w-[140px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-300/15" />
                <span aria-hidden className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border border-transparent border-t-gold-300/28" />

                <div className="relative flex min-h-[320px] flex-col items-center justify-center text-center">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] border border-gold-300/20 bg-gold-300/[0.08] text-gold-200 shadow-[0_0_50px_-14px_rgba(200,162,75,.45)]">
                    <ShieldCheck className="h-9 w-9" />
                    <span aria-hidden className="absolute -inset-3 animate-ping-soft rounded-[32px] border border-gold-300/20" />
                  </div>
                  <p className="mt-6 font-latin text-[9px] font-bold uppercase tracking-[0.3em] text-gold-300/70">Security core</p>
                  <h3 className="mt-3 font-display text-2xl font-bold tracking-[-0.03em]">{t.sections.secureCard}</h3>
                  <p className="mt-2 max-w-[260px] text-[11px] leading-6 text-brand-100/45">{t.sections.secureCardSub}</p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    {['HTTPS', 'bcrypt', 'JWT httpOnly', 'Rate limit'].map((chip) => (
                      <span key={chip} className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 font-latin text-[8px] font-bold uppercase tracking-[0.16em] text-brand-100/65">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative mt-2 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold text-brand-100/75">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400/60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
                    </span>
                    {t.sections.allOk}
                  </span>
                  <Lock className="h-3.5 w-3.5 text-gold-300/60" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* final CTA                                                      */}
        {/* -------------------------------------------------------------- */}
        <section className="relative px-4 py-20 sm:px-6 sm:py-24">
          <motion.div
            {...fadeUp()}
            className="relative mx-auto w-full max-w-[1320px] overflow-hidden rounded-[38px] bg-[linear-gradient(125deg,#0c1006_0%,#1a2408_46%,#2c3d10_100%)] px-6 py-14 text-center shadow-[0_46px_110px_-48px_rgba(10,12,7,.72)] sm:px-10 sm:py-20"
          >
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(200,162,75,.22),transparent_48%),radial-gradient(circle_at_10%_100%,rgba(163,230,53,.16),transparent_42%)]" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:52px_52px] opacity-40 [mask-image:radial-gradient(60%_70%_at_50%_40%,#000,transparent)]" />
            <div aria-hidden className="absolute -bottom-10 left-1/2 -translate-x-1/2 select-none font-display text-[22vw] font-bold leading-none text-white/[0.025]">رقيب</div>
            <span aria-hidden className="absolute left-[12%] top-[18%] h-1.5 w-1.5 rounded-full bg-gold-300/80 shadow-[0_0_14px_rgba(200,162,75,.8)]" />
            <span aria-hidden className="absolute right-[16%] top-[28%] h-1 w-1 rounded-full bg-brand-200/70 shadow-[0_0_12px_rgba(123,211,176,.7)]" />

            <div className="relative mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/20 bg-white/[0.055] px-3.5 py-1.5 font-latin text-[9px] font-bold uppercase tracking-[0.24em] text-gold-200/80 backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                Start your first lecture
              </span>
              <h2 className="mt-6 font-display text-[clamp(2.3rem,5.4vw,4.4rem)] font-bold leading-[1.02] tracking-[-0.055em] text-[#f6f9ef]">
                {t.sections.ctaTitle}{' '}
                <span className="text-gold-gradient">{t.sections.ctaGold}</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[13px] leading-[1.95] text-brand-100/55">{t.sections.ctaSub}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/login?tab=register"
                  className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-[#f8fbf8] px-6 text-[13px] font-bold text-[#101608] shadow-[0_18px_40px_-16px_rgba(0,0,0,.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                >
                  {t.sections.ctaBtn}
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-6 text-[13px] font-bold text-[#f2f8e8] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-300/30 hover:bg-white/[0.09]"
                >
                  {t.sections.ctaBtn2}
                  <ArrowUpRight className="h-4 w-4 text-gold-200/80" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ---------------------------------------------------------------- */}
      {/* footer                                                           */}
      {/* ---------------------------------------------------------------- */}
      <footer className="relative overflow-clip border-t border-white/[0.06] bg-[#0a0c07] text-[#f2f8e8]">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px overflow-hidden">
          <span className="animate-bar-shine block h-full w-full bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
        </span>
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(163,230,53,0.09), transparent 65%)' }} />
        <div aria-hidden className="animate-aurora-a pointer-events-none absolute left-[2%] top-[30%] h-[280px] w-[280px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(163,230,53,0.10) 0%, transparent 65%)' }} />
        <div aria-hidden className="animate-aurora-b pointer-events-none absolute bottom-[5%] right-[3%] h-[260px] w-[260px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(200,162,75,0.14) 0%, transparent 65%)' }} />
        <div aria-hidden className="absolute -right-8 top-40 font-display text-[18vw] font-bold leading-none text-white/[0.02]">رقيب</div>

        <div className="relative mx-auto w-full max-w-7xl px-5 pb-8 pt-14 sm:px-8 sm:pt-16">
          {/* ماركيه التقنية */}
          <div aria-hidden className="mask-fade-x relative mb-14 overflow-hidden border-y border-white/[0.06] py-3">
            <div className="animate-marquee flex w-max items-center gap-8">
              {[...TECH_LOGOS, ...TECH_LOGOS].map((tech, i) => (
                <span key={`${tech.name}-${i}`} className="flex shrink-0 items-center gap-2 text-[#d9f99d]/55 transition-colors duration-300 hover:text-[#f6f9ef]">
                  <TechLogoMark index={i % TECH_LOGOS.length} className="h-4 w-4" />
                  <span className="font-latin text-[10px] font-semibold tracking-[0.14em]">{tech.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* نداء الإطلاق */}
          <div className="relative flex flex-col items-center pb-16 text-center">
            <p className="flex max-w-full items-center gap-2.5 rounded-full border border-brand-300/30 bg-brand-300/[0.08] px-4 py-1.5 font-latin text-[10px] uppercase tracking-[0.25em] text-brand-200">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-brand-300" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-300" />
              </span>
              <span className="truncate">{t.footer.statusLive}</span>
            </p>
            <p className="mt-6 font-latin text-[11px] uppercase tracking-[0.35em] text-white/30">{t.footer.kicker}</p>
            <p className="mt-4 font-display font-black tracking-tight">
              <span className="animate-shimmer block bg-[linear-gradient(100deg,#f6f9ef_0%,#d9f99d_28%,#bef264_48%,#c8a24b_68%,#f6f9ef_100%)] bg-[length:220%_100%] bg-clip-text text-[clamp(2.3rem,7vw,4.6rem)] text-transparent">
                {t.footer.ctaLine1}
              </span>
              <span aria-hidden className="text-stroke-lemon block text-[clamp(2.3rem,7vw,4.6rem)] drop-shadow-[0_0_28px_rgba(163,230,53,0.22)]">
                {t.footer.ctaLine2}
              </span>
              <span className="sr-only">{t.footer.ctaLine1} {t.footer.ctaLine2}</span>
            </p>
            <p className="mt-5 max-w-xl text-[13px] leading-relaxed text-white/50 sm:text-[15px]">{t.footer.tagline}</p>
            <span className="relative mt-9 inline-flex rounded-[15px] p-[1.5px]">
              <span aria-hidden className="animate-spin-conic absolute inset-[-70%] m-auto h-[240%] w-[45%] opacity-80" style={{ background: 'conic-gradient(from 0deg, transparent 0%, #c8a24b 15%, #bef264 30%, transparent 45%, transparent 60%, #f0e0a9 75%, transparent 90%)', filter: 'blur(7px)' }} />
              <Link href="/login?tab=register" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-[14px] bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] px-8 py-4 text-sm font-extrabold text-[#1c1503] transition-all duration-200 hover:shadow-[0_16px_50px_-12px_rgba(200,162,75,.75)]">
                <span aria-hidden className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 -translate-x-[180%] bg-black/25 blur-md transition-transform duration-700 group-hover:translate-x-[380%]" />
                <span className="relative">{t.nav.start}</span>
                <ArrowUpRight className="relative h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </span>
          </div>

          <div className="grid gap-12 border-t border-white/[0.06] pt-12 lg:grid-cols-[1.35fr_0.65fr_0.8fr_0.9fr] lg:gap-10">
            <div className="group/brand relative">
              <span aria-hidden className="pointer-events-none absolute -inset-5 rounded-3xl opacity-0 blur-2xl transition-opacity duration-700 group-hover/brand:opacity-100" style={{ background: 'radial-gradient(ellipse 70% 60% at 20% 20%, rgba(163,230,53,0.12), transparent 65%), radial-gradient(ellipse 50% 50% at 80% 90%, rgba(200,162,75,0.14), transparent 65%)' }} />
              <Logo tone="light" markClassName="h-11 w-11" wordmarkClassName="[&_span:first-child]:text-[#f6f9ef] [&_span:last-child]:text-white/35" />
              <p className="relative mt-5 max-w-xs text-[12px] leading-[1.9] text-brand-100/45">{t.footer.tagline}</p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <StatusPill dark />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 font-latin text-[9px] font-semibold text-brand-100/50">
                  <ShieldCheck className="h-3 w-3 text-gold-300/65" />
                  {t.footer.secure}
                </span>
              </div>
              <p className="mt-4 font-latin text-[9px] uppercase tracking-[0.22em] text-brand-100/28">{t.footer.stackNote}</p>

              <div className="mt-8 border-t border-white/[0.07] pt-5">
                <p className="font-display text-[15px] leading-8 text-gold-200/70">{t.footer.quote}</p>
                <p className="mt-1 font-latin text-[9px] tracking-[0.16em] text-brand-100/30">{t.footer.quoteRef}</p>
              </div>
            </div>

            <nav aria-label={t.footer.navTitle}>
              <h3 className="font-latin text-[9px] font-bold uppercase tracking-[0.28em] text-brand-100/30">{t.footer.navTitle}</h3>
              <ul className="mt-5 space-y-3">
                {t.footer.linksNav.map((link, i) => (
                  <li key={link.href}>
                    <Link href={link.href} className="group inline-flex items-center gap-2 text-[12px] font-medium text-brand-100/55 transition-colors hover:text-[#f6f9ef]">
                      <span aria-hidden className="font-latin text-[9px] tabular-nums text-brand-100/25">0{i + 1}</span>
                      <span className="h-px w-0 bg-gold-300/60 transition-all duration-300 group-hover:w-3" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label={t.footer.platform}>
              <h3 className="font-latin text-[9px] font-bold uppercase tracking-[0.28em] text-brand-100/30">{t.footer.platform}</h3>
              <ul className="mt-5 space-y-3">
                {t.footer.linksPlatform.map((link, i) => (
                  <li key={link.label}>
                    <a href={link.href} className="group inline-flex items-center gap-2 text-[12px] font-medium text-brand-100/55 transition-colors hover:text-[#f6f9ef]">
                      <span aria-hidden className="font-latin text-[9px] tabular-nums text-brand-100/25">0{i + 1}</span>
                      <span className="h-px w-0 bg-gold-300/60 transition-all duration-300 group-hover:w-3" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <h3 className="mt-7 font-latin text-[9px] font-bold uppercase tracking-[0.28em] text-brand-100/30">{t.footer.legal}</h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: t.footer.privacy, tab: 'privacy' as PolicyTab },
                  { label: t.footer.terms, tab: 'terms' as PolicyTab },
                  { label: t.footer.rights, tab: 'rights' as PolicyTab },
                ].map((item) => (
                  <li key={item.tab}>
                    <button type="button" onClick={() => openPolicy(item.tab)} className="text-[11px] text-brand-100/38 transition-colors hover:text-gold-200/80">
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h3 className="font-latin text-[9px] font-bold uppercase tracking-[0.28em] text-brand-100/30">{t.footer.contactTitle}</h3>
              <ul className="mt-5 space-y-3">
                {t.footer.devLinks.map((link) => {
                  const icons = {
                    WhatsApp: MessageCircle,
                    Email: Mail,
                    Phone: Phone,
                    Portfolio: ArrowUpRight,
                  } as const;
                  const Icon = icons[link.label as keyof typeof icons] ?? ArrowUpRight;
                  return (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                        className="group inline-flex items-center gap-2.5 text-[11px] font-medium text-brand-100/50 transition-colors hover:text-[#f6f9ef]"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] text-gold-200/60 transition-colors group-hover:border-gold-300/25 group-hover:text-gold-200">
                          <Icon className="h-3 w-3" />
                        </span>
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-6 flex items-center gap-2 text-[10px] text-brand-100/35">
                <MapPin className="h-3 w-3 text-gold-300/50" />
                {t.footer.devLoc}
              </div>
            </div>
          </div>

          {/* developer card */}
          <div className="relative mt-14 overflow-hidden rounded-[28px] border border-white/[0.09] bg-white/[0.035] p-4 backdrop-blur-md sm:p-5">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(163,230,53,.14),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(200,162,75,.14),transparent_45%)]" />
            <div className="relative grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center lg:grid-cols-[170px_1fr_auto]">
              <div className="group relative mx-auto w-full max-w-[190px] sm:mx-0">
                <div aria-hidden className="absolute -inset-1.5 rounded-[25px] bg-[conic-gradient(from_140deg,rgba(200,162,75,.6),rgba(190,242,100,.5),rgba(200,162,75,.6))] opacity-70 blur-[1px] transition-opacity duration-500 group-hover:opacity-100" />
                <div aria-hidden className="absolute -inset-1 rounded-[23px] border border-gold-300/30 [transform:rotate(-2deg)] transition-transform duration-500 group-hover:rotate-0" />
                <span aria-hidden className="magic-sparkle on" style={{ width: 4, height: 4, top: -8, right: 4, animationDelay: '0.4s' }} />
                <span aria-hidden className="magic-sparkle on" style={{ width: 3, height: 3, bottom: -6, left: 8, animationDelay: '1.8s' }} />
                <div className="relative overflow-hidden rounded-[22px] border border-white/20 bg-[#0a0c07] p-1.5">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[17px] bg-[#141a08]">
                    <Image
                      src="/1.jpg"
                      alt={t.footer.devName}
                      width={2213}
                      height={2951}
                      sizes="190px"
                      className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0a0c07]/80 via-transparent to-transparent" />
                    <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded-lg border border-gold-300/25 bg-[#0a0c07]/60 px-2 py-1.5 backdrop-blur-md">
                      <span className="h-1 w-1 rounded-full bg-brand-300 shadow-[0_0_8px_rgba(163,230,53,.8)]" />
                      <span className="font-latin text-[7px] font-bold uppercase tracking-[0.16em] text-brand-100/80">Raqeeb creator</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center sm:text-start">
                <p className="font-latin text-[8px] font-bold uppercase tracking-[0.28em] text-gold-300/55">{t.footer.devTitle}</p>
                <h3 className="mt-2 font-display text-[1.65rem] font-bold tracking-[-0.035em] text-[#f6f9ef]">{t.footer.devName}</h3>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-full border border-brand-300/20 bg-brand-300/[0.08] px-2.5 py-1 font-latin text-[8px] font-bold uppercase tracking-[0.16em] text-brand-200/80">Full-Stack Developer</span>
                  <span className="rounded-full border border-gold-300/20 bg-gold-300/[0.07] px-2.5 py-1 font-latin text-[8px] font-bold uppercase tracking-[0.16em] text-gold-200/80">Raqeeb Creator</span>
                </div>
                <p className="mx-auto mt-3 max-w-2xl text-[11px] leading-[1.9] text-brand-100/42 sm:mx-0">{t.footer.devBio}</p>
              </div>

              <div className="flex flex-col items-center gap-2 sm:items-end lg:min-w-[140px]">
                <span className="inline-flex items-center gap-1.5 font-latin text-[9px] font-semibold text-brand-100/35">
                  <MapPin className="h-3 w-3 text-gold-300/55" />
                  {t.footer.devLoc}
                </span>
                <a
                  href="https://budi-portfolio-dev.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 font-latin text-[8px] font-bold uppercase tracking-[0.18em] text-brand-100/60 transition-colors hover:border-gold-300/30 hover:text-gold-200"
                >
                  Portfolio
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-latin text-[9px] tracking-[0.12em] text-brand-100/28">{t.footer.copyright}</span>
              <span aria-hidden className="hidden h-3 w-px bg-white/10 sm:block" />
              <span className="font-latin text-[9px] tracking-[0.12em] text-brand-100/22">{t.footer.collage}</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-brand-100/30">
              <span>{t.footer.engineered}</span>
              <a href="https://budi-portfolio-dev.vercel.app/" target="_blank" rel="noreferrer" className="font-bold text-gold-200/70 underline decoration-gold-300/20 underline-offset-4 transition-colors hover:text-gold-200">
                {t.footer.devName}
              </a>
            </div>
          </div>
        </div>
      </footer>

      <WelcomeGate />
      <PolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} initialTab={policyTab} />
    </div>
  );
}
