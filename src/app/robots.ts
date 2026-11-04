import type { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://entrecamposblog.com').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/login', '/register', '/recuperar-senha'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
