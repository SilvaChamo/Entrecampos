import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { getSuggestionSlugs } from '@/lib/suggestions';

export const dynamic = 'force-dynamic';

/** Notícias activadas nas sugestões de leitura (o formulário de notícia usa-o para marcar a caixa). */
export async function GET() {
  const guard = await requireAuth('ler_artigos');
  if ('error' in guard) return guard.error;
  return NextResponse.json({ slugs: [...(await getSuggestionSlugs())] });
}
