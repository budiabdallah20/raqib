let recovering = false;

/**
 * جلسة ميتة: التوكن توقيعه سليم لكن سجل الجلسة غير موجود في القاعدة
 * (انتهت/أُلغيت، أو تغيّرت قاعدة البيانات بين تشغيلين). الـ middleware
 * يرى توقيعًا سليمًا فيعيد /login إلى اللوحة، فيعلق المستخدم بين
 * صفحات تعمل وواجهات كلها 401. هنا نمسح الكوكي ونعيده للدخول.
 */
async function recoverDeadSession() {
  if (recovering || typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  if (pathname === '/login' || pathname === '/register') return;
  recovering = true;
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
  const next = encodeURIComponent(pathname + search);
  window.location.replace(`/login?next=${next}`);
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    if (res.status === 401) void recoverDeadSession();
    throw new Error(data.error || 'حدث خطأ غير متوقع');
  }
  return data;
}
