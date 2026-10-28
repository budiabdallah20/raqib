import Link from 'next/link';

import { APP_NAME } from '@/lib/constants';

export const metadata = {
  title: `سجل التحديثات — ${APP_NAME}`,
  description: 'تطوّر منصة رقيب — أحدث الميزات أولًا.',
};

const RELEASES = [
  {
    version: 'v1.2',
    date: '2026-10-26',
    items: [
      '🪧 لوحة عرض المحاضرة الكاملة: QR عملاق + عدّاد تنازلي + حاضرون لحظيًا + آخر 5 مسحات.',
      '🔐 تدوير رمز QR كل 20 ثانية مع صلاحية قصيرة — يمنع المسح المتأخر وتكبير الرمز.',
      '⌨️ بديل يدوي: كود 6 أرقام لكل محاضرة مفتوحة — للطلاب بلا كاميرا.',
      '📊 تقارير: حضور الطالب لكل مادة (آمن/مخاطرة/محروم) + CSV و PDF للدكتور والأدمن.',
      '✅ سياسة حضور الرسمية: عتبة 75% · حرمان عند غياب 25% · التأخير = نصف حاضر.',
      '🔔 إشعارات داخلية (جرس) لكل فتح محاضرة وتاسك جديد وإنذار غياب.',
      '🎨 حزمة هوية كاملة تحت /brand: اللوجو بكل نسخه + favicon + OG بصورة PNG فعلية.',
      '🧹 بيانات ديمو واضحة: 180 طالبًا و12 مادة و22 ألف سجل حضور — مع زر إعادة الضبط للأدمن.',
      '🛡️ رؤوس أمان CSP + فحص /api/health + مسح حسابات الاختبار.',
    ],
  },
  {
    version: 'v1.1',
    date: '2026-10-25',
    items: [
      '📤 رفع ملفات المقررات + تسليمات التاسكات.',
      '🗓️ جدول أسبوعي لثلاثة جروبات مع VIP Halls وامتحانات.',
      '🧾 سجل تدقيق كامل لكل عملية حساسة (إدخال درجة / رفع / حذف).',
    ],
  },
  {
    version: 'v1.0',
    date: '2026-10-24',
    items: [
      '🚀 الإطلاق الأول: تسجيل ودخول بالـ JWT + أدوار (طالب/دكتور/أدمن).',
      '🎓 تسجيل حضور عبر QR + منع المسح المكرر.',
      '📚 إدارة المواد والدرجات (كويز/أعمال/ميدترم).',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="site-dark mx-auto min-h-screen max-w-2xl bg-[#060805] px-4 py-16" dir="rtl">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-brand-700 hover:underline">← رقيب</Link>
        <span className="rounded-full border border-gold-600/20 bg-gold-500/[0.08] px-3 py-1 text-[10px] text-gold-700">سجل الإصدارات</span>
      </header>

      <h1 className="font-display text-3xl font-extrabold text-ink-950">سجل التحديثات</h1>
      <p className="mt-2 text-sm text-ink-500">كل ما يضاف لمنصة رقيب أسبوعيًا — الشفافية أولاً.</p>

      <div className="mt-10 space-y-10">
        {RELEASES.map((rel) => (
          <section key={rel.version}>
            <div className="flex items-center gap-3">
              <span className="rounded-xl border border-gold-600/25 bg-gold-500/[0.08] px-2.5 py-1 font-latin text-xs font-extrabold text-gold-700" dir="ltr">
                {rel.version}
              </span>
              <span className="text-[11px] text-ink-400" dir="ltr">{rel.date}</span>
            </div>
            <ul className="mt-4 space-y-2.5 rounded-2xl border border-white/75 bg-white/65 p-5 shadow-glass backdrop-blur-xl">
              {rel.items.map((item) => (
                <li key={item} className="text-xs leading-6 text-ink-600">{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
