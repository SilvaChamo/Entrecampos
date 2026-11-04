import type { MetadataRoute } from 'next';
import { getAllPosts, getCategories } from '@/lib/news-data';

export const revalidate = 604800;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://entrecamposblog.com').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ posts }, categories] = await Promise.all([getAllPosts(), getCategories()]);
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/noticias`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/categorias`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/pagina/contactos`, changeFrequency: 'yearly', priority: 0.3 },
    ...categories.map((c) => ({ url: `${SITE_URL}/categoria/${c.slug}`, changeFrequency: 'daily' as const, priority: 0.7 })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/noticias/${p.slug}`,
      lastModified: new Date(p.edited || p.date),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
