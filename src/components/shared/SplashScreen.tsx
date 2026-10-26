'use client';

/**
 * شاشة تحميل رقيب — «الوهج الذهبي»:
 * خلفية فاتحة بلمسة ليمونية، علامة المنصة تدور في مدار ذهبي،
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
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#fbfdf6] text-ink-950"
      initial={false}
      exit={{ opacity: 0, y: -28, scale: 0.988 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div aria-hidden className="absolute inset-0 bg-mesh-gold opacity-80" />
      <div aria-hidden className="absolute inset-0 bg-grid opacity-[0.36] [mask-image:radial-gradient(70%_60%_at_50%_42%,#000_20%,transparent_82%)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute h-[520px] w-[520px] rounded-full opacity-80 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(190,242,100,.26), rgba(200,162,75,.14) 46%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-90 animate-bar-shine"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(163,230,53,.6), rgba(200,162,75,.65), transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-70 animate-bar-shine"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(200,162,75,.5), rgba(163,230,53,.5), transparent)' }}
      />

      <div className="relative flex flex-col items-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center gap-3 font-latin text-[9px] font-bold uppercase tracking-[0.36em] text-ink-500/60"
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold-500/60" />
          Academic Presence
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold-500/60" />
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
            style={{ boxShadow: '0 0 0 1px rgba(163,230,53,.2) inset' }}
          />
          <span aria-hidden className="absolute -inset-7 rounded-[34px] border border-gold-500/25 [transform:rotate(8deg)]" />
          <span
            aria-hidden
            className="absolute -inset-5 rounded-[30px] border border-brand-400/20 animate-spin-slow"
            style={{ borderTopColor: 'rgba(200,162,75,.6)' }}
          />
          {/* مدار ذهبي — نقطة تدور حول العلامة */}
          <span aria-hidden className="absolute -inset-11 animate-spin-reverse">
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-gold-400 shadow-[0_0_14px_rgba(200,162,75,.85)]" />
            <span className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-brand-400 shadow-[0_0_10px_rgba(163,230,53,.8)]" />
          </span>
          <LogoMark className="relative h-[96px] w-[96px] drop-shadow-[0_22px_50px_rgba(200,162,75,.38)] sm:h-[112px] sm:w-[112px]" />
          <span aria-hidden className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-gold-400 shadow-[0_0_16px_rgba(200,162,75,.8)]" />
          <span aria-hidden className="absolute -left-3 top-6 h-1.5 w-1.5 rounded-full bg-brand-400 shadow-[0_0_12px_rgba(163,230,53,.8)]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-7 font-display text-[4.2rem] font-bold leading-none tracking-[-0.055em] sm:text-[5rem]"
        >
          <span className="animate-shimmer bg-[linear-gradient(100deg,#101608_0%,#65a30d_26%,#a3e635_46%,#bef264_60%,#c8a24b_78%,#101608_100%)] bg-[length:220%_100%] bg-clip-text text-transparent">
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
          className="mt-4 font-latin text-[10px] font-medium uppercase tracking-[0.38em] text-ink-500/60"
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
        <div className="h-[3px] w-60 overflow-hidden rounded-full bg-ink-950/[0.07] sm:w-72">
          <div
            ref={barRef}
            className="h-full w-full origin-left rounded-full bg-[linear-gradient(90deg,#365314_0%,#84cc16_36%,#a3e635_62%,#bef264_78%,#c8a24b_100%)] shadow-[0_0_18px_rgba(163,230,53,.4)] will-change-transform"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
        <p className="flex items-center gap-2 font-latin text-[10px] font-semibold tracking-[0.26em] text-ink-500/65">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400/50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
          </span>
          <span ref={numRef} className="tabular-nums text-ink-700">0</span>
          <span dir="ltr">/ 100</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
