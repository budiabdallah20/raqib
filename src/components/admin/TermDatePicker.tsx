'use client';

import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ar } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarDays, X } from 'lucide-react';
import 'react-day-picker/style.css';

interface TermDatePickerProps {
  /** Current value in yyyy-MM-dd format (API/DB shape). */
  value: string | null;
  onValueChange: (value: string) => void;
}

function parseValue(value: string | null): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

/**
 * Arabic RTL date picker (react-day-picker v9 + date-fns `ar` locale) that
 * keeps the yyyy-MM-dd contract of the admin settings API. Closes on Escape
 * or outside click.
 */
export default function TermDatePicker({ value, onValueChange }: TermDatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const selected = parseValue(value);

  return (
    <div ref={rootRef} className="relative flex-1 min-w-44">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center gap-2 rounded-xl border border-brand-900/10 bg-white/60 px-3 text-sm text-ink-950"
      >
        <CalendarDays className="h-4 w-4 opacity-70" aria-hidden />
        <span className={selected ? '' : 'opacity-60'}>
          {selected ? format(selected, 'yyyy-MM-dd') : 'اختر تاريخًا'}
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 rounded-2xl border border-brand-900/10 bg-white p-3 text-ink-950 shadow-xl">
          <div className="mb-1 flex items-center justify-between text-xs text-ink-700">
            <span>اختيار التاريخ</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق">
              <X className="h-4 w-4" />
            </button>
          </div>
          <DayPicker
            dir="rtl"
            locale={ar}
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              onValueChange(format(date, 'yyyy-MM-dd'));
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
