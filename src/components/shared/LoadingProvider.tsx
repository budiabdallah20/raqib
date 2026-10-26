'use client';

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { SplashScreen } from './SplashScreen';

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = React.useState(true);

  const finish = React.useCallback(() => setBooting(false), []);

  // Safety net: never let a stalled animation trap the app on the splash.
  React.useEffect(() => {
    const timer = window.setTimeout(finish, 7000);
    return () => window.clearTimeout(timer);
  }, [finish]);

  React.useEffect(() => {
    if (booting) {
      delete document.documentElement.dataset.booted;
      return;
    }
    document.documentElement.dataset.booted = 'true';
  }, [booting]);

  React.useEffect(() => {
    if (!booting) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [booting]);

  return (
    <>
      <AnimatePresence>
        {booting ? <SplashScreen key="raqib-splash" onFinish={finish} /> : null}
      </AnimatePresence>
      {children}
    </>
  );
}
