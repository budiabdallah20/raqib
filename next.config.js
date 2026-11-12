/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    // سنتان + preload — كما في SECURITY_INSTRUCTIONS
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    // الكاميرا والموقع مطلوبان لوظائف مسح QR والتحقق الجغرافي — للموقع نفسه فقط.
    key: 'Permissions-Policy',
    value:
      'camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // CSP يُبنى بـnonce في middleware.ts — لا نضع نسخة ثانية هنا.
];

// distDir: الفصل الصريح بين الإنتاج والتطوير — الخادم الإنتاجي (server.mjs)
// يقرأ .next من البناء، بينما يكتب Turbopack dev في .next-dev حتى لا يخربط
// أحدهما ملفات الآخر (سبب كلاسيكي لأخطاء ENOENT أثناء البناء).
// NEXT_DIST_DIR يظل متاحًا لعزل مسارات إضافية (CI/Vercel لا يحتاجونه).
const distDir = process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === 'development' ? '.next-dev' : '.next');

const nextConfig = {
  distDir,
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // إيقاف محسّن الصور عن قصد: لا حاجة له في المشروع، وهو أكبر سطح هجوم في Next.
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: '1mb' },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // صفحات لوحات التحكم لا تُفهرس في محركات البحث
        source: '/(admin|student|professor)/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/admin',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/student',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/professor',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },
};

module.exports = nextConfig;
