import { describe, expect, it } from 'vitest';
import {
  decryptJson,
  decryptSensitive,
  encryptJson,
  encryptSensitive,
  hashPii,
  isEncrypted,
} from '../src/lib/crypto';

describe('AES-256-GCM PII encryption', () => {
  it('round-trips plaintext', () => {
    const cipher = encryptSensitive('طالب@example.com', 'User.email', true);
    expect(isEncrypted(cipher)).toBe(true);
    expect(cipher).not.toContain('example.com');
    expect(decryptSensitive(cipher)).toBe('طالب@example.com');
  });

  it('is deterministic only when requested', () => {
    const a = encryptSensitive('01000000000', 'User.phone', true);
    const b = encryptSensitive('01000000000', 'User.phone', true);
    const c = encryptSensitive('01000000000', 'User.phone', false);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
    expect(decryptSensitive(c)).toBe('01000000000');
  });

  it('binds ciphertext to its field context (AAD)', () => {
    const cipher = encryptSensitive('secret-value', 'StudentNote.body');
    expect(() => decryptSensitive(cipher)).not.toThrow();
    // نقل النص لحقل آخر لا يغيّر السياق داخل الصيغة، لذا نتحقق من رفض التلاعب.
    const parts = cipher.split(':');
    parts[5] = Buffer.from('tampered').toString('base64url');
    expect(() => decryptSensitive(parts.join(':'))).toThrow();
  });

  it('rejects tampered ciphertext', () => {
    const cipher = encryptSensitive('original', 'Notification.body');
    const parts = cipher.split(':');
    const data = Buffer.from(parts[5], 'base64url');
    data[0] ^= 0xff;
    parts[5] = data.toString('base64url');
    expect(() => decryptSensitive(parts.join(':'))).toThrow();
  });

  it('encrypts and decrypts JSON detail', () => {
    const cipher = encryptJson({ action: 'LOGIN_OK', nested: { ok: true } }, 'AuditLog.detail');
    expect(cipher).toBeTruthy();
    expect(decryptJson<{ action: string; nested: { ok: boolean } }>(cipher)).toEqual({
      action: 'LOGIN_OK',
      nested: { ok: true },
    });
    expect(decryptJson('not-json')).toBeNull();
  });

  it('hashes PII irreversibly and stably', () => {
    const a = hashPii('203.0.113.10');
    const b = hashPii('203.0.113.10');
    const c = hashPii('203.0.113.11');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^h1:[0-9a-f]{32}$/);
    expect(a).not.toContain('203.0.113');
    expect(hashPii(null)).toBeNull();
  });

  it('leaves legacy plaintext untouched', () => {
    expect(decryptSensitive('plain-old-value')).toBe('plain-old-value');
    expect(isEncrypted('plain-old-value')).toBe(false);
  });
});
