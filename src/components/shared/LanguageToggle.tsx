'use client';

/**
 * مبدّل اللغة — pill فيه جلوب + علمان حقيقيان بدقة عالية:
 * علم مصر (أحمر/أبيض/أسود + نسر صلاح الدين الذهبي المصوَّر هندسيًا)
 * وعلم بريطانيا (Union Jack بهندسة صحيحة لأقطار الصليب).
 * أعلام SVG نظيفة — بلا توهّج وبدون أي تأثير أخضر.
 */

import * as React from 'react';
import { Globe } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** علم مصر — المقياس 3:2، نظيف وواضح */
function EgFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      role="img"
      aria-label="علم مصر"
      className={`block h-10 w-auto shrink-0 rounded-[3px] ring-1 ring-black/15 ${className ?? ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="40" fill="#CE1126" />
      <rect y="13.33" width="60" height="13.34" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#000000" />
      {/* نسر صلاح الدين — نسخة هندسية مصغّرة بذهب ملكي */}
      <g fill="#AF9B3B" transform="translate(30,20)">
        <path d="M0 -6.4c-1.1.6-3 .9-5.3.9-1.6 0-2.8-.1-3.6-.4 1.1 1.1 2.8 1.8 4.7 2.1-1.1.7-1.7 1.8-1.7 3.1 0 2.6 2.7 4.4 5.9 4.4s5.9-1.8 5.9-4.4c0-1.3-.6-2.4-1.7-3.1 1.9-.3 3.6-1 4.7-2.1-.8.3-2 .4-3.6.4-2.3 0-4.2-.3-5.3-.9z" transform="scale(0.92)" />
        <ellipse cx="0" cy="-1.9" rx="2.5" ry="2.7" />
        <path d="M-1.6 1.2l-1.5 3.1h6.2L1.6 1.2h-3.2z" />
        <path d="M-3.4 4.9h6.8v.9h-6.8z" />
      </g>
    </svg>
  );
}

/** علم بريطانيا — Union Jack بهندسة المقاييس الصحيحة */
function UkFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      role="img"
      aria-label="Union Jack"
      className={`block h-10 w-auto shrink-0 rounded-[3px] ring-1 ring-black/15 ${className ?? ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <clipPath id="uk-r">
        <rect width="60" height="40" rx="2.5" />
      </clipPath>
      <g clipPath="url(#uk-r)">
        <rect width="60" height="40" fill="#012169" />
        {/* صليب أندرو: أقطار بيضاء ثم حمراء بإزاحة المقياس */}
        <path d="M0 0 60 40M60 0 0 40" stroke="#FFFFFF" strokeWidth="7.2" />
        <path d="M0 0 60 40M60 0 0 40" stroke="#C8102E" strokeWidth="2.4" />
        <path d="M30 0v40M0 20h60" stroke="#FFFFFF" strokeWidth="13.4" />
        <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="8" />
      </g>
    </svg>
  );
}

const LANGS: Record<Lang, { flag: 'eg' | 'uk'; label: string }> = {
  ar: { flag: 'eg', label: 'AR' },
  en: { flag: 'uk', label: 'EN' },
};

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  const langs: Lang[] = ['ar', 'en'];

  return (
    <div
      className={cn(
        'inline-flex h-10 items-center gap-1 rounded-full border border-gold-500/25 bg-[rgba(255,255,255,.92)] p-1 shadow-[0_10px_30px_-18px_rgba(111,84,34,.5),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur',
        className,
      )}
      role="group"
      aria-label="اللغة"
    >
      <Globe
        aria-hidden="true"
        className="mx-1.5 h-3.5 w-3.5 shrink-0 text-gold-700/85"
        strokeWidth={2.4}
      />
      {langs.map((code) => {
        const entry = LANGS[code];
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            title={code === 'ar' ? 'العربية' : 'English'}
            className={cn(
              'flex h-7 items-center gap-2 rounded-full px-2 transition',
              active
                ? 'bg-[linear-gradient(135deg,#c8a24b,#e6cb78)] text-[#1c1503] shadow-[0_6px_18px_-8px_rgba(200,162,75,.55)]'
                : 'text-[#6b6042] hover:bg-gold-500/12 hover:text-ink-900',
            )}
          >
            {entry.flag === 'eg' ? (
              <EgFlag className="-ml-0.5 h-[18px]" />
            ) : (
              <UkFlag className="-ml-0.5 h-[18px]" />
            )}
            <span
              dir="ltr"
              className="font-latin text-[10px] font-bold tracking-[0.12em] leading-none"
            >
              {entry.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
