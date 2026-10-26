'use client';

/**
 * شاشة تحميل رقيب — «الوهج الذهبي» (دراك):
 * أسود مخملي، وهج ليموني×ذهبي، علامة المنصة تدور في مدار ذهبي،
 * شرارات سحرية، وشريط تقدّم ليموني×ذهبي ينسحب المشهد بأناقة.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from './Logo';

const DURATION = 1900;

export function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const reduceMotion = useReducedMotion();
  const barRef = React.useRef<HTMLDivElement>(null);
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
      if (barRef.current) barRef.current.style.transform = `scaleX(${eased})`;
      if (numRef.current) numRef.current.textContent = String(Math.round(eased * 100));
      if (linear < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        window.setTimeout(finish, reduceMotion ? 100 : 260);
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
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#060805] text-ink-950"
      initial={false}
      exit={{ opacity: 0, y: -28, scale: 0.988 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* هالة ليمونية×ذهبية على أسود */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 44% at 50% -8%, rgba(163,230,53,0.14), transparent 62%), radial-gradient(ellipse 44% 34% at 86% 100%, rgba(200,162,75,0.12), transparent 60%)',
        }}
      />
      <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-[0.35] [mask-image:radial-gradient(70%_60%_at_50%_42%,#000_20%,transparent_82%)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute h-[560px] w-[560px] rounded-full opacity-90 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(163,230,53,.22), rgba(200,162,75,.13) 46%, transparent 70%)' }}
      />
      {/* خطّا وهج علوي وسفلي متحركان */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-90 animate-bar-shine"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(163,230,53,.65), rgba(200,162,75,.7), transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-70 animate-bar-shine"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(200,162,75,.55), rgba(163,230,53,.55), transparent)' }}
      />

      <div className="relative flex flex-col items-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center gap-3 font-latin text-[9px] font-bold uppercase tracking-[0.36em] text-gold-200/50"
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold-400/60" />
          Academic Presence
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold-400/60" />
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
            style={{ boxShadow: '0 0 0 1px rgba(163,230,53,.24) inset' }}
          />
          <span aria-hidden className="absolute -inset-7 rounded-[34px] border border-gold-400/30 [transform:rotate(8deg)]" />
          <span
            aria-hidden
            className="absolute -inset-5 rounded-[30px] border border-brand-400/25 animate-spin-slow"
            style={{ borderTopColor: 'rgba(200,162,75,.65)' }}
          />
          {/* مدار ذهبي — نقطتان تدوران حول العلامة */}
          <span aria-hidden className="absolute -inset-11 animate-spin-reverse">
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-gold-400 shadow-[0_0_16px_rgba(200,162,75,.9)]" />
            <span className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-brand-400 shadow-[0_0_12px_rgba(163,230,53,.85)]" />
          </span>
          <LogoMark
            tone="ink"
            className="relative h-[96px] w-[96px] drop-shadow-[0_22px_50px_rgba(163,230,53,.32)] sm:h-[112px] sm:w-[112px]"
          />
          <span aria-hidden className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-gold-400 shadow-[0_0_18px_rgba(200,162,75,.85)]" />
          <span aria-hidden className="absolute -left-3 top-6 h-1.5 w-1.5 rounded-full bg-brand-400 shadow-[0_0_14px_rgba(163,230,53,.85)]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-7 font-display text-[4.2rem] font-bold leading-none tracking-[-0.055em] sm:text-[5rem]"
        >
          <span className="animate-shimmer bg-[linear-gradient(100deg,#f6f9ef_0%,#d9f99d_26%,#bef264_46%,#a3e635_60%,#e6cb78_78%,#f6f9ef_100%)] bg-[length:220%_100%] bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(163,230,53,.25)]">
            رقيب
          </span>
          <span aria-hidden className="magic-sparkle on" style={{ width: 4, height: 4, right: -16, top: 10, animationDelay: '0.5s' }} />
          <span aria-hidden className="magic-sparkle on" style={{ width: 3, height: 3, left: -14, bottom: 12, animationDelay: '1.6s', background: 'radial-gradient(circle,#fff,#c8a24b 65%,transparent)' }} />
          <span aria-hidden className="magic-sparkle on" style={{ width: 3, height: 3, right: -10, bottom: 4, animationDelay: '2.4s' }} />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-4 font-latin text-[10px] font-medium uppercase tracking-[0.38em] text-brand-100/45"
        >
          RAQIB · سجل الحضور الذكي
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-3 px-8"
      >
        <div className="h-[3px] w-60 overflow-hidden rounded-full bg-white/[0.08] sm:w-72">
          <div
            ref={barRef}
            className="h-full w-full origin-left rounded-full bg-[linear-gradient(90deg,#365314_0%,#84cc16_36%,#a3e635_62%,#bef264_78%,#c8a24b_100%)] shadow-[0_0_20px_rgba(163,230,53,.5)] will-change-transform"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
        <p className="flex items-center gap-2 font-latin text-[10px] font-semibold tracking-[0.26em] text-brand-100/45">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400/50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
          </span>
          <span ref={numRef} className="tabular-nums text-brand-100/80">0</span>
          <span dir="ltr">/ 100</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
