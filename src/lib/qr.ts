/**
 * أدوات QR الحضور — رمز يدوي من 6 أرقام مشتق من التوكن (بدون تخزين إضافي)
 * إذ كود الـQR يدوّر كل 20 ثانية، فاليدوي يدوّر معه — بإذن الله.
 */

/** كود 6 أرقام مشتق من آخر 8 خانات hex من التوكن */
export function manualCodeOf(token: string) {
  const n = parseInt(token.slice(-8), 16) % 1000000;
  return n.toString().padStart(6, '0');
}

/** هل النص عبارة عن كود يدوي (6 أرقام)؟ */
export function isManualCode(raw: string) {
  return /^\d{6}$/.test(raw.trim());
}

