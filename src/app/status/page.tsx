import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { APP_NAME, FACULTY } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `حالة الخدمة — ${APP_NAME}`,
  description: 'حالة تشغيل المنصة — فحص اتصال قاعدة البيانات وطبقة النقل.',
};

/**
 * صفحة عامة: لا تعرض أعداد مستخدمين/محاضرات/سجلات تدقيق ولا تفاصيل
 * تشغيلية تساعد أي زائر على رسم خريطة النظام. فحوص عامة فقط.
 */
async function getHealth() {
  const checks: { name: string; ok: boolean; detail: string }[] = [];
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: 'قاعدة البيانات', ok: true, detail: 'متصل' });
  } catch {
    checks.push({ name: 'قاعدة البيانات', ok: false, detail: 'تعذر الاتصال' });
  }

  // لا نثق بـ x-forwarded-proto إلا خلف بروكسي موثوق معلن.
  if (process.env.TRUST_PROXY === '1') {
    const h = await headers();
    const proto = h.get('x-forwarded-proto') ?? '';
    const secure = proto === 'https';
    checks.push({
      name: 'طبقة النقل',
      ok: secure,
      detail: secure ? 'HTTPS عبر البروكسي' : 'تحقق من إعداد TLS',
    });
  } else {
    checks.push({
      name: 'طبقة النقل',
      ok: true,
      detail: 'TLS يُدار على مستوى الخادم/البروكسي',
    });
  }

  return checks;
}

export default async function StatusPage() {
  const checks = await getHealth();
  const allOk = checks.every((c) => c.ok);

  return (
    <main className="site-dark mx-auto min-h-screen max-w-2xl bg-[#060805] px-4 py-16" dir="rtl">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-brand-700 hover:underline">← رقيب</Link>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${allOk ? 'bg-brand-500/10 text-brand-700' : 'bg-amber-500/15 text-amber-800'}`}>
          {allOk ? 'كل الخدمات تعمل' : 'تحت المراجعة'}
        </span>
      </header>

      <h1 className="font-display text-3xl font-extrabold text-ink-950">حالة الخدمة</h1>
      <p className="mt-2 text-sm text-ink-500">{FACULTY} — فحوص عامة دون أي بيانات تشغيلية حساسة.</p>

      <ul className="mt-8 space-y-3">
        {checks.map((c) => (
          <li key={c.name} className="flex items-center justify-between rounded-2xl border border-white/75 bg-white/65 px-5 py-4 shadow-glass backdrop-blur-xl">
            <div>
              <p className="text-sm font-bold text-ink-900">{c.name}</p>
              <p className="mt-0.5 text-xs text-ink-400">{c.detail}</p>
            </div>
            <span className={`h-2.5 w-2.5 rounded-full ${c.ok ? 'bg-brand-500 shadow-[0_0_10px_2px_rgba(20,121,95,0.3)]' : 'bg-amber-500'}`} />
          </li>
        ))}
      </ul>

      <p className="mt-8 text-[11px] text-ink-400">
        🔹 الصفحة لا تعرض أعداد المستخدمين أو المحاضرات أو سجلات التدقيق.
      </p>
    </main>
  );
}
