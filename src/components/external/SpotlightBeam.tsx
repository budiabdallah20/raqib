'use client';

import './SpotlightBeam.css';

interface SpotlightBeamProps {
  position: 'left' | 'right';
  className?: string;
  intensity?: number;
}

/**
 * Static spotlight pool.
 * Perf: this was a framer-motion infinite loop (scale/opacity, 6s repeat)
 * over a blur(120px) layer — one of the heaviest continuous paints on the
 * page. It now renders once; the gradient + blur are static and the CSS
 * media queries still tune blur/opacity per viewport.
 */
export function SpotlightBeam({ position, className, intensity = 1 }: SpotlightBeamProps) {
  return (
    <div
      className={`spotlight-beam spotlight-beam--${position} ${className ?? ''}`}
      aria-hidden
      style={{ opacity: 0.3 * intensity, filter: 'blur(110px)' }}
    />
  );
}
