import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

import { requireUser } from '@/lib/auth';

import { jsonError } from '@/lib/security';

/**
 * قائمة مفاتيح المرور للمستخدم الحالي — عرض فقط:
 * معرّف مقصوص + نوع الجهاز + حالة النسخ الاحتياطي. لا مفاتيح عامة ولا أسرار.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const passkeys = await prisma.passkeyCredential.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceType: true,
        backedUp: true,
        lastUsedAt: true,
        createdAt:
 true,
      },
    });
    return NextResponse.json({
      items: passkeys.map((pk) => ({ ...pk, id: pk.id.slice(0, 12) })),
    });
  } catch (error) {
    const status = (error as Error & { status?: number }).status || 500;
    return jsonError('تعذر جلب مفاتيح المرور', status);
  }
}
