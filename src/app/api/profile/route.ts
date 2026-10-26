import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { applyAuthCookie, issueSession, revokeAllSessions, requireUser } from '@/lib/auth';
import {
  assertRateLimit,
  handleApiError,
  jsonError,
  logAudit,
  normalizePhone,
  sanitizeString,
} from '@/lib/security';

// ───────────────────────────────────────────────────────
// PATCH /api/profile — تعديل الاسم/الهاتف/الصورة/كلمة المرور
// يتطلب كلمة المرور الحالية دائمًا
// ───────────────────────────────────────────────────────
const patchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'الاسم قصير جدًا')
    .max(100, 'الاسم طويل جدًا')
    .optional(),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  avatarUrl: z.string().trim().max(300).optional().or(z.literal('')),
  currentPassword: z
    .string()
    .min(1, 'كلمة المرور الحالية مطلوبة')
    .max(200, 'كلمة المرور طويلة جدًا'),
  newPassword: z
    .string()
    .min(10, 'كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل')
    .max(72, 'كلمة المرور الجديدة طويلة جدًا')
    .regex(/[A-Za-z]/, 'كلمة المرور الجديدة يجب أن تحتوي على حرف')
    .regex(/[0-9]/, 'كلمة المرور الجديدة يجب أن تحتوي على رقم')
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    assertRateLimit(
      `profile:${user.id}`,
      8,
      15 * 60 * 1000,
      'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى',
    );

    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, phone: true, passwordHash: true },
    });
    if (!dbUser) return jsonError('الحساب غير موجود', 404);

    const passwordOk = await bcrypt.compare(
      parsed.data.currentPassword,
      dbUser.passwordHash,
    );
    if (!passwordOk) return jsonError('كلمة المرور الحالية غير صحيحة', 403);

    const data: {
      name?: string;
      phone?: string | null;
      avatarUrl?: string | null;
      passwordHash?: string;
      passwordChangedAt?: Date;
      failedLoginAttempts?: number;
      lockedUntil?: null;
    } = {};

    if (parsed.data.name !== undefined && parsed.data.name !== dbUser.name) {
      data.name = sanitizeString(parsed.data.name, 100);
    }

    if (parsed.data.phone !== undefined) {
      const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : '';
      if (phone) {
        if (!/^\+?\d{8,15}$/.test(phone)) {
          return jsonError('رقم الهاتف غير صالح');
        }
        if (phone !== dbUser.phone) {
          const taken = await prisma.user.findUnique({
            where: { phone },
            select: { id: true },
          });
          if (taken) return jsonError('رقم الهاتف مستخدم بالفعل لحساب آخر', 409);
          data.phone = phone;
        }
      } else if (dbUser.phone) {
        data.phone = null;
      }
    }

    if (parsed.data.avatarUrl !== undefined) {
      if (
        parsed.data.avatarUrl &&
        !parsed.data.avatarUrl.startsWith('/uploads/avatars/')
      ) {
        return jsonError('رابط الصورة غير صالح');
      }
      data.avatarUrl = parsed.data.avatarUrl || null;
    }

    let newToken: string | null = null;
    if (parsed.data.newPassword) {
      if (parsed.data.newPassword === parsed.data.currentPassword) {
        return jsonError('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
      }
      data.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
      data.passwordChangedAt = new Date();
      data.failedLoginAttempts = 0;
      data.lockedUntil = null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: true, unchanged: true });
    }

    await prisma.user.update({ where: { id: user.id }, data });

    // تغيير كلمة المرور يبطل كل الجلسات القديمة، ثم نصدر جلسة جديدة للجهاز الحالي
    if (data.passwordHash) {
      await revokeAllSessions(user.id);
      newToken = await issueSession(
        { id: user.id, role: user.role, email: user.email },
        request,
        true,
      );
    }

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: 'PROFILE_UPDATE',
      entity: 'User',
      detail: { fields: Object.keys(data).filter((f) => f !== 'passwordHash') },
    });

    const response = NextResponse.json({ ok: true });
    return newToken ? applyAuthCookie(response, newToken, true) : response;
  } catch (error) {
    return handleApiError(error, 'تعذر تحديث البيانات');
  }
}
