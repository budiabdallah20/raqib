import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { BrandPanel } from '@/components/shared/BrandPanel';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen bg-[#f7faf7] lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7faf7] px-4 py-10 sm:px-6 lg:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 46% at 52% -10%, rgba(20,121,95,0.12), transparent 68%), radial-gradient(ellipse 54% 38% at 96% 88%, rgba(200,162,75,0.10), transparent 70%), linear-gradient(180deg, #f9fbf9 0%, #f4f8f5 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="bg-grid pointer-events-none absolute inset-0 opacity-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[18%] hidden w-px bg-gradient-to-b from-transparent via-brand-900/[0.06] to-transparent xl:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/35 to-transparent"
        />

        <Link
          href="/"
          className="absolute left-5 top-5 z-20 hidden items-center gap-1.5 rounded-full border border-white/75 bg-white/55 px-3 py-1.5 text-[10px] text-ink-500 shadow-[0_6px_20px_-12px_rgba(8,22,17,.3)] backdrop-blur-md transition hover:border-brand-500/30 hover:bg-white/80 hover:text-brand-700 lg:flex"
        >
          <ArrowRight className="h-3 w-3 rotate-180" />
          العودة للرئيسية
        </Link>

        <div className="absolute right-5 top-5 z-20 hidden items-center gap-1.5 rounded-full border border-brand-500/15 bg-brand-500/[0.06] px-3 py-1.5 text-[9px] text-brand-700 lg:flex">
          <ShieldCheck className="h-3 w-3" />
          جلسة مشفّرة
        </div>

        <div className="relative z-10 w-full max-w-[520px]">{children}</div>
      </div>
    </div>
  );
}
