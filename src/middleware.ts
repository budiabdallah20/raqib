import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, PUBLIC_PATHS, ROLE_HOME } from '@/lib/constants';
import { verifyToken } from '@/lib/jwt';
import { buildCsp } from '@/lib/csp';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_JSON_BYTES = 1024 * 1024; // 1MB
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

function trustedHost(request: NextRequest) {
  const trusted = process.env.TRUST_PROXY === '1';
  if (trusted) {
    return (
      request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
      request.headers.get('host') ||
      ''
    );
  }
  return request.headers.get('host') || '';
}

/** حماية CSRF: نرفض أي طلب تعديل بلا أصل موثوق مطابق. */
function sameOrigin(request: NextRequest) {
  const host = trustedHost(request);
  if (!host) return false;

  // المتصفحات الحديثة ترسل Sec-Fetch-Site — أسرع وأصعب تزويرًا.
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  try {
    if (origin && origin !== 'null') {
      return new URL(origin).host === host;
    }
    if (referer) {
      return new URL(referer).host === host;
    }
  } catch {
    return false;
  }

  // لا Origin ولا Referer: لا نقبل طلبات تعديل من متصفح/سكربت مجهول.
  // هذا يمنع CSRF الصامت ويجبر أي عميل شرعي على إرسال Origin.
  return fetchSite === 'same-origin' || fetchSite === 'same-site';
}

function applySecurity(response: NextResponse, nonce: string) {
  response.headers.set('Content-Security-Policy', buildCsp(nonce, process.env.NODE_ENV !== 'production'));
  response.headers.set('vary', 'Cookie');
  return response;
}

export async function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '');

  // ── توجيه الدومين القديم raqib-blue → raqibdev (نفس المسار، 301 دائم) ──
  const host = trustedHost(request);
  if (host === 'raqib-blue.vercel.app') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.hostname = 'raqibdev.vercel.app';
    url.port = '';
    return applySecurity(NextResponse.redirect(url, 301), nonce);
  }

  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const isApi = pathname.startsWith('/api/');
  const isUpload =
    pathname.startsWith('/api/upload/') || pathname === '/api/drive/upload';

  // ── فحص CSRF لكل عملية تعديل ──
  if (isApi && MUTATING.has(method)) {
    if (!sameOrigin(request)) {
      return applySecurity(
        NextResponse.json(
          { error: 'طلب غير موثوق — أصل الطلب مختلف' },
          { status: 403 },
        ),
        nonce,
      );
    }

    const length = Number(request.headers.get('content-length') || 0);
    const limit = isUpload ? MAX_UPLOAD_BYTES : MAX_JSON_BYTES;
    if (Number.isFinite(length) && length > limit) {
      return applySecurity(
        NextResponse.json(
          { error: 'حجم الطلب أكبر من المسموح' },
          { status: 413 },
        ),
        nonce,
      );
    }

    if (length > 0 && !isUpload) {
      const type = request.headers.get('content-type') || '';
      if (!type.toLowerCase().includes('application/json')) {
        return applySecurity(
          NextResponse.json(
            { error: 'نوع المحتوى غير مدعوم' },
            { status: 415 },
          ),
          nonce,
        );
      }
    }
    if (isUpload && length > 0) {
      const type = request.headers.get('content-type') || '';
      if (!type.toLowerCase().includes('multipart/form-data')) {
        return applySecurity(
          NextResponse.json(
            { error: 'الرفع يجب أن يكون multipart/form-data' },
            { status: 415 },
          ),
          nonce,
        );
      }
    }
  }

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (isPublic) {
    if (payload && (pathname === '/login' || pathname === '/register')) {
      const home = ROLE_HOME[payload.role] || '/';
      return applySecurity(NextResponse.redirect(new URL(home, request.url)), nonce);
    }
    return finish(request, pathname, nonce);
  }

  if (!payload) {
    if (isApi) {
      return applySecurity(
        NextResponse.json(
          { error: 'غير مصرح' },
          { status: 401, headers: { 'cache-control': 'no-store' } },
        ),
        nonce,
      );
    }
    const login = new URL('/login', request.url);
    // نمرر المسار فقط (بدون query) ونمنع أي إعادة توجيه خارجية
    login.searchParams.set('next', pathname);
    return applySecurity(NextResponse.redirect(login), nonce);
  }

  if (pathname.startsWith('/student') && payload.role !== 'STUDENT') {
    return applySecurity(
      NextResponse.redirect(new URL(ROLE_HOME[payload.role], request.url)),
      nonce,
    );
  }
  if (pathname.startsWith('/professor') && payload.role !== 'PROFESSOR') {
    return applySecurity(
      NextResponse.redirect(new URL(ROLE_HOME[payload.role], request.url)),
      nonce,
    );
  }
  if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
    if (isApi) {
      return applySecurity(
        NextResponse.json(
          { error: 'ليست لديك صلاحية الوصول لهذه الصفحة' },
          { status: 403, headers: { 'cache-control': 'no-store' } },
        ),
        nonce,
      );
    }
    return applySecurity(
      NextResponse.redirect(new URL(ROLE_HOME[payload.role], request.url)),
      nonce,
    );
  }

  // ملاحظة أمنية: Middleware يتحقق من توقيع JWT وصلاحية الدور فقط (Edge لا يملك
  // وصولًا لقاعدة البيانات). الإبطال الفعلي (revokedAt/expiresAt/tokenHash/isActive)
  // يُفرض في كل API عبر requireUser → getSessionUser في src/lib/session.ts — هذا هو المرجع الحاكم.

  return finish(request, pathname, nonce);
}

function finish(request: NextRequest, pathname: string, nonce: string) {
  const csp = buildCsp(nonce, process.env.NODE_ENV !== 'production');
  // نمرّر nonce إلى Server Components عبر هيدر الطلب مع الحفاظ على الكوكيز/الهيدرات.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Next.js يقرأ nonce من CSP في هيدر الطلب ليضيفه لسكربتات hydration الخاصة به.
  requestHeaders.set('content-security-policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (pathname.startsWith('/api/')) {
    response.headers.set('cache-control', 'no-store');
  }
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('vary', 'Cookie');
  return response;
}

export const config = {
  // Skip Next internals, uploaded files, and any static asset with an extension.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.[a-zA-Z0-9]+$).*)'],
};
