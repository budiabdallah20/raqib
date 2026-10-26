'use client';

/**
 * /brand — المرجع الرسمي للهوية البصرية لرقيب
 * اللوجو بكل نسخه · المساحة الحرة · الحد الأدنى · الألوان · الخطوط · مكونات · أمثلة «لا»
 */
import * as React from 'react';
import { Logo, LogoMark } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = [
  { name: 'Emerald / الأساس', hex: '#14795F', note: 'هوية رقيب · الأزرار والروابط' },
  { name: 'Emerald عميق', hex: '#0B3D30', note: 'نهاية التدرج · حالات التركيز' },
  { name: 'Gold / اللمسة', hex: '#C8A24B', note: 'لمسة الذهب · الأوسمة والفواصل' },
  { name: 'Ink / النص', hex: '#0B1F19', note: 'النص الأساسي على الفاتح' },
  { name: 'Mint / الخلفية', hex: '#F4F8F5', note: 'خلفية الصفحات الهادئة' },
  { name: 'Ivory / الخلفية', hex: '#F9FBF9', note: 'أساس الأسطح الزجاجية' },
  { name: 'Muted / الثانوي', hex: '#5C7269', note: 'النص الثانوي والوصف' },
  { name: 'Ember / التحذير', hex: '#C2410C', note: 'الأخطاء وحالات الخطر' },
];

const DOS = [
  'استخدم المساحة الحرة (≥ 25% من عرض العلامة حول اللوجو).',
  'لا تنزل اللوجو عن 16px — حافظ على وضوح الحرف R واللمسة الذهبية.',
  'على الخلفيات الفاتحة استخدم tone="light" أو tone="ink".',
  'اللمسة الذهبية عنصر واحد: نقطة المدار + ساق الحرف — لا تزدها.',
];

const DONT = [
  'لا تشوّه اللوجو أو تدوّره.',
  'لا تغيّر ألوان اللوجو خارج الحزمة.',
  'لا تجلس اللوجو على صور مشبعة بلا طبقة تباين.',
  'لا تستخدم ظلًا قويًا يخفي الحواف الهندسية.',
];

const LOGO_TONES = [
  { name: 'Light — للأسطح الفاتحة', tone: 'light' as const, tile: 'bg-white/70' },
  { name: 'Ink — للطباعة', tone: 'ink' as const, tile: 'bg-[#f4f8f5]' },
  { name: 'Gold — للمناسبات', tone: 'gold' as const, tile: 'bg-[#0b3d30]' },
];

