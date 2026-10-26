/**
 * اختبارات مستشار الـQR — يدوي/تدوير — WP8
 */
import { describe, it, expect } from 'vitest';
import { manualCodeOf, isManualCode } from '@/lib/qr';

describe('manualCodeOf', () => {
  it('6 أرقام ثابتة للتوكن', () => {
    expect(manualCodeOf('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toMatch(/^\d{6}$/);
  });
  it('نفس التوكن = نفس الكود', () => {
    const t = '0123456789abcdef0123456789abcdef';
    expect(manualCodeOf(t)).toBe(manualCodeOf(t));
  });
  it('توكن مختلف → كود مختلف (احتمال عالٍ)', () => {
    // توكنات hex حقيقية الطول 32
    const codes = new Set(
      Array.from({ length: 50 }, (_, i) => manualCodeOf(i.toString(16).padStart(2, '0').repeat(20).slice(0, 32))),
    );
    expect(codes.size).toBeGreaterThan(40);
  });
});

describe('isManualCode', () => {
  it('يتقبل 6 أرقام فقط', () => {
    expect(isManualCode('123456')).toBe(true);
    expect(isManualCode('12345')).toBe(false);
    expect(isManualCode('1234567')).toBe(false);
    expect(isManualCode('a1b2c3')).toBe(false);
    expect(isManualCode('abcdef')).toBe(false);
  });
});

/**
 * 🛡️ اختبار حرج: مسارات الطالب لا تُسرِّب qrToken/qrExpiresAt
 * نفحص كود مصدر API مباشرة — الحماية تعتمد على select صريح.
 */
import fs from 'node:fs';
import path from 'node:path';

describe('Security: no qrToken leak to students', () => {
  it('GET الطلاب في /api/lectures يستخدم select صريح بلا qrToken', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/lectures/route.ts'),
      'utf8',
    );
    // عنصر الطالب يجب أن يستعمل select مع تعليق الحماية
    expect(src).toMatch(/STUDENT[\s\S]{0,400}select:/s);
    expect(src).not.toMatch(/qrToken: true/);
  });

  it('GET الطالب في /api/attendance لا يعيد qrToken/qrExpiresAt', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/attendance/route.ts'),
      'utf8',
    );
    // نقطع دالة GET كاملة فقط (قبل POST) ونفحص كتلة الطالب داخلها
    const getFn = src.slice(src.indexOf('export async function GET'), src.indexOf('export async function POST'));
    const studentBlock = getFn.slice(getFn.indexOf("role === 'STUDENT'"), getFn.indexOf("role === 'ADMIN'"));
    expect(studentBlock).toContain('select');
    expect(studentBlock).not.toContain('qrToken');
    expect(studentBlock).not.toContain('qrExpiresAt');
  });
});
