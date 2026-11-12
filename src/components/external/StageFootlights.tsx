'use client';

import './StageFootlights.css';

/**
 * Static footlight bar.
 * Perf: the glow now lives entirely in CSS. The old component re-animated
 * `box-shadow` infinitely (4s repeat) — an expensive full repaint that ran
 * forever on every visit.
 */
export function StageFootlights({ className }: { className?: string }) {
  return <div className={`stage-footlights ${className ?? ''}`} aria-hidden />;
}
