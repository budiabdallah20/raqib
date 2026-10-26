import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-mesh-gold opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-20" />
      <div className="relative">
        <Logo stacked markClassName="h-16 w-16" />
      </div>
      <p className="relative font-latin text-6xl font-extrabold text-gold-gradient" dir="ltr">
        404
      </p>
      <div className="relative space-y-2">
        <h1 className="font-display text-2xl font-extrabold text-ink-950">
          الصفحة غير موجودة
        </h1>
        <p className="max-w-sm text-sm leading-7 text-ink-500">
          يبدو أنك خرجت عن مسار المنصة. لا تقلق — رقيب دائمًا في انتظارك.
        </p>
      </div>
      <Link
        href="/"
        className="relative flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(110deg,#8a6424,#c8a24b_45%,#e6cb78)] px-5 text-sm font-bold text-[#1c1503] shadow-[0_14px_36px_-14px_rgba(200,162,75,.6)] transition hover:-translate-y-0.5"
      >
        العودة للرئيسية
        <ArrowRight className="h-4 w-4 rotate-180" />
      </Link>
    </main>
  );
}
