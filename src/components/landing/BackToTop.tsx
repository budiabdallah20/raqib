'use client';

/**
 * Back-to-top button. Owns its own visibility flag (rAF-throttled) so the
 * page root never re-renders on scroll.
 */

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useScrollFlag } from './landing-shared';

export function BackToTop() {
  const show = useScrollFlag(640);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[#F28C28]/30 bg-[#F28C28]/10 text-[#FFB45C] shadow-[0_10px_30px_-10px_rgba(242,140,40,.4)] backdrop-blur-md transition hover:border-[#F28C28]/60 hover:bg-[#F28C28]/20"
          aria-label="العودة للأعلى"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
