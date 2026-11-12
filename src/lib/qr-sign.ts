import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * رمز QR الحضور الديناميكي — JWT موقّع HS256 يدوّر كل 10 ثوانٍ:
 *   { lec: title?, crs: courseId, iat, exp, geo }
 * التوكن يتحقق موضعيًا بالتوقيع (بلا استعلام قاعدة بين الطلاب):
 *   أي مزوّر يحاول بقايا رمز قديم أو توكن معدّل → رفض فوري.
 * Geofence إما على الكارت (Lecture.geofence JSON: {lat,lng,radiusM})
 *   وعندها الGPS إلزامي ضمن نصف القطر بحد أقصىAccuracy buffer 60م.
 */

export type QrGeofence = { lat: number; lng: number; radiusM: number };

export type QrPayload = {
  /** lectureId */
  lec: string;
  /** courseId */
  crs: string;
  iat: number;
  exp: number;
  /** حدود النطاق المرفق تحت الرمز وُقت التدوير (قد تكون null) */
  geo: QrGeofence | null;
};

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET is missing');
  }
  return secret;
}

/* ── base64url ─────────────────────────────────────────── */

function encode(uint8: Uint8Array) {
  return Buffer.from(uint8).toString('base64url');
}

/* ── التوقيع ───────────────────────────────────────────── */

export function signQrToken(
  input: { lec: string; crs: string; geofence?: QrGeofence | null },
  ttlSec = 15,
): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload: QrPayload = {
    lec: input.lec,
    crs: input.crs,
    iat,
    exp: iat + ttlSec,
    geo: input.geofence ?? null,
  };

  const header = encode(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: 'raqib-qr-1' })));
  const body = encode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = createHmac('sha256', jwtSecret())
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/* ── التحقق ────────────────────────────────────────────── */

/** يفحص التوقيع والصلاحية. invalid/expired → null (لا استثناءات) */
export function verifyQrToken(token: string, opts?: { maxSkewSec?: number }): QrPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expected = createHmac('sha256', jwtSecret())
      .update(`${header}.${body}`)
      .digest();

    let actual: Buffer;
    try {
      actual = Buffer.from(signature, 'base64url');
    } catch {
      return null;
    }
    if (actual.length !== expected.length) return null;
    if (!timingSafeEqual(actual, expected)) return null;

    const headerOk = (() => {
      try {
        const hdr = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as { alg?: string };
        return hdr.alg === 'HS256';
      } catch {
        return false;
      }
    })();
    if (!headerOk) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as QrPayload;
    if (!payload || typeof payload.lec !== 'string' || typeof payload.crs !== 'string') return null;

    const skew = opts?.maxSkewSec ?? 3; // هامش مضبوط لفارق الساعة بين الأجهزة
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || now > payload.exp + skew) return null;

    return payload;
  } catch {
    return null;
  }
}

/* ── Geofence ──────────────────────────────────────────── */

/** تُزار Lecture.geofence (JSON-string أو أصلاً object) إلى QrGeofence أو null */
export function parseGeofence(raw: string | null | undefined, fallbackRadiusM = 150): QrGeofence | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<QrGeofence>;
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
    const radiusM = Number.isFinite(Number(data.radiusM)) && Number(data.radiusM) > 0
      ? Math.min(Number(data.radiusM), 2000)
      : fallbackRadiusM;
    return { lat, lng, radiusM };
  } catch {
    return null;
  }
}

/** Haversine بالأمتار بين نقطتين */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * قرار Geofence: داخل النطاق؟
 * - الحاوية بلا geofence → { required: false, allowed: true }
 * - فيه geofence وبدون إحداثيات → مطلوب لكن الشخص لم أرسل → allowed: false
 * - هامش/دقة الجهاز: نسمح بزيادة 60 مترًا فوق نصف القطر (دقة GPS المباني)
 */
export function checkGeofence(
  geofence: QrGeofence | null,
  point: { lat: number; lng: number; accuracyM?: number } | null,
): { required: boolean; allowed: boolean; distanceM?: number } {
  if (!geofence) return { required: false, allowed: true };
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    return { required: true, allowed: false };
  }
  const distance = distanceMeters(geofence, point);
  const slack = Math.min(Math.max(point.accuracyM ?? 0, 0), 120) + 60;
  return { required: true, allowed: distance <= geofence.radiusM + slack, distanceM: Math.round(distance) };
}
