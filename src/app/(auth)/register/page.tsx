import type { Metadata } from 'next';
import { AuthCard, type AuthIntent } from '@/components/auth/AuthCard';

export const metadata: Metadata = {
  title: 'إنشاء حساب',
  description:
    'أنشئ حسابك على منصة رقيب كطالب أو دكتور، وابدأ متابعة الحضور والمحاضرات بتجربة ذكية وآمنة.',
};

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ intent?: string }> }) {
  const requested = (await searchParams)?.intent;
  const intent: AuthIntent | undefined = requested === 'student' || requested === 'professor' ? requested : undefined;
  return <AuthCard initialTab="register" intent={intent} />;
}
