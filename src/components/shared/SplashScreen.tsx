'use client';

/**
 * شاشة تحميل رقيب — «الختم المستيقظ»:
 * خلفية حبر داكنة بهالة ذهبية متحركة بسيطة (aurora + غبار ذهبي)،
 * لوجو رقيب الجديد + الاسم، ونسبة تقدّم 0 → 100 أسفل يمين الصفحة
 * بدون شريط تقدّم — عدّاد فقط. نقرة تُسرّع الانتقال،
 * ويلتزم prefers-reduced-motion.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from './Logo';

const DURATION = 2000;

/* حسّاس الغبار الذهبي — يطفو ببطء شديد */
function DustField({ reduceMotion }: { reduceMotion: boolean | null }) {
  const dots = React.useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${4 + ((i * 37) % 92)}%`,
        top: `${8 + ((i * 53) % 84)}%`,
        size: 2 + ((i * 7) % 4),
        delay: `${(i % 7) * 1.1}s`,
        dur: `${11 + (i % 5) * 2.6}s`,
        opacity: 0.16 + ((i % 4) * 0.05),
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={
            {
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              background: 'radial-gradient(circle, #f0dfa6 0%, rgba(200,162,75,0.35) 55%, transparent 75%)',
              opacity: d.opacity,
              animation: reduceMotion ? undefined : `rqb-float ${d.dur} ease-in-out ${d.delay} infinite alternate`,
            } as React.CSSProperties
          }
        />
      ))}
      {/* هالتان ذهبية ينفّسان ببطء — اللمسة الذهبية الوحيدة */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 46% 32% at 22% 12%, rgba(200,162,75,0.16), transparent 62%), radial-gradient(ellipse 40% 30% at 82% 92%, rgba(200,162,75,0.10), transparent 60%)',
          animation: reduceMotion ? undefined : 'rqb-aurora 16s ease-in-out infinite alternate',
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 30% 22% at 78% 18%, rgba(240,223,166,0.10), transparent 58%), radial-gradient(ellipse 34% 26% at 14% 84%, rgba(240,223,166,0.07), transparent 60%)',
          animation: reduceMotion ? undefined : 'rqb-aurora 22s ease-in-out infinite alternate-reverse',
        }}
      />
    </div>
  );
}

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
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#0b0e06] text-ivory"
      initial={false}
      exit={{ opacity: 0, scale: 1.045, filter: 'blur(5px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <DustField reduceMotion={reduceMotion} />

      <div className="relative flex flex-col items-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center gap-3 font-latin text-[9px] font-bold uppercase tracking-[0.36em] text-ivory/45"
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold-500/50" />
          Academic Presence
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold-500/50" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* حلقتا مدار رقيقتان حول الختم */}
          <span
            aria-hidden
            className="absolute -inset-9 rounded-[34px] animate-spin-slow"
            style={{ border: '1px solid rgba(200,162,75,0.22)', borderTopColor: 'rgba(240,223,166,0.55)' }}
          />
          <span
            aria-hidden
            className="absolute -inset-5 rounded-[28px] animate-spin-reverse"
            style={{ border: '1px solid rgba(200,162,75,0.14)' }}
          />
          <LogoMark
            tone="ink"
            className="relative h-[104px] w-[104px] drop-shadow-[0_18px_40px_rgba(0,0,0,0.5)] sm:h-[122px] sm:w-[122px]"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-7 font-display text-[4.2rem] font-bold leading-none tracking-[-0.055em] sm:text-[5rem]"
        >
          <span className="animate-shimmer bg-gold-sheen bg-[length:220%_100%] bg-clip-text text-transparent">
            رقيب
          </span>
          <span
            aria-hidden
            className="magic-sparkle on"
            style={{ width: 4, height: 4, right: -16, top: 10, animationDelay: '0.5s', background: 'radial-gradient(circle,#fff,#d8b45a 65%,transparent)' }}
          />
          <span
            aria-hidden
            className="magic-sparkle on"
            style={{ width: 3, height: 3, left: -14, bottom: 12, animationDelay: '1.6s' }}
          />
          <span
            aria-hidden
            className="magic-sparkle on"
            style={{ width: 3, height: 3, right: -10, bottom: 4, animationDelay: '2.4s' }}
          />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-4 flex items-center gap-2 font-latin text-[10px] font-medium uppercase tracking-[0.38em] text-ivory/55"
        >
          <span className="inline-block h-1 w-1 rounded-full bg-gold-500/90" />
          RAQIB · منصة الحضور الأكاديمية
          <span className="inline-block h-1 w-1 rounded-full bg-gold-500/90" />
        </motion.p>
      </div>

      {/* النسبة — أسفل يمين الصفحة، عدّاد فقط بلا شريط */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-8 right-8 flex items-baseline gap-1 font-display sm:bottom-10 sm:right-12"
        dir="ltr"
        aria-label="نسبة التقدم"
      >
        <span ref={numRef} className="text-6xl font-black tabular-nums leading-none text-gold-gradient sm:text-7xl">
          0
        </span>
        <span className="text-xl font-bold text-gold-500/80">%</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="absolute bottom-10 left-10 hidden font-latin text-[9px] font-semibold uppercase tracking-[0.3em] text-ivory/35 sm:block"
        dir="ltr"
      >
        click to skip
      </motion.p>
    </motion.div>
  );
}
