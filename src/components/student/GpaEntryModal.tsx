'use client';

import * as React from 'react';
import { GraduationCap, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

/** نافذة إدخال المعدل السابق — تظهر مرة واحدة وتُحفظ في الحساب فوراً (لا يمكن التعديل بعدها) */
export function GpaEntryModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (previousGpa: number) => void;
}) {
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setValue('');
      setError('');
      const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0 || num > 4) {
      setError('ادخل معدلاً بين 0.00 و 4.00');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api('/api/student/profile', {
        method: 'POST',
        body: JSON.stringify({ previousGpa: Math.round(num * 100) / 100 }),
      });
      onSaved(Math.round(num * 100) / 100);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="إدخال المعدل التراكمي السابق"
    >
      <div className="w-full max-w-md animate-rise rounded-3xl border border-gold-400/30 bg-white/85 p-6 shadow-[0_24px_70px_-20px_rgba(60,42,4,0.35)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-400/30 bg-gold-400/15 text-gold-700">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink-950">معدلك التراكمي السابق</h2>
              <p className="text-xs text-ink-400">لتحديث المنحنى التراكمي — إدخال لمرة واحدة</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-900/10 bg-white/70 text-ink-400 transition hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">
          <label htmlFor="previous-gpa" className="block text-sm font-bold text-ink-800">
            المعدل السابق (من 4.00)
          </label>
          <input
            id="previous-gpa"
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={4}
            dir="ltr"
            placeholder="2.75"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submit();
            }}
            className="mt-2 w-full rounded-2xl border border-brand-900/15 bg-white/80 px-4 py-3 text-center font-display text-2xl font-bold text-ink-950 outline-none transition focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20"
          />
          {error ? (
            <p role="alert" className="mt-3 rounded-xl border border-ember-500/25 bg-ember-500/[0.08] px-3 py-2 text-xs text-ember-600">
              {error}
            </p>
          ) : (
            <p className="mt-3 text-xs text-ink-400">
              يُحفظ في ملفك الأكاديمي فوراً — تأكد من صحته قبل الحفظ (مثال: معدل السنة الأولى).
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            لاحقاً
          </Button>
          <Button onClick={() => void submit()} disabled={saving || value === ''}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ المعدل'}
          </Button>
        </div>
      </div>
    </div>
  );
}
