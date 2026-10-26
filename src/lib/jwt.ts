import type { JwtPayload } from '@/types';
import { JWT_EXPIRES_IN } from './constants';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ISSUER = 'raqib';
const AUDIENCE = 'raqib-web';

const WEAK_SECRETS = new Set([
  'raqib-super-secret-key-change-me-min-32-chars-long',
  'change-me-to-a-random-string-min-32-chars',
  'changeme',
]);

function toBase64Url(bytes: Uint8Array) {
  let str = '';
  bytes.forEach((b) => {
    str += String.fromCharCode(b);
  });
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  if (process.env.NODE_ENV === 'production' && WEAK_SECRETS.has(secret)) {
    throw new Error('JWT_SECRET is still a placeholder — rotate it before production');
  }
  return secret;
}

async function getKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signToken(payload: JwtPayload) {
  const key = await getKey();
  const header = toBase64Url(
    encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
  );
  const now = Math.floor(Date.now() / 1000);
  const body = toBase64Url(
    encoder.encode(
      JSON.stringify({
        ...payload,
        iss: ISSUER,
        aud: AUDIENCE,
        iat: now,
        exp: now + JWT_EXPIRES_IN,
      }),
    ),
  );
  const data = encoder.encode(`${header}.${body}`);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
  return `${header}.${body}.${toBase64Url(signature)}`;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    // لا نقبل أي خوارزمية غير HS256 (يمنع alg=none وخدع تبديل الخوارزمية)
    const decodedHeader = JSON.parse(
      decoder.decode(fromBase64Url(header)),
    ) as { alg?: string; typ?: string };
    if (decodedHeader.alg !== 'HS256' || decodedHeader.typ !== 'JWT') return null;

    const key = await getKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signature),
      encoder.encode(`${header}.${body}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(decoder.decode(fromBase64Url(body))) as JwtPayload & {
      exp?: number;
      iat?: number;
      iss?: string;
      aud?: string;
    };

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.iss !== ISSUER || payload.aud !== AUDIENCE) return null;
    if (!payload.sub || !payload.role || !payload.sid) return null;
    if (payload.role !== 'STUDENT' && payload.role !== 'PROFESSOR' && payload.role !== 'ADMIN') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
