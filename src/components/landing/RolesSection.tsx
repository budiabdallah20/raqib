'use client';

/**
 * Roles section — moved verbatim from the former LandingPage monolith.
 * (Untouched scope per plan — only inherits global perf fixes.)
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, GraduationCap, LayoutDashboard } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { TheaterCard } from '@/components/external';
import { LetterMedallion, PORTAL_ICON_COMPONENTS, ROLE_META, WORD_LETTERS, fadeUp } from './landing-shared';

export function RolesSection() {
  const { t } = useLang();

  return (
    <section id="roles" className="theatre-roles relative px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <motion.div {...fadeUp()}>
            <div className="flex items-center gap-2.5">
              <LetterMedallion char={WORD_LETTERS[3]} compact />
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#F28C28]/70" />
              <span className="font-latin text-[8.5px] font-bold uppercase tracking-[0.3em] text-[#FFB45C]">
                {t.sections.rolesKicker}
              </span>
            </div>
            <h2 className="mt-3 font-display text-[clamp(1.3rem,2.6vw,1.7rem)] font-black leading-tight tracking-[-0.03em] text-[#FFFFFF]">
              {t.sections.roles}{' '}
              <span className="text-gold-gradient">{t.sections.rolesGold}</span>
            </h2>
          </motion.div>
          <motion.p {...fadeUp(0.08)} className="max-w-md text-[11.5px] leading-[1.8] text-[#b8abb2]">
            {t.sections.rolesSub}
          </motion.p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {(() => {
            const roles = [
              { key: 'student', icon: GraduationCap, accent: '#FFB45C' },
              { key: 'professor', icon: BookOpen, accent: '#c8a96b' },
              { key: 'admin', icon: LayoutDashboard, accent: '#a69af5' },
            ] as const;
            return roles.map((role) => {
              const meta = ROLE_META.find((m) => m.key === role.key)!;
              const Icon = PORTAL_ICON_COMPONENTS[role.key];
              return (
                <TheaterCard
                  key={role.key}
                  variant="plaque"
                  className="p-6"
                  {...fadeUp(0.1 * ['student', 'professor', 'admin'].indexOf(role.key))}
                >
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.05] text-white transition-all duration-300" style={{ color: role.accent }}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-[#FFFFFF]">
                    {role.key === 'student' ? 'بوابة الطالب' : role.key === 'professor' ? 'بوابة الدكتور' : 'بوابة الإدارة'}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#b8abb2]">{t.roleCards[role.key].b}</p>
                  <ul className="mt-4 space-y-2">
                    {t.roleCards[role.key].p.map((point, i) => (
                      <li key={i} className="flex items-center gap-2 text-[12px] text-[#b8abb2]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: role.accent }} />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={meta.key === 'admin' ? '/login?tab=admin' : '/login?tab=register'}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] px-4 py-2.5 text-[12px] font-extrabold text-[#1c1503] shadow-[0_12px_30px_-10px_rgba(200,162,75,.6)] transition hover:-translate-y-0.5"
                  >
                    {t.roleEnter} {role.key === 'student' ? 'كطالب' : role.key === 'professor' ? 'كدكتور' : 'كإدارة'}
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </TheaterCard>
              );
            });
          })()}
        </div>
      </div>
    </section>
  );
}
