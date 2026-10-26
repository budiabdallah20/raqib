import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { applyAuthCookie, hashPassword, issueSession } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import {
  getClientIp,
  assertRateLimit,
  jsonError,
  logAudit,
  normalizePhone,
  sanitizeString,
} from '@/lib/security';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return jsonError(issue?.message || 'بيانات غير صالحة', 400);
    }

    const data = parsed.data;
    const ip = getClientIp(request);
    assertRateLimit(`register:${ip || 'unknown'}`, 6, 30 * 60 * 1000);

    const email = data.email ? data.email.toLowerCase() : null;
    const phone = normalizePhone(data.phone);

    if (email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) return jsonError('هذا البريد الإلكتروني مسجل بالفعل', 409);
    }

    const phoneTaken = await prisma.user.findUnique({ where: { phone } });
    if (phoneTaken) return jsonError('رقم الهاتف مسجل بالفعل', 409);

    let studentCode: string | null = null;
    if (data.role === 'STUDENT' && data.studentCode) {
      studentCode = sanitizeString(data.studentCode, 20);
      const taken = await prisma.user.findUnique({ where: { studentCode } });
      if (taken) return jsonError('الرقم الجامعي مستخدم بالفعل', 409);
    }

    // ⚠️ حسابات الدكاترة لا تُفعّل تلقائيًا: تحتاج موافقة الأدمن.
    // بدون ذلك يستطيع أي شخص إنشاء حساب بدور PROFESSOR.
    const needsApproval = data.role === 'PROFESSOR';
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name: sanitizeString(data.name, 80),
        passwordHash: await hashPassword(data.password),
        role: data.role,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        // الصورة يجب أن تكون مرفوعة على سيرفرنا فقط (لا روابط خارجية)
        avatarUrl: data.avatarUrl?.startsWith('/uploads/avatars/')
          ? data.avatarUrl
          : null,
        studentCode,
        // البصمات لا يقررها العميل — تُسجل من نظام التحقق فقط
        faceEnrolled: false,
        fingerprintEnrolled: false,
        isActive: !needsApproval,
        approvedAt: needsApproval ? null : now,
        passwordChangedAt: now,
      },
    });

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: needsApproval ? 'REGISTER_PENDING' : 'REGISTER_OK',
      entity: 'User',
      detail: { role: user.role, email: user.email, studentCode: user.studentCode },
    });

    if (needsApproval) {
      return NextResponse.json(
        {
          pending: true,
          message:
            'تم إنشاء الحساب. حساب الدكتور يحتاج موافقة الإدارة قبل تسجيل الدخول.',
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            role: user.role,
            studentCode: user.studentCode,
            avatarUrl: user.avatarUrl,
          },
        },
        { status: 201 },
      );
    }

    const token = await issueSession(
      { id: user.id, role: user.role, email: user.email },
      request,
      true,
    );

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
          studentCode: user.studentCode,
          avatarUrl: user.avatarUrl,
        },
      },
      { status: 201 },
    );
    return applyAuthCookie(response, token, true);
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return jsonError('هذه البيانات مسجلة بالفعل، جرّب تسجيل الدخول', 409);
    }
    const status = (error as Error & { status?: number }).status || 500;
    return jsonError(
      (error as Error).message || 'تعذر إنشاء الحساب، حاول مرة أخرى',
      status,
    );
  }
}
