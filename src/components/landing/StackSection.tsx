'use client';

/**
 * Technologies section — rebuilt as "rows of elegant stage seating" (Section C):
 * small glossy seat-cards arranged side by side like theater seats, with LED
 * aisle lighting between them. Pure CSS hover illumination — no per-card JS
 * observers, no idle animation. Must render lighter than the previous grid.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { TheaterCard } from '@/components/external';
import { STACK_CARDS, TECH_LOGOS, TECH_NAME_TO_INDEX, TechLogoMark } from '@/components/shared/TechLogos';
import { LetterMedallion, WORD_LETTERS, fadeUp } from './landing-shared';

export function StackSection() {
  const { t } = useLang();
  const headingId = 'stack-heading';

  return (
    <section id="stack" className="theatre-stack relative scroll-mt-24 border-t border-white/[0.07] px-4 py-16 sm:px-6 sm:py-20 lg:py-24 [content-visibility:auto] [contain-intrinsic-size:auto_520px]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(242,140,40,0.1) 0%, rgba(101,29,50,0.08) 50%, transparent 100%)' }} />
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <motion.div {...fadeUp()}>
            <div className="flex items-center gap-2.5">
              <LetterMedallion char={WORD_LETTERS[2]} compact />
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#F28C28]/70" />
              <span className="font-latin text-[8.5px] font-bold uppercase tracking-[0.3em] text-[#FFB45C]">
                {t.sections.stackKicker}
              </span>
            </div>
            <h2 id={headingId} className="mt-3 font-display text-[clamp(1.3rem,2.6vw,1.7rem)] font-black leading-tight tracking-[-0.03em] text-[#FFFFFF]">
              {t.sections.stack}{' '}
              <span className="text-gold-gradient">{t.sections.stackGold}</span>
            </h2>
          </motion.div>
          <motion.p {...fadeUp(0.08)} className="max-w-md text-[11.5px] leading-[1.8] text-[#b8abb2]">
            {t.sections.stackSub}
          </motion.p>
        </div>

        <div className="relative mt-10">
          <div aria-hidden className="pointer-events-none absolute -inset-3 rounded-[20px_36px_20px_36px] border border-[#651D32]/50 sm:-inset-4" />
          <div aria-hidden className="pointer-events-none absolute -inset-1.5 rounded-[16px_30px_16px_30px] border border-[#F28C28]/20 sm:-inset-2" />
          <span aria-hidden className="pointer-events-none absolute -left-3 -top-3 h-6 w-6 border-l-2 border-t-2 border-[#F28C28]/60 rounded-tl-lg sm:-left-4 sm:-top-4 sm:h-8 sm:w-8" />
          <span aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-6 w-6 border-r-2 border-t-2 border-[#F28C28]/60 rounded-tr-lg sm:-right-4 sm:-top-4 sm:h-8 sm:w-8" />
          <span aria-hidden className="pointer-events-none absolute -bottom-3 -left-3 h-6 w-6 border-b-2 border-l-2 border-[#F28C28]/60 rounded-bl-lg sm:-bottom-4 sm:-left-4 sm:h-8 sm:w-8" />
          <span aria-hidden className="pointer-events-none absolute -bottom-3 -right-3 h-6 w-6 border-b-2 border-r-2 border-[#F28C28]/60 rounded-br-lg sm:-bottom-4 sm:-right-4 sm:h-8 sm:w-8" />

          <TheaterCard variant="tech" className="theatre-tech-grid p-4 sm:p-5">
            <div className="seats-grid grid grid-cols-3 gap-x-2.5 gap-y-7 sm:grid-cols-4 sm:gap-x-3 lg:grid-cols-6" role="list" aria-labelledby={headingId}>
              {STACK_CARDS.map((name, i) => {
                const idx = TECH_NAME_TO_INDEX.get(name) ?? 0;
                const tech = TECH_LOGOS[idx];
                const c = tech?.color ?? '#F28C28';
                return (
                  <div
                    key={name}
                    role="listitem"
                    id={`${headingId}-${name}`}
                    className="seat-card stagger-item group relative flex flex-col items-center gap-1.5 rounded-t-[14px] rounded-b-[7px] px-2 pb-3 pt-2.5 text-center"
                    style={{ ['--tech-glow' as string]: c, ['--d' as string]: `${120 + i * 55}ms` }}
                  >
                    <span aria-hidden className="seat-card-led" />
                    <span aria-hidden className="seat-card-seam" />
                    <span
                      className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/[0.94] transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10"
                      style={{ color: c === '#000000' || c === '#24292F' ? '#111014' : c }}
                    >
                      <TechLogoMark index={idx} className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <span className="font-latin text-[9.5px] font-bold leading-tight tracking-[-0.01em] text-[#FFF8F0]/90">
                      {tech?.name ?? name}
                    </span>
                    <span className="text-[8px] font-medium leading-none text-[#b8abb2]/70">{tech?.category ?? ''}</span>
                  </div>
                );
              })}
            </div>
          </TheaterCard>
        </div>
      </div>
    </section>
  );
}
