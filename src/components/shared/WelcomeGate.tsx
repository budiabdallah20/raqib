'use client';

/**
 * رسالة ترحيب فاخرة للزائر اللي بيدخل المنصة لأول مرة — تظهر مرة واحدة
 * (بيوم) على الشاشة الرئيسية، بستايل زجاجي هادئ بلمسة زمردية وذهبية.
 */

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { LogoMark } from '@/components/shared/Logo';
import { useLang } from '@/lib/i18n';

const KEY = 'raqib_welcome_v1';

/** خُدّل بيد واحد لكل يوم — مازل نزلش نفس وفوّر الرسالة كل صفحة. */
function isStale(mark: string) {
  return mark !== new Date().toISOString().slice(0, 10);
}

export function WelcomeGate() {
  const { t } = useLang();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const mark = window.localStorage.getItem(KEY);
      if (!mark || isStale(mark)) {
        setOpen(true);
      }
    } catch {
      /* تجاهل */
    }
    // مرة واحدة فقط لكل زيارة — السؤال تفضل مخفي بعد أول إغلاق.
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(KEY, new Date().toISOString().slice(0, 10));
    } catch { /* تجاهل */ }
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="welcome-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={t.guest.title}
        >
          {/* scrim */}
          <button
            type="button"
            onClick={close}
            aria-label="إغلاق"
            className="absolute inset-0 bg-[#06110d]/45 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="card-glow relative w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white/88 p-7 text-center shadow-[0_40px_100px_-24px_rgba(8,22,17,0.45)] backdrop-blur-2xl"
          >
            {/* زخارف زمردية وذهبية */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-brand-500/12 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-12 h-44 w-44 rounded-full bg-gold-500/14 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.3]" />
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />

            <button
              type="button"
              onClick={close}
              aria-label="إغلاق"
              className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-brand-900/10 bg-white/70 text-ink-400 shadow-[0_1px_0_rgba(255,255,255,.9)_inset] transition hover:border-brand-500/30 hover:text-ink-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="relative">
              {/* كراون حلقي زمردي حول اللوجو */}
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <span className="absolute inset-0 animate-pulse-ring rounded-full border border-brand-500/35" />
                <span className="absolute inset-0 rounded-full bg-brand-500/10 blur-sm" />
                <motion.div
                  initial={{ scale: 0.7, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, duration: 0.6, type: 'spring', bounce: 0.4 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/85 bg-white/85 shadow-[0_18px_40px_-20px_rgba(20,121,95,.5)]"
                >
                  <LogoMark className="h-10 w-10" framed={false} />
                </motion.div>
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold-600/25 bg-gold-500/[0.08] px-3.5 py-1.5 text-[10px] font-bold text-gold-700">
                <Sparkles className="h-3 w-3" />
                {t.guest.hello}
              </div>

              <h2 className="mt-3 font-display text-xl font-extrabold text-ink-950">
                {t.guest.title}
              </h2>
              <p className="mx-auto mt-2.5 max-w-xs text-[11.5px] leading-6 text-ink-500">
                {t.guest.sub}
              </p>

              {/* خطوات مرقمة زي فوتر بودي */}
              <div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-2" dir={t.dir}>
                {([1, 2, 3] as const).map((key, index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + index * 0.12, duration: 0.45 }}
                    className="rounded-xl border border-white/80 bg-white/55 px-2 py-3 shadow-[0_1px_0_rgba(255,255,255,.9)_inset]"
                  >
                    <p className="font-latin text-[9px] font-extrabold tracking-[0.2em] text-gold-600" dir="ltr">
                      {`0${key}`}
                    </p>
                    <p className="mt-1.5 text-[9px] font-semibold leading-4 text-ink-500">
                      {t.guestSteps[key]}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href="#features"
                  onClick={close}
                  className="group flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] px-4 text-[12px] font-extrabold text-[#1c1503] shadow-[0_14px_36px_-14px_rgba(200,162,75,.6)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-14px_rgba(200,162,75,.75)]"
                  dir={t.dir}
                >
                  {t.guest.primary}
                </Link>
                <Link
                  href="/login?tab=register"
                  onClick={close}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border border-brand-900/12 bg-white/65 px-4 text-[12px] font-bold text-ink-700 shadow-[0_1px_0_rgba(255,255,255,.9)_inset] transition hover:-translate-y-0.5 hover:border-brand-500/30 hover:bg-white/90 hover:text-ink-950"
                  dir={t.dir}
                >
                  {t.guest.secondary}
                </Link>
              </div>

              <button
                type="button"
                onClick={close}
                className="mt-3 text-[10px] font-semibold text-ink-400 transition hover:text-ink-700"
              >
                {t.guest.dismiss}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
