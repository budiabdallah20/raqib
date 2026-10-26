'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

export function QRScanner({
  onResult,
  onClose,
}: {
  onResult: (text: string) => void;
  onClose: () => void;
}) {
  const regionId = React.useId().replace(/:/g, '');
  const [error, setError] = React.useState('');
  const done = React.useRef(false);

  React.useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const instance = new Html5Qrcode(regionId);
        scanner = instance;
        await instance.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (done.current) return;
            done.current = true;
            onResult(decoded);
          },
          () => undefined,
        );
      } catch {
        setError('تعذر فتح الكاميرا. تأكد من السماح بالوصول عبر HTTPS.');
      }
    })();

    return () => {
      cancelled = true;
      if (scanner) {
        scanner.stop().then(() => scanner?.clear()).catch(() => undefined);
      }
    };
  }, [onResult, regionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06110d]/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-brand-900/10 bg-[#0B0A0E] p-5 shadow-[0_30px_90px_-24px_rgba(0,0,0,0.9)]">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F97B22]" />
          <h2 className="font-display text-lg font-bold">مسح رمز الحضور</h2>
        </div>
        <div
          id={regionId}
          className="overflow-hidden rounded-xl border border-[#F97B22]/20 bg-black"
        />
        <p className="mt-3 text-[11px] text-ink-400">
          وجّه الكاميرا نحو رمز QR المعروض في المحاضرة.
        </p>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        <Button variant="outline" className="mt-4 w-full" onClick={onClose}>
          إغلاق
        </Button>
      </div>
    </div>
  );
}