export default function BrandPage() {
  return (
    <div className="site-dark min-h-screen bg-[#060805] pb-16" dir="rtl">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <header className="mb-12">
          <Logo stacked showWordmark className="mx-auto w-fit" markClassName="h-16 w-16" tone="ink" />
          <h1 className="mt-6 text-center font-display text-2xl font-extrabold text-ink-950">
            دليل الهوية البصرية — رقيب RAQIB
          </h1>
          <p className="mt-2 text-center text-sm text-ink-500">
            نسخة v2 · 2026 · هوية الزمرد والذهب على أسطح عاجية زجاجية
          </p>
        </header>

        <section className="mb-12">
          <h2 className="mb-4 font-display text-lg font-extrabold text-gold-gradient">١. اللوجو — النسخ الثلاث</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {LOGO_TONES.map((variant) => (
              <div
                key={variant.name}
                className="rounded-2xl border border-white/75 bg-white/65 p-5 text-center shadow-glass backdrop-blur-xl"
              >
                <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-2xl ${variant.tile}`}>
                  <LogoMark tone={variant.tone} framed={false} className="h-16 w-16" />
                </div>
                <p className="mt-4 text-xs font-semibold text-ink-500">{variant.name}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/75 bg-white/65 p-5 shadow-glass backdrop-blur-xl">
            <p className="mb-4 text-xs text-ink-500">الحد الأدنى للحجم — 16px:</p>
            <div className="flex flex-wrap items-center gap-4">
              <Logo markClassName="h-4 w-4" showWordmark={false} tone="ink" />
              <Logo markClassName="h-4 w-4" tone="ink" />
              <Logo markClassName="h-8 w-8" tone="ink" />
              <Logo markClassName="h-12 w-12" tone="ink" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-5 rounded-2xl border border-white/75 bg-white/65 p-6 shadow-glass backdrop-blur-xl">
            <div className="relative">
              <div className="rounded-3xl border-2 border-dashed border-brand-500/25 p-5">
                <LogoMark className="h-16 w-16" tone="light" />
              </div>
              <span className="absolute -top-2 right-1/2 translate-x-1/2 whitespace-nowrap rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-semibold text-cream shadow-gold-soft">
                مساحة حرة ≥ 25%
              </span>
            </div>
            <p className="max-w-sm text-xs leading-6 text-ink-500">
              وسم <code className="rounded bg-brand-500/10 px-1.5 py-0.5 font-latin text-brand-700">Logo</code> قابل
              لإعادة الاستخدام في كل الواجهات، ويقبل الخصائص: tone · stacked · showWordmark · markClassName.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 font-display text-lg font-extrabold text-gold-gradient">٢. الألوان (Design Tokens)</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLORS.map((c) => (
              <div key={c.hex} className="overflow-hidden rounded-2xl border border-white/75 bg-white/65 shadow-glass">
                <div className="h-16" style={{ background: c.hex }} />
                <div className="p-3">
                  <p className="text-xs font-bold text-ink-900">{c.name}</p>
                  <p className="font-latin text-[10px] text-ink-400" dir="ltr">{c.hex}</p>
                  <p className="mt-1 text-[10px] leading-5 text-ink-400">{c.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/75 bg-white/65 p-5 shadow-glass backdrop-blur-xl">
            <h2 className="mb-3 font-display text-lg font-extrabold text-gold-gradient">٣. الخطوط</h2>
            <p className="font-display text-2xl text-ink-950">Cairo — عناوين وواجهات · 400→900</p>
            <p className="text-sm text-ink-500" dir="ltr">Inter — للاتيني والأرقام (tabular)</p>
            <p className="mt-3 text-xs text-ink-400">السلم: display 30/36 · t1 20/28 · t2 16/24 · body 14/22 · caption 12/18</p>
          </div>
          <div className="rounded-2xl border border-white/75 bg-white/65 p-5 shadow-glass backdrop-blur-xl">
            <h2 className="mb-3 font-display text-lg font-extrabold text-gold-gradient">٤. الحركة</h2>
            <ul className="space-y-1.5 text-xs text-ink-500">
              <li>• مدد: fast 150ms · base 250ms · slow 500ms</li>
              <li>• منحنى المنزل: cubic-bezier(0.22, 1, 0.36, 1)</li>
              <li>• prefers-reduced-motion: الحركات تصير opacity فقط</li>
              <li>• السبلاش: 1.9s · الانتقالات: 280–700ms</li>
            </ul>
          </div>
        </section>

        <section className="mb-12 rounded-2xl border border-white/75 bg-white/65 p-5 shadow-glass backdrop-blur-xl">
          <h2 className="mb-4 font-display text-lg font-extrabold text-gold-gradient">٥. المكونات</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>زر أساسي</Button>
            <Button variant="outline">ثانوي</Button>
            <Button variant="danger">خطر</Button>
            <Card className="w-64">
              <CardHeader><CardTitle className="text-sm">كارت زجاجي</CardTitle></CardHeader>
              <CardContent className="text-xs text-ink-500">حدود بيضاء · زوايا 16 · ضبابية 24 · ظل ناعم</CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-brand-500/20 bg-brand-500/[0.05] p-5">
            <h2 className="mb-3 font-display text-base font-extrabold text-brand-700">افعل ✓</h2>
            <ul className="space-y-1.5 text-xs leading-6 text-ink-600">{DOS.map((d) => <li key={d}>• {d}</li>)}</ul>
          </div>
          <div className="rounded-2xl border border-ember-500/20 bg-ember-500/[0.05] p-5">
            <h2 className="mb-3 font-display text-base font-extrabold text-ember-600">ممنوع ✗</h2>
            <ul className="space-y-1.5 text-xs leading-6 text-ink-600">{DONT.map((d) => <li key={d}>• {d}</li>)}</ul>
          </div>
        </section>

        <footer className="mt-12 border-t border-brand-900/10 pt-6 text-center text-xs text-ink-400">
          رقيب · كلية العلوم — جامعة السويس · الهوية المرئية الرسمية
        </footer>
      </div>
    </div>
  );
}
