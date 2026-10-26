'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
};

export function AdminModal({ open, onClose, title, children, wide }: Props) {
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
          <motion.div
            key="dialog"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto -translate-y-1/2 rounded-2xl border border-white/80 bg-white/90 shadow-[0_40px_120px_-24px_rgba(8,22,17,0.5)] backdrop-blur-2xl"
            style={{ maxWidth: wide ? 520 : 400 }}
          >
            <header className="flex items-center justify-between border-b border-brand-900/10 p-4">
              <h2 className="font-display font-bold text-ink-950">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg border border-brand-900/10 bg-white/60 p-1.5 text-ink-400 transition hover:bg-brand-500/[0.08] hover:text-ink-950"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
            </header>
            <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
