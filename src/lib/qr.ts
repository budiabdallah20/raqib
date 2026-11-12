/**
 * أدوات QR الحضور — رمز يدوي من 6 أرقام مشتق من التوكن (بدون تخزين إضافي)
 * إذ رمز الـQR ديناميكي وJWT موقّع يدوّر كل 10 ثوانٍ، فالكود اليدوي يتغير معه —
 * والمشتق HMAC يعمل مع أي صيغة توكن (JWT الجديد أو hex القديم في التقلي).
 */
import { createHmac } from 'node:crypto';
import { getJwtSecret } from './jwt';

/** كود 6 أرقام من HMAC-SHA256 على التوكن كاملًا — بلا أي سر احتياطي */
export function manualCodeOf(token: string) {
  const digest = createHmac('sha256', getJwtSecret()).update(token).digest('hex');
  const n = parseInt(digest.slice(-8), 16) % 1000000;
  return n.toString().padStart(6, '0');
}

/** هل النص عبارة عن كود يدوي (6 أرقام)؟ */
export function isManualCode(raw: string) {
  return /^\d{6}$/.test(raw.trim());
}

