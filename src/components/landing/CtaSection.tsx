'use client';

/**
 * CTA section — moved verbatim from the former LandingPage monolith.
 * (Untouched scope per plan — only inherits global perf fixes.)
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { LetterMedallion, fadeUp } from './landing-shared';

export function CtaSection() {
  const { t } = useLang();

  return (
    <section className="theatre-cta relative px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-[32px_64px_32px_64px] border border-[#F28C28]/30 bg-gradient-to-b from-[#211B20] via-[#181418] to-[#111014] p-8 sm:p-12 lg:p-16">
          <div aria-hidden className="pointer-events-none absolute -inset-8 -z-10 rounded-[48px] bg-[radial-gradient(ellipse_70%_80%_at_50%_16%,rgba(242,140,40,0.14),transparent_82%),radial-gradient(ellipse_80%_45%_at_50%_100%,rgba(101,29,50,0.22),transparent_75%)] blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -inset-4 -z-10 rounded-[40px] border border-white/10" />

          <div className="relative flex flex-col items-center text-center">
            <motion.div {...fadeUp()} className="max-w-2xl">
              <div className="flex items-center justify-center gap-2">
                <LetterMedallion char="🎭" compact />
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#F28C28]/70" />
                <span className="font-latin text-[8.5px] font-bold uppercase tracking-[0.3em] text-[#FFB45C]">
                  {t.sections.ctaTitle}
                </span>
              </div>
              <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,3rem)] font-black leading-tight tracking-[-0.02em] text-[#FFFFFF]">
                {t.sections.ctaTitle}{' '}
                <span className="text-gold-gradient">{t.sections.ctaGold}</span>
              </h2>
              <p className="mt-4 max-w-md mx-auto text-[14px] leading-7 text-[#b8abb2]">
                {t.sections.ctaSub}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/login?tab=register"
                  className="group relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-[linear-gradient(110deg,#641B35,#F28C28_45%,#FFB45C_75%,#ffd4a3)] px-6 text-[13px] font-bold text-[#FFFFFF] shadow-[0_20px_46px_-16px_rgba(200,162,75,.7)] ring-1 ring-gold-300/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_62px_-14px_rgba(200,162,75,.8)]"
                >
                  <span className="relative z-10">{t.sections.ctaBtn}</span>
                  <ArrowLeft className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.22),transparent_45%)]" />
                  <span aria-hidden className="absolute inset-y-0 -left-12 w-12 -skew-x-12 bg-white/20 blur-md transition-all duration-700 group-hover:left-[110%]" />
                </Link>
                <Link
                  href="/login"
                  className="group inline-flex h-12 items-center gap-2.5 rounded-full border border-white/15 bg-[#211B20]/70 px-6 text-[13px] font-bold text-[#FFFFFF] shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F28C28]/45 hover:bg-[#3A1020]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]/60"
                >
                  {t.sections.ctaBtn2}
                  <ArrowUpRight className="h-4 w-4 text-[#F28C28] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Finale transition — a static velvet valance handing the stage to the footer */}
      <div aria-hidden className="theatre-stage-edge mx-auto mt-12 max-w-6xl sm:mt-16" />
    </section>
  );
}
