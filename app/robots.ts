import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/enseignant/',
          '/parent/',
          '/super_admin/',
        ],
      },
    ],
    sitemap: 'https://www.scogestia.com/sitemap.xml',
  };
}
