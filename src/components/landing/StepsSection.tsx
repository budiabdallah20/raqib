'use client';

/**
 * Steps section — refined as a theatrical staircase (Section D): the existing
 * StaircaseSteps architecture, with fewer/cleaner/compact in-step content and
 * guided amber lighting between the risers (CSS connector glow).
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { StaircaseSteps, TheaterCard } from '@/components/external';
import {
  LetterMedallion,
  PORTAL_ICON_COMPONENTS,
  ROLE_META,
  STEP_ICONS,
  WORD_LETTERS,
  fadeUp,
} from './landing-shared';

export function StepsSection() {
  const { t } = useLang();

  return (
    <section id="how" className="theatre-steps relative px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <motion.div {...fadeUp()}>
            <div className="flex items-center gap-2.5">
              <LetterMedallion char={WORD_LETTERS[1]} compact />
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#F28C28]/70" />
              <span className="font-latin text-[8.5px] font-bold uppercase tracking-[0.3em] text-[#FFB45C]">
                {t.sections.stepsKicker}
              </span>
            </div>
            <h2 className="mt-3 font-display text-[clamp(1.3rem,2.6vw,1.7rem)] font-black leading-tight tracking-[-0.03em] text-[#FFFFFF]">
              {t.sections.steps}{' '}
              <span className="text-gold-gradient">{t.sections.stepsGold}</span>
            </h2>
          </motion.div>
          <motion.p {...fadeUp(0.08)} className="max-w-md text-[11.5px] leading-[1.8] text-[#b8abb2]">
            {t.stepCards[1].body}
          </motion.p>
        </div>

        <div className="mt-10">
          <StaircaseSteps
            steps={[
              {
                number: 1,
                label: t.stepCards[1].title,
                description: t.stepCards[1].body,
                illuminated: true,
                content: (
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {(['student', 'professor', 'admin'] as const).map((role) => {
                      const Icon = PORTAL_ICON_COMPONENTS[role];
                      return (
                        <span
                          key={role}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[12px] font-bold text-[#FFF8F0]/90 transition-colors hover:border-[#F28C28]/40"
                        >
                          <Icon className="h-4 w-4 text-[#FFB45C]" />
                          {role === 'student' ? 'طالب' : role === 'professor' ? 'دكتور' : 'إدارة'}
                        </span>
                      );
                    })}
                  </div>
                ),
              },
              {
                number: 2,
                label: t.stepCards[2].title,
                description: t.stepCards[2].body,
                content: (
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <Link
                      href="/login"
                      className="group inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[linear-gradient(110deg,#641B35,#F28C28_45%,#FFB45C_75%,#ffd4a3)] px-4 text-[12px] font-extrabold text-[#FFFFFF] shadow-[0_12px_30px_-10px_rgba(200,162,75,.6)] transition hover:-translate-y-0.5"
                    >
                      {t.nav.login}
                      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                    </Link>
                    <Link
                      href="/login?tab=register"
                      className="group inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/15 bg-[#211B20]/70 px-4 text-[12px] font-bold text-[#FFFFFF] transition hover:-translate-y-0.5 hover:border-[#F28C28]/45"
                    >
                      {t.nav.start}
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                ),
              },
              {
                number: 3,
                label: t.stepCards[3].title,
                description: t.stepCards[3].body,
                content: (
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {ROLE_META.map((meta) => {
                      const Icon = PORTAL_ICON_COMPONENTS[meta.key];
                      return (
                        <TheaterCard key={meta.key} variant="ticket" className="flex items-center gap-2 !rounded-full px-4 py-2">
                          <Icon className="h-4 w-4" style={{ color: meta.accent }} />
                          <span className="text-[12px] font-bold text-[#FFF8F0]/90">
                            {meta.key === 'student' ? 'لوحة الطالب' : meta.key === 'professor' ? 'لوحة الدكتور' : 'لوحة الإدارة'}
                          </span>
                          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: meta.accent, boxShadow: `0 0 8px ${meta.accent}` }} />
                        </TheaterCard>
                      );
                    })}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

// STEP_ICONS retained for the marker glyphs if needed later
void STEP_ICONS;
