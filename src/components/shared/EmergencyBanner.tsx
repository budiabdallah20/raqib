'use client';

import * as React from 'react';
import { Siren } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

/**
 * شريط البث الطارئ (أدمن §6.7 — صف 1):
 * يقرأ AppSetting «emergency_banner» عبر /api/banner — يظهر فورًا في البوابات الثلاث.
 * نبض كل 20 ثانية + لحظة العودة للنافذة، ويختفي هدوءًا حين يفرغ المفتاح.
 */
export default function EmergencyBanner() {
  const [banner, setBanner] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const load = () => {
      api<{ banner: string | null }>('/api/banner')
        .then((data) => {
          if (alive) setBanner(data.banner);
        })
        .catch(() => {
          /* بلا بث عند فشل القراءة — لا تشوش */
        });
    };
    load();
    const timer = window.setInterval(load, 20_000);
    window.addEventListener('focus', load);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, []);

  if (!banner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      role="alert"
      aria-live="polite"
      className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-ember-500/30 bg-ember-500/[0.08] px-4 py-3 shadow-[0_12px_34px_-20px_rgba(239,68,68,0.55)]"
    >
      <Siren size={18} className="shrink-0 text-ember-600" aria-hidden />
      <span className="rounded-md bg-ember-500/15 px-2 py-0.5 font-display text-[11px] font-bold text-ember-700">
        بث طارئ
      </span>
      <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-ink-950">{banner}</p>
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ember-500" />
      </span>
    </motion.div>
  );
}
