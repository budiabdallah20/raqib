import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { applyAuthCookie, issueSession } from '@/lib/auth';
import { adminLoginSchema } from '@/lib/validations';
import {
  assertRateLimit,
  clearRateLimit,
  getClientIp,
  jsonError,
  logAudit,
} from '@/lib/security';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'كود الإدارة غير صالح');
    }

    const ip = getClientIp(request);
    const key = `admin:${ip || 'unknown'}`;
    assertRateLimit(
      key,
      5,
      15 * 60 * 1000,
      'محاولات دخول إدارة كثيرة. تم القفل مؤقتًا لمدة 15 دقيقة',
    );

    // `.env` values may arrive escaped (`\$2a\$12\$...`) depending on the loader,
    // so normalise quotes and escaped dollars before comparing.
    const hash = (process.env.ADMIN_ACCESS_CODE_HASH || '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\\\$/g, '$');
    if (!hash) {
      return jsonError('لم يتم إعداد كود الإدارة على السيرفر', 503);
    }

    const valid = await bcrypt.compare(parsed.data.code.replace(/\D/g, ''), hash);
    if (!valid) {
      await logAudit({
        user: null,
        request,
        action: 'ADMIN_LOGIN_FAILED',
        entity: 'User',
        detail: { ip },
      });
      return jsonError('كود الإدارة غير صحيح', 401);
    }

    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!admin) {
      return jsonError('لا يوجد حساب إدارة مُهيأ في قاعدة البيانات', 503);
    }

    clearRateLimit(key);
    const token = await issueSession(
      { id: admin.id, role: 'ADMIN', email: admin.email },
      request,
      true,
    );

    await logAudit({
      user: { id: admin.id, role: 'ADMIN' },
      request,
      action: 'ADMIN_LOGIN_OK',
      entity: 'User',
      detail: { method: 'vault-code' },
    });

    const response = NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
    return applyAuthCookie(response, token, true);
  } catch (error) {
    const status = (error as Error & { status?: number }).status || 500;
    return jsonError((error as Error).message || 'تعذر التحقق من الكود', status);
  }
}
