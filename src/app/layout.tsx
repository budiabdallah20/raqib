import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Inter, Cairo, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { LoadingProvider } from '@/components/shared/LoadingProvider';
import { LanguageProvider } from '@/lib/i18n';
import './globals.css';
import '@/styles/obsidian.css';
import '@/styles/academic-theater-tokens.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
});

const coded = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-coded',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:5000';

const title = 'رقيب | بوابة التجربة الأكاديمية';
const description =
  'رقيب منصة لتنظيم الحضور والمحاضرات والمقررات، مع مسارات واضحة للطالب وعضو هيئة التدريس والإدارة.';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: title,
    template: '%s | رقيب',
  },
  description,
  applicationName: 'رقيب',
  authors: [{ name: 'فريق رقيب', url: appUrl }],
  creator: 'فريق رقيب',
  publisher: 'فريق رقيب',
  generator: 'Next.js',
  category: 'education',
  classification: 'Education',
  keywords: [
    'رقيب',
    'منصة رقيب',
    'الحضور الذكي',
    'حضور QR',
    'إدارة المحاضرات',
    'حضور الطلاب',
    'تسجيل الحضور',
    'RAQiB',
    'attendance system',
  ],
  referrer: 'strict-origin-when-cross-origin',
  alternates: {
    canonical: '/',
    languages: {
      ar: '/',
    },
  },
  icons: {
    icon: [
      { url: '/brand/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/brand/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/brand/academic-gate-favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/brand/icon-32.png',
    apple: '/brand/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: '/',
    siteName: 'رقيب — RAQiB',
    title,
    description,
    images: [
      {
        url: '/brand/og-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'رقيب — بوابة التجربة الأكاديمية',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/brand/og-1200x630.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: 'رقيب',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    'theme-color': '#0B1120',
    'color-scheme': 'dark',
    'msapplication-TileColor': '#0B1120',
    'msapplication-config': 'none',
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#04060A' },
    { media: '(prefers-color-scheme: light)', color: '#04060A' },
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${appUrl}/#organization`,
      name: 'فريق رقيب',
      url: appUrl,
    },
    {
      '@type': 'WebApplication',
      '@id': `${appUrl}/#app`,
      name: 'رقيب',
      alternateName: 'RAQiB',
      url: appUrl,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript and a modern browser',
      inLanguage: 'ar',
      description,
      publisher: { '@id': `${appUrl}/#organization` },
      featureList: [
        'تسجيل الحضور بالـ QR',
        'لوحة تحكم للدكتور',
        'تقارير حضور لحظية',
        'إدارة المقررات والطلاب',
        'أمان وتشفير متقدم',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${appUrl}/#website`,
      url: appUrl,
      name: 'رقيب',
      inLanguage: 'ar',
      publisher: { '@id': `${appUrl}/#organization` },
    },
  ],
};

const SKIP_BOOT_SCRIPT = `try{if(sessionStorage.getItem('raqib-booted'))document.documentElement.dataset.bootSkip='1'}catch(e){}`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  // JSON-LD لا يُنفَّذ، لكن نُهرّب < > & حتى لا يُغلق الوسم مبكرًا.
  const jsonLdText = JSON.stringify(jsonLd)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      // data-boot-skip يُحقَن قبل التراكت من سكربت <head> — فروق الـ hydration مقصودة
      suppressHydrationWarning
      className={`${inter.variable} ${cairo.variable} ${grotesk.variable} ${coded.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          nonce={nonce}
          // الـ nonce يأتي من هيدرات السيرفر فقط — ريأكت يحذّر على فروقه وقت
          // الـ hydration رغم أنه سلوك مقصود وآمن، فنُسكته صريحًا.
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: jsonLdText }}
        />
        {/* فلاش-بَرُّوف: لو الجلسة شافت شاشة الإقلاع خلاص، إخفائها يحدث قبل أول رسم */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: SKIP_BOOT_SCRIPT }} />
      </head>
      <body className="font-display antialiased bg-[#111014] text-[#FFFFFF]">
        <LanguageProvider>
          <LoadingProvider>{children}</LoadingProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
