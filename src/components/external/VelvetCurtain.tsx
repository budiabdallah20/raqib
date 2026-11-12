'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import './VelvetCurtain.css';

interface VelvetCurtainProps {
  side: 'left' | 'right';
  className?: string;
  isOpen?: boolean;
  onTransitionEnd?: () => void;
  /**
   * 'panel' — narrow decorative side drape (hero shell, default).
   * 'gate'  — full-height curtain half that covers the viewport while closed
   *           (splash grand opening). Slides fully off-screen without fading.
   */
  variant?: 'panel' | 'gate';
}

export function VelvetCurtain({
  side,
  className,
  isOpen = false,
  onTransitionEnd,
  variant = 'panel',
}: VelvetCurtainProps) {
  const reduceMotion = useReducedMotion();
  const baseClass = `velvet-curtain velvet-curtain--${side} ${
    variant === 'gate' ? 'velvet-curtain--gate' : ''
  }`;

  const transition = reduceMotion
    ? { duration: 0 }
    : variant === 'gate'
      ? { duration: 0.75, ease: [0.77, 0, 0.175, 1] as const }
      : { duration: 1.2, ease: [0.77, 0, 0.175, 1] as const };

  // The gate leaves the stage entirely — fabric slides, it never dissolves.
  const exitX = side === 'left' ? '-112%' : '112%';

  return (
    <motion.div
      className={baseClass}
      aria-hidden
      initial={false}
      animate={
        variant === 'gate'
          ? isOpen
            ? { x: exitX }
            : { x: 0 }
          : isOpen
            ? { x: exitX, opacity: 0 }
            : { x: 0, opacity: 0.96 }
      }
      transition={transition}
      onAnimationComplete={onTransitionEnd}
      style={{ willChange: 'transform' }}
    >
      <span className="velvet-curtain-inner" />
      <span className="velvet-curtain-fringe" />
      <span className="velvet-curtain-cord" />
    </motion.div>
  );
}
