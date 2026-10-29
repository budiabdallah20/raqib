import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, PUBLIC_PATHS, ROLE_HOME } from '@/lib/constants';
import { verifyToken } from '@/lib/jwt';

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

/** حماية CSRF: نرفض أي طلب تعديل قادم من أصل مختلف */
function sameOrigin(request: NextRequest) {
  const host = trustedHost(request);
  if (!host) return false;
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
  // بعض العملاء (curl/سكربتات) لا يرسلون Origin — نسمح فقط لأن الطلب ليس من متصفح
  return true;
}

export async function middleware(request: NextRequest) {
  // ── توجيه الدومين القديم raqib-blue → raqibdev (نفس المسار، 301 دائم) ──
  const host = trustedHost(request);
  if (host === 'raqib-blue.vercel.app') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.hostname = 'raqibdev.vercel.app';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const isApi = pathname.startsWith('/api/');
  const isUpload = pathname.startsWith('/api/upload/');

  // ── فحص CSRF لكل عملية تعديل ──
  if (isApi && MUTATING.has(method)) {
    if (!sameOrigin(request)) {
      return NextResponse.json(
        { error: 'طلب غير موثوق — أصل الطلب مختلف' },
        { status: 403 },
      );
    }

    const length = Number(request.headers.get('content-length') || 0);
    const limit = isUpload ? MAX_UPLOAD_BYTES : MAX_JSON_BYTES;
    if (Number.isFinite(length) && length > limit) {
      return NextResponse.json(
        { error: 'حجم الطلب أكبر من المسموح' },
        { status: 413 },
      );
    }

    if (length > 0 && !isUpload) {
      const type = request.headers.get('content-type') || '';
      if (!type.toLowerCase().includes('application/json')) {
        return NextResponse.json(
          { error: 'نوع المحتوى غير مدعوم' },
          { status: 415 },
        );
      }
    }
    if (isUpload && length > 0) {
      const type = request.headers.get('content-type') || '';
      if (!type.toLowerCase().includes('multipart/form-data')) {
        return NextResponse.json(
          { error: 'الرفع يجب أن يكون multipart/form-data' },
          { status: 415 },
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
      return NextResponse.redirect(new URL(home, request.url));
    }
    return withApiHeaders(NextResponse.next(), pathname);
  }

  if (!payload) {
    if (isApi) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401, headers: { 'cache-control': 'no-store' } },
      );
    }
    const login = new URL('/login', request.url);
    // نمرر المسار فقط (بدون query) ونمنع أي إعادة توجيه خارجية
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith('/student') && payload.role !== 'STUDENT') {
    return NextResponse.redirect(new URL(ROLE_HOME[payload.role], request.url));
  }
  if (pathname.startsWith('/professor') && payload.role !== 'PROFESSOR') {
    return NextResponse.redirect(new URL(ROLE_HOME[payload.role], request.url));
  }
  if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL(ROLE_HOME[payload.role], request.url));
  }

  return withApiHeaders(NextResponse.next(), pathname);
}

function withApiHeaders(response: NextResponse, pathname: string) {
  response.headers.set('vary', 'Cookie');
  if (pathname.startsWith('/api/')) {
    response.headers.set('cache-control', 'no-store');
  }
  return response;
}

export const config = {
  // Skip Next internals, uploaded files, and any static asset with an extension.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.[a-zA-Z0-9]+$).*)'],
};
