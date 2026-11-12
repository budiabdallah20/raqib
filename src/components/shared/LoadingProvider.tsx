'use client';

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { SplashScreen } from './SplashScreen';
import { PortalWelcome } from './WelcomeGate';

const BOOTED_KEY = 'raqib-booted';
const PROBE_TIMEOUT_MS = 1100;
const HARD_CAP_MS = 2500;

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

async function checkFirstConnection(): Promise<void> {
  if (!navigator.onLine) return;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch('/api/health', { cache: 'no-store', signal: controller.signal });
  } catch {
    // The public page and its recovery routes remain usable when health is unavailable.
  } finally {
    window.clearTimeout(timer);
  }
}

/** One short, honest first-visit introduction. The bar never claims a numeric download percentage. */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = React.useState(true);
  const [splashHardGone, setSplashHardGone] = React.useState(false);
  const skipRef = React.useRef(false);
  // The overture belongs to the landing stage only — auth and portal routes
  // are the destination, not the foyer, so the curtain must never cover them.
  const pathname = usePathname();
  const splashVisible = booting && pathname === '/';

  const complete = React.useCallback(() => {
    try { window.sessionStorage.setItem(BOOTED_KEY, '1'); } catch { /* private mode */ }
    setBooting(false);
  }, []);

  useIsomorphicLayoutEffect(() => {
    try {
      if (window.sessionStorage.getItem(BOOTED_KEY) === '1' ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        skipRef.current = true;
        complete();
      }
    } catch {
      // Continue with the bounded first-visit sequence.
    }
  }, [complete]);

  React.useEffect(() => {
    if (skipRef.current) return;
    let alive = true;
    const finish = () => { if (alive) complete(); };
    // The splash owns the choreography and calls onFinish when the curtain
    // lands (~1.5s). The hard cap is only a safety net for slow devices,
    // hidden tabs or crashed transitions; the health probe warms the backend
    // without ever delaying the reveal.
    const hardCap = window.setTimeout(finish, HARD_CAP_MS);
    void checkFirstConnection();
    return () => { alive = false; window.clearTimeout(hardCap); };
  }, [complete]);

  React.useEffect(() => {
    if (splashVisible) {
      delete document.documentElement.dataset.booted;
      const previous = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      return () => { document.documentElement.style.overflow = previous; };
    }
    document.documentElement.dataset.booted = 'true';
  }, [splashVisible]);

  React.useEffect(() => {
    if (booting) return;
    const timer = window.setTimeout(() => setSplashHardGone(true), 1450);
    return () => window.clearTimeout(timer);
  }, [booting]);

  return (
    <>
      {/* No-JS safety: without JS the choreography can never end, so the
          curtain is simply never painted — the page shows through instead of
          trapping the visitor behind closed curtains. */}
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: '[data-splash]{display:none!important}' }} />
      </noscript>
      {!splashHardGone && pathname === '/' && (
        <AnimatePresence initial={false}>
          {booting && <SplashScreen key="academic-gate" onFinish={complete} />}
        </AnimatePresence>
      )}
      {children}
      <PortalWelcome active={!booting} />
    </>
  );
}
