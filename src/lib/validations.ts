import { z } from 'zod';

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'admin123',
  'admin1234',
  'student123',
  'professor123',
  'welcome123',
  'iloveyou',
  'letmein123',
]);

const passwordRule = z
  .string()
  .min(10, 'كلمة المرور يجب أن تكون 10 أحرف على الأقل')
  .max(72, 'كلمة المرور طويلة جدًا')
  .regex(/[A-Za-z]/, 'يجب أن تحتوي على حرف واحد على الأقل')
  .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل')
  .refine(
    (value) => !COMMON_PASSWORDS.has(value.toLowerCase()),
    'كلمة المرور شائعة جدًا — اختر كلمة أقوى',
  );

const phoneRule = z
  .string()
  .trim()
  .min(8, 'رقم الهاتف غير صحيح')
  .max(20, 'رقم الهاتف طويل جدًا')
  .regex(/^\+?[0-9][0-9\s\-()]{7,18}$/, 'أدخل رقم هاتف صحيح');

const emailRule = z
  .string()
  .trim()
  .email('البريد الإلكتروني غير صحيح')
  .max(120, 'البريد الإلكتروني طويل جدًا');

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'أدخل البريد أو رقم الهاتف أو الاسم الكامل')
    .max(120, 'البيانات طويلة جدًا'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    role: z.enum(['STUDENT', 'PROFESSOR'], {
      error: 'اختر نوع الحساب',
    }),
    name: z
      .string()
      .trim()
      .min(3, 'الاسم الكامل مطلوب (3 أحرف على الأقل)')
      .max(80, 'الاسم طويل جدًا'),
    email: emailRule.optional().or(z.literal('')),
    phone: phoneRule,
    password: passwordRule,
    confirmPassword: z.string().min(1, 'أكّد كلمة المرور'),
    gender: z.enum(['MALE', 'FEMALE', 'UNDISCLOSED'], {
      error: 'اختر النوع',
    }),
    birthDate: z.string().trim().optional().or(z.literal('')),
    studentCode: z.string().trim().max(20).optional().or(z.literal('')),
    avatarUrl: z
      .string()
      .trim()
      .max(400)
      .regex(/^\/uploads\/avatars\/[a-f0-9-]+\.(png|jpg|jpeg|webp)$/i, 'رابط الصورة غير صالح')
      .optional()
      .or(z.literal('')),
    faceEnrolled: z.boolean().optional(),
    fingerprintEnrolled: z.boolean().optional(),
    acceptTerms: z.literal(true, {
      error: 'يجب الموافقة على الشروط وسياسة الخصوصية',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'كلمتا المرور غير متطابقتين',
      });
    }
    if (data.role === 'STUDENT' && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'البريد الإلكتروني مطلوب للطلاب',
      });
    }
    if (data.birthDate) {
      const date = new Date(data.birthDate);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthDate'],
          message: 'تاريخ الميلاد غير صحيح',
        });
      } else if (date.getTime() > Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthDate'],
          message: 'تاريخ الميلاد لا يمكن أن يكون في المستقبل',
        });
      } else if (date.getFullYear() < 1900) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthDate'],
          message: 'تاريخ الميلاد غير منطقي',
        });
      }
    }
  });

export const adminLoginSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ''))
    .pipe(
      z
        .string()
        .length(16, 'كود الإدارة يجب أن يكون 16 رقمًا')
        .regex(/^\d{16}$/, 'كود الإدارة يتكون من أرقام فقط'),
    ),
});

export const forgotPasswordSchema = z.object({
  email: emailRule,
});

export const resetPasswordSchema = z
  .object({
    email: emailRule,
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'كود التحقق يتكون من 6 أرقام'),
    password: passwordRule,
    confirmPassword: z.string().min(1, 'أكّد كلمة المرور'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'كلمتا المرور غير متطابقتين',
  });

export const lectureSchema = z.object({
  courseId: z.string().min(1, 'اختر المقرر'),
  title: z.string().trim().min(3, 'عنوان المحاضرة مطلوب'),
  location: z.string().trim().max(80).optional().or(z.literal('')),
});

export const attendanceSchema = z.object({
  // توكِن QR (32 hex) أو الرمز اليدوي 6 أرقام الظاهر على لوحة الأستاذ
  token: z
    .string()
    .trim()
    .regex(/^(\d{6}|[a-f0-9]{16,})$/i, 'رمز الحضور غير صالح'),
});

export const lectureToggleSchema = z.object({
  action: z.literal('toggle'),
  id: z.string().min(1),
});

export const courseSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(3).max(120),
  professorId: z.string().min(1),
  department: z.string().trim().min(3).optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(3).max(80),
  email: z.string().trim().email(),
  password: passwordRule,
  role: z.enum(['STUDENT', 'PROFESSOR', 'ADMIN']),
  studentCode: z.string().trim().min(4).max(20).optional().or(z.literal('')),
  courseIds: z.array(z.string()).optional(),
});

export const enrollSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
});
