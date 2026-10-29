'use client';

/**
 * 🖼 حالات فارغة برسوم SVG مخصصة — بأسلوب الخط اليدوي بألوان الهوية
 * (بديل نص «لا يوجد» الرمادي الممل).
 */
import * as React from 'react';

type Kind = 'lectures' | 'tasks' | 'notes' | 'materials' | 'notices' | 'dayOff' | 'grades';

const ART: Record<Kind, React.ReactNode> = {
  lectures: (
    /* شمس فوق قاعة دراسة */
    <>
      <circle cx="150" cy="42" r="14" className="fill-gold-400/20 stroke-gold-500/50" strokeWidth="2" />
      <path d="M150 20v-6M150 64v6M172 42h6M130 42h-6M166 26l4-4M166 58l4 4M134 26l-4-4M134 58l-4 4" className="stroke-gold-500/60" strokeWidth="2" strokeLinecap="round" />
      <rect x="24" y="52" width="84" height="52" rx="8" className="fill-brand-500/[0.08] stroke-brand-500/45" strokeWidth="2" />
      <path d="M36 66h60M36 76h44M36 86h30" className="stroke-brand-500/40" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  tasks: (
    /* حافظة بأوراق مؤشّرة */
    <>
      <rect x="52" y="22" width="86" height="66" rx="10" className="fill-white/70 stroke-brand-500/40" strokeWidth="2" />
      <path d="M66 38h58M66 50h44M66 62h52" className="stroke-brand-500/35" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M132 64l10 10 18-22" className="stroke-brand-600/70" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="46" cy="84" r="7" className="fill-gold-400/25 stroke-gold-500/55" strokeWidth="2" />
    </>
  ),
  notes: (
    /* ريشة فوق ورقة ملاحظات */
    <>
      <path d="M34 84 C40 52 66 30 108 30 C124 30 136 36 142 44 C148 52 146 66 138 74 C112 96 66 92 34 84 Z" className="fill-brand-500/[0.07] stroke-brand-500/45" strokeWidth="2" />
      <path d="M128 40 C112 56 94 70 66 80" className="stroke-brand-600/45" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M56 96h84" className="stroke-gold-500/50" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  materials: (
    /* مجلد مفتوح فارغ */
    <>
      <path d="M30 78 L52 46 L98 46 L112 62 L158 62 L146 92 L42 92 Z" className="fill-gold-400/[0.14] stroke-gold-500/50" strokeWidth="2" strokeLinejoin="round" />
      <path d="M52 46 L46 40 L120 40 L134 56" className="fill-brand-500/[0.10] stroke-brand-500/40" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="94" cy="74" r="4" className="fill-white/80 stroke-gold-500/45" strokeWidth="1.6" />
    </>
  ),
  notices: (
    /* جرس هادئ */
    <>
      <path d="M96 26 a14 14 0 0 1 14 14 c0 18 8 26 14 32 H74 c6 -6 14 -14 14 -32 a14 14 0 0 1 8 -14 Z" className="fill-brand-500/[0.08] stroke-brand-500/45" strokeWidth="2" strokeLinejoin="round" />
      <path d="M88 104 a16 10 0 0 0 24 0" className="stroke-gold-500/55" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="110" cy="34" r="3" className="fill-gold-500/70" />
    </>
  ),
  grades: (
    /* بطاقة تقرير فارغة */
    <>
      <rect x="62" y="26" width="76" height="58" rx="8" className="fill-white/70 stroke-brand-500/40" strokeWidth="2" />
      <path d="M74 68 C84 54 92 44 100 40" className="stroke-gold-500/55" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M124 34l6 6-20 20-10 2 2-10 20-18" className="stroke-brand-500/35" strokeWidth="2" strokeLinejoin="round" fill="none" />
    </>
  ),
  dayOff: (
    /* كوب قهوة هدوء */
    <>
      <path d="M76 64 h40 v18 a14 14 0 0 1 -14 14 h-12 a14 14 0 0 1 -14 -14 Z" className="fill-brand-500/[0.08] stroke-brand-500/45" strokeWidth="2" />
      <path d="M116 68 h10 a8 8 0 0 1 0 16 h-10" className="stroke-gold-500/55" strokeWidth="2" fill="none" />
      <path d="M86 56 c0 -6 6 -6 6 -12 M100 56 c0 -6 6 -6 6 -12" className="stroke-gold-500/40" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
};

export function EmptyState({
  kind,
  title,
  sub,
  action,
  compact,
}: {
  kind: Kind;
  title: string;
  sub?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'py-6 text-center' : 'py-10 text-center'}>
      <svg
        viewBox="0 0 190 130"
        className={`mx-auto animate-float ${compact ? 'h-20' : 'h-28'}`}
        fill="none"
        aria-hidden="true"
      >
        {ART[kind]}
      </svg>
      <p className="mt-3 font-display text-base font-bold text-ink-800">{title}</p>
      {sub ? <p className="mx-auto mt-1 max-w-sm text-sm text-ink-400">{sub}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
