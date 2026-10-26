import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { BrandPanel } from '@/components/shared/BrandPanel';

/**
 * Layout للـ auth — النسخة الدراكية: أسود فحمي × ليموني متوهج × ذهبي.
 * جانب القصة (BrandPanel) + جانب النموذج فوق توهجات سحرية خفيفة.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="auth-dark relative grid min-h-screen bg-[#060805] lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060805] px-4 py-10 sm:px-6 lg:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 46% at 52% -10%, rgba(163,230,53,0.10), transparent 68%), radial-gradient(ellipse 54% 38% at 96% 88%, rgba(200,162,75,0.12), transparent 70%), linear-gradient(180deg, #090b07 0%, #050604 100%)',
          }}
        />
        <div aria-hidden className="bg-grid-dark pointer-events-none absolute inset-0 opacity-60" />
        <div aria-hidden className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[18%] hidden w-px bg-gradient-to-b from-transparent via-brand-300/[0.08] to-transparent xl:block" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

        <Link
          href="/"
          className="absolute left-5 top-5 z-20 hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] text-ink-100/80 shadow-[0_6px_20px_-12px_rgba(0,0,0,.6)] backdrop-blur-md transition hover:border-brand-400/30 hover:bg-white/10 hover:text-brand-300 lg:flex"
        >
          <ArrowRight className="h-3 w-3 rotate-180" />
          العودة للرئيسية
        </Link>
        <div className="absolute right-5 top-5 z-20 hidden items-center gap-1.5 rounded-full border border-brand-300/20 bg-brand-300/[0.07] px-3 py-1.5 text-[9px] text-brand-200 lg:flex">
          <ShieldCheck className="h-3 w-3" />
          جلسة مشفّرة
        </div>

        <div className="relative z-10 w-full max-w-[520px]">{children}</div>
      </div>
    </div>
  );
}
