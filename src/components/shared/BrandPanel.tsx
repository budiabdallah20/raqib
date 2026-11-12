import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Clock,
  GraduationCap,
  LockKeyhole,
  Sparkles,
  Users,
} from 'lucide-react';
import { AcademicGateLogo } from '@/components/stage/AcademicGateMark';

const FEATURES = [
  {
    icon: Clock,
    title: 'فتح المحاضرة برمز QR',
    body: 'رمز QR حيّ يظهر على شاشتك — الطلبة يمسحوه ويُسجَّل حضورهم لحظيًا.',
  },
  {
    icon: Users,
    title: 'لوحة حضور لحظية',
    body: 'شاهد الأعداد تتحدّث أثناء المحاضرة وصدّر التقرير بضغطة واحدة.',
  },
  {
    icon: GraduationCap,
    title: 'حساب حضور عادل',
    body: 'نوافذ زمنية تساعد على تنظيم تسجيل الحضور أثناء المحاضرة.',
  },
  {
    icon: BookOpenCheck,
    title: 'تقارير تجمع نفسها',
    body: 'سجل المواد والمحاضرات موثّق في قاعدة بيانات محمية تلقائيًا.',
  },
];

/**
 * الجانب القصصي لصفحات الدخول ضمن هوية المسرح الأكاديمي.
 */
export function BrandPanel() {
  return (
    <aside className="auth-story-stage relative hidden flex-col justify-between overflow-hidden bg-[#180B12] px-8 py-8 text-[#F8F5F2] lg:flex xl:px-12">
      <div className="auth-story-proscenium" aria-hidden>
        <span className="auth-story-arch" />
        <span className="auth-story-curtain auth-story-curtain-start" />
        <span className="auth-story-curtain auth-story-curtain-end" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 72% 48% at 18% 6%, rgba(255,145,77,0.14), transparent 62%), radial-gradient(ellipse 60% 44% at 88% 88%, rgba(132,36,65,0.10), transparent 62%), linear-gradient(155deg, rgba(255,255,255,0.045) 0%, transparent 34%)',
        }}
      />
      <div aria-hidden className="bg-grid-dark absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise" />
      <div aria-hidden className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-[#842441]/[0.07] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#FF914D]/[0.09] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-6 top-1/3 hidden font-display text-[10rem] font-bold leading-none text-[#F5B46B]/[0.05] xl:block">R</div>

      <div aria-hidden className="pointer-events-none absolute left-4 top-4 h-14 w-14 border-l-2 border-t-2 border-[#FF914D]/20" />
      <div aria-hidden className="pointer-events-none absolute bottom-4 right-4 h-14 w-14 border-b-2 border-r-2 border-[#FF914D]/30" />

      <div className="relative flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] text-[#F8F5F2]/80 transition hover:border-[#F5B46B]/40 hover:bg-white/10 hover:text-[#F5B46B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF914D]/50"
        >
          <ArrowRight className="h-3 w-3 rotate-180 transition-transform group-hover:translate-x-0.5" />
          العودة للرئيسية
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF914D]/30 bg-[#FF914D]/[0.08] px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-[#F5B46B]">
          مسرح المعرفة الأكاديمية
        </span>
      </div>

      <div className="relative my-8 max-w-xl">
        <AcademicGateLogo className="mb-6" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F5B46B]/25 bg-[#F5B46B]/[0.08] px-3 py-1 text-[10px] font-medium text-[#F5B46B]">
          <Sparkles className="h-3 w-3" />
          منصة الحضور الذكية
        </span>
        <h1 className="mt-5 font-display text-[2.6rem] font-black leading-[1.12] tracking-tight text-[#F8F5F2]">
          كل محاضرة تُحسب،
          <span className="block bg-[linear-gradient(100deg,#F8F5F2,#F5B46B_45%,#FF914D)] bg-clip-text text-transparent">
            وكل دقيقة تعدّ.
          </span>
        </h1>
        <p className="mt-4 text-[13.5px] leading-[2] text-[#a89aa2]">
          رقيب يحوّل الحضور إلى تجربة فورية بالـ QR: الدكتور يفتح المحاضرة، الطالب
          يمسح الرمز، والتقرير يتحدّث لحظيًا ضمن صلاحيات واضحة لكل دور.
        </p>

        <ul className="mt-8 space-y-3">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="auth-story-feature group flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-[#F5B46B]/30 hover:bg-white/[0.07]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#F5B46B]/20 bg-[#F5B46B]/[0.10] text-[#F5B46B]">
                <feature.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold text-[#F8F5F2]">
                  {feature.title}
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-5 text-[#a89aa2]">
                  {feature.body}
                </span>
              </span>
              <span
                aria-hidden
                className="font-latin text-[10px] tabular-nums text-[#F5B46B]/25 transition-colors group-hover:text-[#F5B46B]/65"
              >
                +
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative space-y-4">
        <figure className="max-w-xl rounded-2xl border border-[#FF914D]/20 bg-white/[0.03] p-4">
          <blockquote className="font-display text-[15px] leading-8 text-[#F5B46B]/85">
            وَقُل رَّبِّ زِدْنِي عِلْمًا
          </blockquote>
          <figcaption className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#a89aa2]">
            سورة طه — الآية ١١٤
          </figcaption>
        </figure>
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 text-[10px] text-[#a89aa2]">
          <span className="flex items-center gap-1.5">
            <LockKeyhole className="h-3 w-3 text-[#F5B46B]/85" />
            جلسة آمنة · ملفات ارتباط محمية
          </span>
          <span className="flex items-center gap-1.5">
            بحسب صلاحيات حسابك
          </span>
        </div>
      </div>
    </aside>
  );
}
