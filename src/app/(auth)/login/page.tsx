import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard, type AuthIntent, type AuthTab } from '@/components/auth/AuthCard';

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  description:
    'سجّل دخولك إلى رقيب لمتابعة الحضور والمحاضرات والتقارير الأكاديمية بحسب صلاحيات حسابك.',
  robots: { index: true, follow: true },
};

const TABS: AuthTab[] = ['login', 'register', 'admin'];
const INTENTS: AuthIntent[] = ['student', 'professor', 'admin'];

export default async function LoginPage({
  searchParams,
}: {
  // Next 15: searchParams وعد (Promise) وليس كائنًا متزامنًا
  searchParams?: Promise<{ tab?: string; intent?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const requested = params?.tab as AuthTab | undefined;
  const initialTab = requested && TABS.includes(requested) ? requested : 'login';
  const requestedIntent = params?.intent as AuthIntent | undefined;
  const intent = requestedIntent && INTENTS.includes(requestedIntent) ? requestedIntent : undefined;

  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-ink-400">جارٍ التحميل...</div>}>
      <AuthCard initialTab={initialTab} intent={intent} />
    </Suspense>
  );
}
