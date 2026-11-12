'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import { VelvetCurtain } from '@/components/external/VelvetCurtain';
import './splash-theatre.css';

/**
 * THE GRAND CURTAIN OPENING — Scene choreography (single run, ~1.5s):
 *   1. Theater entrance — closed full-viewport curtains, subtle center light.
 *   2. Logo reveal      — the RAQIB mark blooms in with scale + opacity.
 *   3. Curtains part    — halves slide aside; the scrim fades and the landing
 *                         page is revealed through the widening gap.
 *   4. Finished         — overlay unmounts; interaction returns to the page.
 *
 * Performance contract: transform/opacity only, no infinite loops, no video,
 * no canvas. The provider's hard cap + skip button + sessionStorage keep this
 * honest — the splash ends itself via `onFinish` once the curtain lands.
 */

const LOGO_IN_MS = 120; // Scene 2 begins over the closed curtains
const CURTAIN_MS = 160; // Reveal immediately after the first painted brand frame.
const FINISH_FALLBACK_MS = 1750; // Safety net if transitionend never fires

export function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = React.useState<'closed' | 'logo' | 'open' | 'done'>('closed');

  const finishRef = React.useRef(onFinish);
  finishRef.current = onFinish;
  const finishedRef = React.useRef(false);

  // `onFinish` must fire OUTSIDE any state updater — calling it inside the
  // setPhase callback used to warn: "Cannot update a component
  // (LoadingProvider) while rendering a different component (SplashScreen)".
  const finish = React.useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    finishRef.current?.();
    setPhase('done');
  }, []);

  React.useEffect(() => {
    if (reduceMotion) {
      // Reduced motion: skip the choreography entirely, hand over at once.
      finish();
      return;
    }
    const t1 = window.setTimeout(() => setPhase('logo'), LOGO_IN_MS);
    const t2 = window.setTimeout(() => setPhase('open'), CURTAIN_MS);
    const t3 = window.setTimeout(finish, FINISH_FALLBACK_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [reduceMotion, finish]);

  const curtainsOpen = phase === 'open' || phase === 'done';
  const revealed = phase === 'open' || phase === 'done';

  return (
    <motion.div
      data-splash
      className="splash-theatre fixed inset-0 z-[200] overflow-hidden"
      role="status"
      aria-label="جارٍ فتح ستائر المسرح الأكاديمي لمنصة رقيب"
      initial={false}
      exit={{ opacity: 0 }}
      animate={{ pointerEvents: revealed ? 'none' : 'auto' }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
    >
      {/* Scrim — keeps the stage dark until the curtains part, then dissolves
          so the real page shows through the gap. */}
      <motion.div
        className="splash-scrim"
        aria-hidden
        initial={false}
        animate={{ opacity: curtainsOpen ? 0 : 1 }}
        transition={{ duration: 0.75, ease: [0.77, 0, 0.175, 1] }}
      />

      {/* Grand curtains — two full-height halves */}
      <VelvetCurtain side="left" variant="gate" isOpen={curtainsOpen} />
      <VelvetCurtain side="right" variant="gate" isOpen={curtainsOpen} onTransitionEnd={finish} />

      {/* Scene 2 — centered logo bloom */}
      <motion.div
        className="splash-center-stage"
        initial={false}
        animate={{
          opacity: phase === 'logo' ? 1 : 0,
          scale: phase === 'logo' ? 1 : 0.94,
          y: phase === 'logo' ? 0 : 14,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="splash-eyebrow" dir="ltr">
          <Sparkles className="h-3 w-3" />
          <span>RAQEEB · ACADEMIC THEATRE · OVERTURE</span>
        </div>

        <div className="splash-emblem">
          <div className="splash-emblem-glow" aria-hidden />
          <Image
            src="/brand/stage-mark.svg"
            width={118}
            height={118}
            alt="رقيب"
            className="h-[88px] w-[88px] sm:h-[118px] sm:w-[118px]"
          />
        </div>

        <motion.p
          className="splash-wordmark"
          initial={false}
          animate={{
            opacity: phase === 'logo' ? 1 : 0,
            y: phase === 'logo' ? 0 : 18,
          }}
          transition={{ delay: 0.14, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          رقيب
        </motion.p>

        <div className="splash-divider" aria-hidden>
          <span />
        </div>
      </motion.div>

      {/* Skip — always available while the curtains are closed */}
      <button
        type="button"
        onClick={finish}
        className="splash-skip"
        aria-label="تجاوز المقدمة والدخول المباشر للمنصة"
      >
        <span>تجاوز المقدمة</span>
        <span aria-hidden className="text-[#FFB45C]">←</span>
      </button>
    </motion.div>
  );
}
