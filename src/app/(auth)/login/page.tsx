import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard, type AuthTab } from '@/components/auth/AuthCard';

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  description:
    'سجّل دخولك إلى منصة رقيب لمتابعة الحضور والمحاضرات والتقارير الأكاديمية — كلية العلوم، جامعة السويس.',
  robots: { index: true, follow: true },
};

const TABS: AuthTab[] = ['login', 'register', 'admin'];

export default async function LoginPage({
  searchParams,
}: {
  // Next 15: searchParams وعد (Promise) وليس كائنًا متزامنًا
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const requested = params?.tab as AuthTab | undefined;
  const initialTab = requested && TABS.includes(requested) ? requested : 'login';

  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-ink-400">جارٍ التحميل...</div>}>
      <AuthCard initialTab={initialTab} />
    </Suspense>
  );
}
