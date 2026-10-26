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
import { Logo } from '@/components/shared/Logo';

const FEATURES = [
  {
    icon: Clock,
    title: 'فتح المحاضرة في ثوانٍ',
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
    body: 'نوافذ زمنية دقيقة تمنع تسجيل الحضور من خارج القاعة.',
  },
  {
    icon: BookOpenCheck,
    title: 'تقارير تجمع نفسها',
    body: 'سجل المواد والمحاضرات موثّق في قاعدة بيانات محمية تلقائيًا.',
  },
];

/**
 * الجانب القصصي لصفحات الدخول — الدراك: أسود فحمي، ليموني متوهج، ذهبي ملكي.
 */
export function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#070906] px-8 py-8 text-[#f2f8e8] lg:flex xl:px-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 72% 48% at 18% 6%, rgba(163,230,53,0.09), transparent 62%), radial-gradient(ellipse 60% 44% at 88% 88%, rgba(200,162,75,0.13), transparent 62%), linear-gradient(155deg, rgba(255,255,255,0.045) 0%, transparent 34%)',
        }}
      />
      <div aria-hidden className="bg-grid-dark absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-noise" />
      <div aria-hidden className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brand-400/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-6 top-1/3 hidden font-display text-[10rem] font-bold leading-none text-brand-400/[0.05] xl:block">R</div>

      <div aria-hidden className="pointer-events-none absolute left-4 top-4 h-14 w-14 border-l-2 border-t-2 border-brand-300/20" />
      <div aria-hidden className="pointer-events-none absolute bottom-4 right-4 h-14 w-14 border-b-2 border-r-2 border-gold-600/30" />

      <div className="relative flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] text-ink-300 transition hover:border-brand-400/30 hover:bg-white/10 hover:text-brand-300"
        >
          <ArrowRight className="h-3 w-3 rotate-180 transition-transform group-hover:translate-x-0.5" />
          العودة للرئيسية
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/[0.08] px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-gold-300">
          كلية العلوم — جامعة السويس
        </span>
      </div>

      <div className="relative my-8 max-w-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/25 bg-brand-400/[0.08] px-3 py-1 text-[10px] font-medium text-brand-300">
          <Sparkles className="h-3 w-3" />
          منصة الحضور الذكية
        </span>
        <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.12] tracking-tight text-[#f6f9ef]">
          كل محاضرة تُحسب،
          <span className="block bg-gradient-to-l from-brand-300 via-brand-400 to-gold-400 bg-clip-text text-transparent">
            وكل دقيقة تعدّ.
          </span>
        </h1>
        <p className="mt-4 text-[13.5px] leading-[2] text-ink-500">
          رقيب يحوّل الحضور إلى تجربة فورية بالـ QR: الدكتور يفتح المحاضرة، الطالب
          يمسح الرمز، والتقرير يتحدّث لحظيًا — بأمان بمعايير مصرفية.
        </p>

        <ul className="mt-8 space-y-3">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="group flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-brand-400/30 hover:bg-white/[0.07]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-400/20 bg-brand-400/[0.1] text-brand-300">
                <feature.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold text-ink-800">
                  {feature.title}
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-5 text-ink-400">
                  {feature.body}
                </span>
              </span>
              <span
                aria-hidden
                className="font-latin text-[10px] tabular-nums text-brand-100/20 transition-colors group-hover:text-brand-300/60"
              >
                +
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative space-y-4">
        <figure className="max-w-xl rounded-2xl border border-brand-400/20 bg-white/[0.03] p-4">
          <blockquote className="font-display text-[15px] leading-8 text-gold-200/80">
            وَقُل رَّبِّ زِدْنِي عِلْمًا
          </blockquote>
          <figcaption className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink-400">
            سورة طه — الآية ١١٤
          </figcaption>
        </figure>
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 text-[10px] text-ink-400">
          <span className="flex items-center gap-1.5">
            <LockKeyhole className="h-3 w-3 text-gold-300/80" />
            تشفير كامل · JWT httpOnly
          </span>
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-brand-400/50" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-brand-400" />
            </span>
            كل الأنظمة تعمل
          </span>
        </div>
      </div>
    </aside>
  );
}
