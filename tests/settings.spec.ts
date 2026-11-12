/**
 * اختبارات الموجة 3 — أدمن:
 * دوران QR من الإعدادات (5/10/15/20) + توحيد القاعات + رسالة التعارض الصريحة
 * + فحوص مصدر تُقيِّد الربط الحي في الجريد (Zero-Mock).
 */
import { describe, it, expect } from 'vitest';
import { qrRotationMs, QR_ROTATE_MS, QR_ROTATE_PRESETS } from '@/lib/constants';
import { normalizeRoom, roomConflictMessage } from '@/lib/rooms';
import fs from 'node:fs';
import path from 'node:path';

const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('qrRotationMs — إعداد مدة الدوران من الأدمن', () => {
  it('يقبل الأنماط المسموحة 5/10/15/20 ثانية', () => {
    expect(QR_ROTATE_PRESETS).toEqual([5, 10, 15, 20]);
    expect(qrRotationMs('5')).toBe(5_000);
    expect(qrRotationMs('10')).toBe(10_000);
    expect(qrRotationMs('15')).toBe(15_000);
    expect(qrRotationMs('20')).toBe(20_000);
  });

  it('فراغ/غير رقمي/سالب = الافتراضي 10 ثوانٍ', () => {
    expect(qrRotationMs(null)).toBe(QR_ROTATE_MS);
    expect(qrRotationMs(undefined)).toBe(QR_ROTATE_MS);
    expect(qrRotationMs('')).toBe(QR_ROTATE_MS);
    expect(qrRotationMs('abc')).toBe(QR_ROTATE_MS);
    expect(qrRotationMs('-3')).toBe(QR_ROTATE_MS);
    expect(qrRotationMs('0')).toBe(QR_ROTATE_MS);
  });

  it('يحصر القيمة داخل النطاق 5..20 ثانية', () => {
    expect(qrRotationMs('3')).toBe(5_000);
    expect(qrRotationMs('99')).toBe(20_000);
  });
});

describe('normalizeRoom — توحيد مقارنة القاعات', () => {
  it('يقلّم الفراغات ويوحّد الأحرف', () => {
    expect(normalizeRoom(' kb-2 ')).toBe('KB-2');
    expect(normalizeRoom('KB-2')).toBe('KB-2');
  });
  it('فراغ = بلا قاعة', () => {
    expect(normalizeRoom(null)).toBe('');
    expect(normalizeRoom('   ')).toBe('');
    expect(normalizeRoom('')).toBe('');
  });
});

describe('roomConflictMessage — رسالة إنذار التعارض الصريحة', () => {
  const msg = roomConflictMessage({
    room: 'KB-2',
    day: 3,
    period: 2,
    group: 'A',
    courseCode: 'MAT201',
    courseName: 'تحليل حقيقي',
  });
  it('تذكر القاعة والمقرر والجروب والوقت', () => {
    expect(msg).toContain('KB-2');
    expect(msg).toContain('MAT201');
    expect(msg).toContain('تحليل حقيقي');
    expect(msg).toContain('للجروب A');
    expect(msg).toContain('الثلاثاء');
    expect(msg).toContain('10:30 – 12:30');
  });
});

/**
 * 🛡️ فحوص مصدر: الربط الحي — لا ثابت متجمد عبر ما يجب أن يُدار من الإعدادات
 */
describe('Source: الربط الحي للإعدادات (Zero-Mock)', () => {
  it('لوحة المحاضرة تستهلك qr_rotation_seconds من القاعدة — لا الثابت صريحًا', () => {
    const src = read('src/app/api/lectures/board/route.ts');
    expect(src).toContain("key: 'qr_rotation_seconds'");
    expect(src).toContain('qrRotationMs(');
    expect(src).not.toMatch(/QR_ROTATE_MS/);
  });

  it('باب الإعدادات يسمح بمفتاحي qr_rotation_seconds و emergency_banner', () => {
    const src = read('src/app/api/admin/settings/route.ts');
    expect(src).toContain('qr_rotation_seconds');
    expect(src).toContain('emergency_banner');
    expect(src).toContain('QR_ROTATE_PRESETS');
  });

  it('شريط البث الطارئ مركب في البوابات الثلاث', () => {
    expect(read('src/app/student/page.tsx')).toMatch(/<EmergencyBanner\s*\/>/);
    expect(read('src/app/professor/page.tsx')).toMatch(/<EmergencyBanner\s*\/>/);
    expect(read('src/app/admin/page.tsx')).toMatch(/<EmergencyBanner\s*\/>/);
  });

  it('كاشف تعارض القاعة يعمل في create/update/move/swap', () => {
    const src = read('src/app/api/schedule/route.ts');
    expect(src).toContain('function findRoomConflict');
    // المواضع: create + update + move = 3، والswap فحصان (حمولتاهما) = 5
    const calls = src.match(/await findRoomConflict\(/g) ?? [];
    expect(calls.length).toBe(5);
  });

  it('لوحة العرض تبث الشريط مع الاستجابة (banner)', () => {
    const src = read('src/app/api/lectures/board/route.ts');
    expect(src).toContain("key: 'emergency_banner'");
    expect(src).toMatch(/banner:\s*bannerRow/);
  });
});
