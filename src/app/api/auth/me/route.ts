import { getCurrentUser } from '@/lib/auth';
import { jsonError } from '@/lib/security';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError('غير مصرح', 401);
  return Response.json({ user });
}
