'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/** لوحة تفاصيل منزلقة (Sheet) — تظهر داخل الصفحة بدون تنقل */
export function AdminSheet({ open, onClose, title, subtitle, children }: Props) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#06110d]/35 backdrop-blur-sm"
          />
          <motion.aside
            key="panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/80 bg-white/95 shadow-[0_40px_120px_-24px_rgba(8,22,17,0.5)] backdrop-blur-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-brand-900/10 p-5">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-950">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p> : null}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg border border-brand-900/10 bg-white/60 p-1.5 text-ink-400 transition hover:bg-brand-500/[0.08] hover:text-ink-950"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
