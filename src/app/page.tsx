import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing/LandingPage';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/constants';

export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] || '/login');
  return <LandingPage />;
}
