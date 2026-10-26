'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';

type Quote = { id: string; kind: string; text: string; source: string | null };

// ───────────────────────────────────────────────────────
// AyahTicker — شريط حي يبدّل بين آية ومثل مصري كل 60 ثانية
// بترتيب: آية ← مثل ← آية ← مثل ...
// ───────────────────────────────────────────────────────
export function AyahTicker() {
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [index, setIndex] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    api<{ quran: Quote[]; proverbs: Quote[] }>('/api/quotes')
      .then((data) => {
        if (!alive) return;
        const quran = data.quran || [];
        const proverbs = data.proverbs || [];
        const mixed: Quote[] = [];
        const rounds = Math.max(quran.length, proverbs.length);
        for (let i = 0; i < rounds; i += 1) {
          if (quran[i]) mixed.push(quran[i]);
          if (proverbs[i]) mixed.push(proverbs[i]);
        }
        setQuotes(mixed);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (quotes.length < 2) return undefined;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % quotes.length),
      60 * 1000,
    );
    return () => window.clearInterval(timer);
  }, [quotes.length]);

  const current = quotes.length ? quotes[index % quotes.length] : null;

  if (!loaded) {
    return (
      <div className="min-h-[68px] animate-pulse rounded-xl bg-white/65" />
    );
  }

  return (
    <div className="min-h-[68px]">
      <AnimatePresence mode="wait">
        {current ? (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <p className="font-display text-lg leading-relaxed text-gold-700">
              «{current.text}»
            </p>
            {current.source ? (
              <p className="mt-1 text-xs text-ink-400">— {current.source}</p>
            ) : null}
          </motion.div>
        ) : (
          <motion.p
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-lg text-gold-700/90"
          >
            وَقُل رَبِّ زِدْنِي عِلْمًا
            <span className="mt-1 block text-xs text-ink-400">— سورة طه · ١١٤</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
