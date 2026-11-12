'use client';

/**
 * Fixed reading-progress bar. Writes directly to the DOM inside a rAF —
 * zero React re-renders while scrolling.
 */

import * as React from 'react';

export function ReadingProgress() {
  const barRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = barRef.current;
      if (!el) return;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(1, y / max) : 0;
      el.style.transform = `scaleX(${pct})`;
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2.5px]">
      <div
        ref={barRef}
        className="h-full w-full origin-right bg-[linear-gradient(to_left,#F28C28_0%,#641B35_55%,#FFB45C_100%)]"
        style={{ transform: 'scaleX(0)', transformOrigin: 'right' }}
      />
    </div>
  );
}
