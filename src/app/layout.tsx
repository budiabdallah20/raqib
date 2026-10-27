import type { Metadata, Viewport } from 'next';
import { Inter, Cairo, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { LoadingProvider } from '@/components/shared/LoadingProvider';
import { LanguageProvider } from '@/lib/i18n';
import './globals.css';

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

const title = 'رقيب | منصة الحضور الذكية — جامعة السويس';
const description =
  'رقيب منصة أكاديمية متكاملة لإدارة الحضور والمحاضرات بتقنية QR لكلية العلوم — جامعة السويس. حضور فوري، تقارير لحظية، وأمان بمعايير مصرفية لطلاب وأعضاء هيئة التدريس.';

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
  publisher: 'كلية العلوم — جامعة السويس',
  generator: 'Next.js',
  category: 'education',
  classification: 'Education',
  keywords: [
    'رقيب',
    'منصة رقيب',
    'الحضور الذكي',
    'حضور QR',
    'جامعة السويس',
    'كلية العلوم',
    'إدارة المحاضرات',
    'حضور الطلاب',
    'تسجيل الحضور',
    'RAQiB',
    'attendance system',
    'Suez University',
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
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/brand/logo-mark.svg', type: 'image/svg+xml' },
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
        alt: 'رقيب — منصة الحضور الذكية بجامعة السويس',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/brand/og-1200x630.png'],
    creator: '@raqib',
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
    'theme-color': '#f7faf7',
    'color-scheme': 'light',
    'msapplication-TileColor': '#f7faf7',
    'msapplication-config': 'none',
    'geo.region': 'EG-SUZ',
    'geo.placename': 'السويس، مصر',
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#f7faf7' },
    { media: '(prefers-color-scheme: light)', color: '#f7faf7' },
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${appUrl}/#organization`,
      name: 'كلية العلوم — جامعة السويس',
      alternateName: 'Faculty of Science, Suez University',
      url: 'https://science.suez.edu.eg',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'السويس',
        addressCountry: 'EG',
      },
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
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EGP',
      },
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${cairo.variable} ${grotesk.variable} ${coded.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-display antialiased bg-[#f7faf7] text-ink-950">
        <LanguageProvider>
          <LoadingProvider>{children}</LoadingProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
