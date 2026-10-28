'use client';

/**
 * مبدّل اللغة بنفس إحساس موقع بودي: pill فيه جلوب + علمين CSS
 * (علم مصر للعربي / علم بريطانيا للإنجليزي) — بدون إيموجي.
 * يشتغل على خلفية فاتحة (الأيفوري) وعلى الغامقة برضه.
 */

import * as React from 'react';
import { Globe } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** علم مصر — ٣ خطوط أفقية (أحمر/أبيض/أسود) + معين ذهبي */
function EgFlag({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-3.5 w-5 shrink-0 flex-col overflow-hidden rounded-[3px] shadow-[0_0_8px_rgba(206,17,38,0.35)] ${className ?? ''}`}
      dir="ltr"
    >
      <span className="h-1/3 w-full bg-[#CE1126]" />
      <span className="h-1/3 w-full bg-white" />
      <span className="h-1/3 w-full bg-black" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[6px] leading-none text-[#C9A227]">
        ◈
      </span>
    </span>
  );
}

/** علم بريطانيا مبسّط — أزرق + سنجة بيضا وحمرا */
function UkFlag({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] bg-[#012169] shadow-[0_0_8px_rgba(1,33,105,0.35)] ${className ?? ''}`}
      dir="ltr"
    >
      <span className="absolute left-[-15%] top-1/2 h-[2px] w-[130%] origin-center -translate-y-1/2 rotate-[26deg] bg-white" />
      <span className="absolute left-[-15%] top-1/2 h-[2px] w-[130%] origin-center -translate-y-1/2 -rotate-[26deg] bg-white" />
      <span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-white" />
      <span className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 bg-white" />
      <span className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-[#C8102E]" />
      <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-[#C8102E]" />
    </span>
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
        'inline-flex h-10 items-center gap-1 rounded-full border border-[rgba(19,31,26,.12)] bg-[rgba(255,255,255,.95)] p-1 shadow-[0_10px_30px_-18px_rgba(19,56,44,.55),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur',
        className,
      )}
      role="group"
      aria-label="اللغة"
    >
      <Globe
        aria-hidden="true"
        className="mx-1.5 h-3.5 w-3.5 shrink-0 text-[#88632c]/85"
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
              'flex h-7 items-center gap-1.5 rounded-full px-2.5 transition',
              active
                ? 'bg-[linear-gradient(135deg,#c8a24b,#e6cb78)] text-[#1c1503] shadow-[0_6px_18px_-8px_rgba(200,162,75,.6)]'
                : 'text-[#5a6b60] hover:bg-[rgba(163,230,53,.12)] hover:text-[#101608]',
            )}
          >
            {entry.flag === 'eg' ? (
              <EgFlag className={active ? '' : 'opacity-70'} />
            ) : (
              <UkFlag className={active ? '' : 'opacity-70'} />
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
