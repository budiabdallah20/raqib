'use client';

/**
 * شاشة تحميل رقيب — «الليمون المشرق»:
 * خلفية ليمونية فاتحة بلون واحد، لوجو المنصة + الاسم بأنيميشن دخول،
 * نسبة تقدّم 0 → 100 بدون شريط (عدّاد كبير)، وفيدي أوت ناعم.
 * نقرة واحدة تُسرّع الانتقال — ويلتزم prefers-reduced-motion.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from './Logo';

const DURATION = 2000;

export function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const reduceMotion = useReducedMotion();
  const numRef = React.useRef<HTMLSpanElement>(null);
  const finished = React.useRef(false);

  const finish = React.useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish?.();
  }, [onFinish]);

  React.useEffect(() => {
    if (reduceMotion) return;
    window.addEventListener('pointerdown', finish);
    return () => window.removeEventListener('pointerdown', finish);
  }, [finish, reduceMotion]);

  React.useEffect(() => {
    const duration = reduceMotion ? 420 : DURATION;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const linear = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - linear, 3);
      if (numRef.current) numRef.current.textContent = String(Math.round(eased * 100));
      if (linear < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        window.setTimeout(finish, reduceMotion ? 100 : 150);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [finish, reduceMotion]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="جارٍ تحميل منصة رقيب"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#d3f36c] text-ink-950"
      initial={false}
      exit={{ opacity: 0, scale: 1.045, filter: 'blur(5px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* لمسة عمق: إشراقة بيضاء عالية على الليمون الموحّد */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 55% 38% at 50% -6%, rgba(255,255,255,0.5), transparent 62%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 40% 30% at 88% 104%, rgba(101,163,13,0.16), transparent 60%)',
        }}
      />

      <div className="relative flex flex-col items-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center gap-3 font-latin text-[9px] font-bold uppercase tracking-[0.36em] text-ink-800/55"
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-ink-800/45" />
          Academic Presence
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-ink-800/45" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <span
            aria-hidden
            className="absolute -inset-10 rounded-[38px] animate-ping-soft"
            style={{ boxShadow: '0 0 0 1px rgba(28,44,10,.18) inset' }}
          />
          <span aria-hidden className="absolute -inset-7 rounded-[34px] border border-ink-950/15 [transform:rotate(8deg)]" />
          <span
            aria-hidden
            className="absolute -inset-5 rounded-[30px] border border-ink-800/20 animate-spin-slow"
            style={{ borderTopColor: 'rgba(101,163,13,.7)' }}
          />
          {/* مداران متنافران — نقاط داكنة حول العلامة */}
          <span aria-hidden className="absolute -inset-11 animate-spin-reverse">
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-ink-950 shadow-[0_0_14px_rgba(28,44,10,.55)]" />
            <span className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-gold-700 shadow-[0_0_12px_rgba(136,99,44,.7)]" />
          </span>
          <LogoMark
            tone="ink"
            className="relative h-[96px] w-[96px] drop-shadow-[0_18px_36px_rgba(28,44,10,.28)] sm:h-[112px] sm:w-[112px]"
          />
          <span aria-hidden className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-ink-950/85 shadow-[0_0_14px_rgba(28,44,10,.5)]" />
          <span aria-hidden className="absolute -left-3 top-6 h-1.5 w-1.5 rounded-full bg-gold-700 shadow-[0_0_12px_rgba(136,99,44,.6)]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-7 font-display text-[4.2rem] font-bold leading-none tracking-[-0.055em] sm:text-[5rem]"
        >
          <span className="animate-shimmer bg-[linear-gradient(100deg,#101608_0%,#365314_28%,#65a30d_48%,#84cc16_62%,#101608_100%)] bg-[length:220%_100%] bg-clip-text text-transparent">
            رقيب
          </span>
          <span aria-hidden className="magic-sparkle on" style={{ width: 4, height: 4, right: -16, top: 10, animationDelay: '0.5s', background: 'radial-gradient(circle,#fff,#365314 65%,transparent)' }} />
          <span aria-hidden className="magic-sparkle on" style={{ width: 3, height: 3, left: -14, bottom: 12, animationDelay: '1.6s', background: 'radial-gradient(circle,#fff,#88632c 65%,transparent)' }} />
          <span aria-hidden className="magic-sparkle on" style={{ width: 3, height: 3, right: -10, bottom: 4, animationDelay: '2.4s' }} />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-4 font-latin text-[10px] font-medium uppercase tracking-[0.38em] text-ink-900/60"
        >
          RAQIB · سجل الحضور الذكي
        </motion.p>
      </div>

      {/* نسبة التقدّم — عدّاد كبير بدون شريط */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-2 px-8"
      >
        <p className="flex items-baseline gap-1.5 font-display" dir="ltr" aria-label="نسبة التقدم">
          <span
            ref={numRef}
            className="text-7xl font-black tabular-nums leading-none tracking-tight text-ink-950 sm:text-8xl"
          >
            0
          </span>
          <span className="text-2xl font-bold text-ink-900/70">%</span>
        </p>
        <p className="font-latin text-[9px] font-semibold uppercase tracking-[0.3em] text-ink-900/45">
          انقر للانتقال
        </p>
      </motion.div>
    </motion.div>
  );
}
