'use client';

/**
 * 🔢 عدّاد رقم متحرك — يصعد بقيمة الجديد كل مرة (مع احترام تقليل الحركة).
 */
import * as React from 'react';
import { usePortalPrefs } from '@/lib/portal-prefs';

export function useCountUp(target: number, duration = 750): number {
  const { reduceMotion } = usePortalPrefs();
  const [value, setValue] = React.useState(() => {
    if (typeof window === 'undefined') return target;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? target : 0;
  });
  const fromRef = React.useRef(0);

  React.useEffect(() => {
    if (reduceMotion) {
      setValue(target);
      return;
    }
    const from = fromRef.current;
    if (from === target) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduceMotion]);

  return value;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const animated = useCountUp(value);
  return (
    <span className={className} dir="ltr">
      {animated.toFixed(decimals)}
      {suffix ? <span className="text-[0.72em]">{suffix}</span> : null}
    </span>
  );
}
