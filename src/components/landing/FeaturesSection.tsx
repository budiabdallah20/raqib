'use client';

/**
 * Features gallery — moved verbatim from the former LandingPage monolith.
 * (Untouched scope per plan — only inherits global perf fixes.)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { TheaterCard } from '@/components/external';
import { FEATURE_ICONS, LetterMedallion, WORD_LETTERS, fadeUp } from './landing-shared';

export function FeaturesSection() {
  const { t } = useLang();

  return (
    <section id="features" className="theatre-gallery relative px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <motion.div {...fadeUp()}>
            <div className="flex items-center gap-2.5">
              <LetterMedallion char={WORD_LETTERS[0]} compact />
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#F28C28]/70" />
              <span className="font-latin text-[8.5px] font-bold uppercase tracking-[0.3em] text-[#FFB45C]">
                {t.sections.everything}
              </span>
            </div>
            <h2 className="mt-3 font-display text-[clamp(1.3rem,2.6vw,1.7rem)] font-black leading-tight tracking-[-0.03em] text-[#FFFFFF]">
              {t.sections.everything}{' '}
              <span className="text-gold-gradient">{t.sections.everythingGold}</span>
            </h2>
          </motion.div>
          <motion.p {...fadeUp(0.08)} className="max-w-md text-[11.5px] leading-[1.8] text-[#b8abb2]">
            {t.sections.everythingSub}
          </motion.p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.map((feature, i) => {
            const FeatureIcon = FEATURE_ICONS[i];
            return (
              <TheaterCard
                key={feature.title}
                variant="exhibit"
                className="group p-6"
                {...fadeUp(0.08 * i)}
              >
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#F28C28]/10">
                  <FeatureIcon className="h-6 w-6 text-[#FFB45C]" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-[#FFFFFF]">{feature.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#b8abb2]">{feature.body}</p>
              </TheaterCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
