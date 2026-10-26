import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:5000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/student', '/professor', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
