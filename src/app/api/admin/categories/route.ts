import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { categoryAliases, getCategories, getCategoryOptions } from '@/lib/news-data';
import { getCategoryColors } from '@/lib/category-colors';

/** Categorias com o número real de notícias publicadas (as mesmas contas que o site público usa). */
export async function GET() {
  const guard = await requireAuth('ler_artigos');
  if ('error' in guard) return guard.error;

  const [categories, options, colors] = await Promise.all([getCategories(), getCategoryOptions(), getCategoryColors()]);
  // `aliases`: nome novo (em forma de endereço) → categoria de sempre, para o formulário de notícias.
  return NextResponse.json({ items: categories, options, colors, aliases: categoryAliases() });
}
