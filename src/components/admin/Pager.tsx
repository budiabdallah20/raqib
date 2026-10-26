'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pager({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="grid h-9 w-9 place-items-center rounded-lg border border-brand-900/10 bg-white/60 text-ink-500 transition enabled:hover:bg-brand-500/[0.08] disabled:opacity-30"
        aria-label="السابق"
      >
        <ChevronRight size={16} />
      </button>
      <span className="text-sm text-ink-500">
        صفحة <span className="font-bold text-brand-700">{page}</span> من {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="grid h-9 w-9 place-items-center rounded-lg border border-brand-900/10 bg-white/60 text-ink-500 transition enabled:hover:bg-brand-500/[0.08] disabled:opacity-30"
        aria-label="التالي"
      >
        <ChevronLeft size={16} />
      </button>
    </div>
  );
}
