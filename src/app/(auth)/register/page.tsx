import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';

export const metadata: Metadata = {
  title: 'إنشاء حساب',
  description:
    'أنشئ حسابك على منصة رقيب كطالب أو دكتور، وابدأ متابعة الحضور والمحاضرات بتجربة ذكية وآمنة.',
};

export default function RegisterPage() {
  return <AuthCard initialTab="register" />;
}
