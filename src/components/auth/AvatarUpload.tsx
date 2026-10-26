'use client';

import * as React from 'react';
import { Camera, Loader2, Trash2, UploadCloud, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_BYTES = 3 * 1024 * 1024;

export function AvatarUpload({
  value,
  onChange,
  onBusy,
}: {
  value: string;
  onChange: (url: string) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [dragging, setDragging] = React.useState(false);

  const upload = async (file: File) => {
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('اختر ملف صورة صحيح');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('حجم الصورة يجب أن يكون أقل من 3 ميجابايت');
      return;
    }

    const local = URL.createObjectURL(file);
    setPreview(local);
    setUploading(true);
    onBusy?.(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: form,
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'تعذر رفع الصورة');
      }
      onChange(data.url);
      setPreview(data.url);
    } catch (err) {
      setError((err as Error).message);
      setPreview('');
      onChange('');
    } finally {
      setUploading(false);
      onBusy?.(false);
      URL.revokeObjectURL(local);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const shown = preview || value;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-4 rounded-2xl border border-dashed p-3 transition',
          dragging
            ? 'border-gold-400/60 bg-gold-500/[0.07]'
            : 'border-brand-900/10 bg-white/605',
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-gold-500/20 bg-white/70">
          {shown ? (
            <img src={shown} alt="صورة الحساب" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink-300">
              <UserRound className="h-6 w-6" />
              <span className="text-[8px]">بدون صورة</span>
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#06110d]/35">
              <Loader2 className="h-5 w-5 animate-spin text-gold-700" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold-500/25 bg-gold-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-gold-800 transition hover:border-gold-400/45 hover:bg-gold-500/[0.12] disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" />
              {uploading ? 'جارٍ الرفع...' : shown ? 'تغيير الصورة' : 'رفع صورة'}
            </button>
            {shown ? (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setPreview('');
                  setError('');
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] text-ink-400 transition hover:bg-white/70 hover:text-ember-600"
              >
                <Trash2 className="h-3 w-3" />
                حذف
              </button>
            ) : null}
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-300">
            <UploadCloud className="h-3 w-3" />
            اسحب الصورة هنا أو اخترها · PNG / JPG / WEBP حتى 3MB
          </p>
          {error ? <p className="mt-1 text-[10px] text-ember-600">{error}</p> : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>
    </div>
  );
}
