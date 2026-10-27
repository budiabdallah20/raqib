/**
 * واجهة العميل للمفاتيح المرور (Passkey/WebAuthn).
 * كل نداء إدراج/دخول يمر من مسارات /api/auth/passkey/* على السيرفر؛
 * هذا الملف فقط يشغّل نافذة اللمسة ويحوّل الردود.
 */
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

export type PasskeyVerifyResult = {
  ok: boolean;
  message?: string;
  user?: { id: string; name: string; role: string };
};

export function passkeySupported(): boolean {
  try {
    return typeof window !== 'undefined' && browserSupportsWebAuthn();
  } catch {
    return false;
  }
}

/** هل الطرف يحتوي مصدّقًا مدمجًا (بصمة/وجه/قفل شاشة)؟ */
export async function hasPlatformAuthenticator(): Promise<boolean> {
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error || 'تعذر إتمام اللمسة، حاول مجددًا';
    throw new Error(message);
  }
  return data as T;
}

/** تسجيل بصمة جديدة للحساب الحالي (يتطلب جلسة — الطالب بعد إنشاء الحساب مثلاً) */
export async function enrollPasskey(): Promise<PasskeyVerifyResult> {
  const { options } = await postJson<{ options: Record<string, unknown> }>(
    '/api/auth/passkey/register-options',
  );
  const attResp = await startRegistration({ optionsJSON: options as never });
  return postJson<PasskeyVerifyResult>('/api/auth/passkey/register-verify', { response: attResp });
}

/** دخول بالبصمة — يفرغ عند إرقام معين يحصر البصمات بحسابه */
export async function loginWithPasskey(identifier?: string): Promise<PasskeyVerifyResult> {
  const { options } = await postJson<{ options: Record<string, unknown> }>(
    '/api/auth/passkey/auth-options',
    identifier ? { identifier } : {},
  );
  const authResp = await startAuthentication({ optionsJSON: options as never });
  return postJson<PasskeyVerifyResult>('/api/auth/passkey/auth-verify', { response: authResp });
}
