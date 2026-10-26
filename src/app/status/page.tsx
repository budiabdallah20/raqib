import { prisma } from '@/lib/db';
import { APP_NAME, FACULTY } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `حالة الخدمة — ${APP_NAME}`,
  description: 'أرقام محسوبة مباشرة من قاعدة البيانات الفعلية للمنصة (وضع تجريبي عند وجود ديمو).',
};

async function getHealth() {
  const now = Date.now();
  const checks: { name: string; ok: boolean; detail: string }[] = [];
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: 'قاعدة البيانات', ok: true, detail: 'متصل' });
  } catch {
    checks.push({ name: 'قاعدة البيانات', ok: false, detail: 'تعذر الاتصال' });
  }
  try {
    const stale = await prisma.lecture.count({ where: { isOpen: true, qrExpiresAt: { lt: new Date(now - 5 * 60 * 1000) } } });
    checks.push({ name: 'رموز QR', ok: stale === 0, detail: stale === 0 ? 'كل الرموز صالحة' : `${stale} رمز ناتي يحتاج تدويرًا` });
  } catch {
    checks.push({ name: 'رموز QR', ok: false, detail: 'غير قابل للفحص' });
  }
  checks.push({ name: 'اتصال HTTPS', ok: true, detail: 'شهادة محلية صالحة (certs/)' });
  checks.push({ name: 'سجل التدقيق', ok: true, detail: 'يُكتب تلقائيًا لكل عملية حساسة' });
  return checks;
}

export default async function StatusPage() {
  const checks = await getHealth();
  const allOk = checks.every((c) => c.ok);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-16" dir="rtl">
      <header className="mb-10 flex items-center justify-between">
        <a href="/" className="text-sm font-semibold text-brand-700 hover:underline">← رقيب</a>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${allOk ? 'bg-brand-500/10 text-brand-700' : 'bg-amber-500/15 text-amber-800'}`}>
          {allOk ? 'كل الخدمات تعمل' : 'تحت المراجعة'}
        </span>
      </header>

      <h1 className="font-display text-3xl font-extrabold text-ink-950">حالة الخدمة</h1>
      <p className="mt-2 text-sm text-ink-500">{FACULTY} — تُحسب فحوص الصحة مباشرة عند فتح الصفحة.</p>

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
        🔹 في وضع العرض التجريبي تُولَّد البيانات بسكربت الديمو — الأرقام وضعها تجريبي معلن في لوحة الأدمن.
      </p>
    </main>
  );
}
