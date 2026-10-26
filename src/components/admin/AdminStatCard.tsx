'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: 'gold' | 'ember' | 'neutral';
};

const tones = {
  gold: 'text-gold-700 bg-gold-500/10 border-gold-600/20',
  ember: 'text-ember-600 bg-ember-500/10 border-ember-500/20',
  neutral: 'text-ink-500 bg-white/70 border-brand-900/10',
};

export function AdminStatCard({ title, value, hint, icon: Icon, tone = 'gold' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="rounded-2xl border border-white/75 bg-white/70 p-5 shadow-glass backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-500">{title}</span>
        <span className={`grid h-10 w-10 place-items-center rounded-xl border ${tones[tone]}`}>
          <Icon size={20} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-3 font-display text-4xl font-bold text-ink-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
    </motion.div>
  );
}
