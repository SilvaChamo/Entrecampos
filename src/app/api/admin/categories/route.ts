import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { getCategories, getCategoryOptions } from '@/lib/news-data';

/** Categorias com o número real de notícias publicadas (as mesmas contas que o site público usa). */
export async function GET() {
  const guard = await requireAuth('ler_artigos');
  if ('error' in guard) return guard.error;

  const [categories, options] = await Promise.all([getCategories(), getCategoryOptions()]);
  return NextResponse.json({ items: categories, options });
}
