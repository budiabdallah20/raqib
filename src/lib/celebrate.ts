import confetti from 'canvas-confetti';

const GOLD = ['#C9A962', '#E7CE8B', '#B08A3E'];
const INK = ['#20343A', '#37554F'];

/**
 * Fires a short confetti burst in the brand palette (gold + ink) for success
 * moments, e.g. attendance scan success or profile save.
 * Silently skips when the user prefers reduced motion.
 */
export function celebrate(originY = 0.7): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 38,
    ticks: 180,
    origin: { y: originY },
    colors: [...GOLD, ...INK],
    zIndex: 60,
  });
}
