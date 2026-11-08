import { NextRequest, NextResponse } from 'next/server';
import { isUuid, requireAuth } from '@/lib/api-guard';
import { configured, loadSettings, loadShares, shareNews, NETWORKS, type Network } from '@/lib/social';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Para o formulário: que redes estão disponíveis (ligadas e com chaves) e quais já receberam esta notícia. */
export async function GET(req: NextRequest) {
  const guard = await requireAuth('publicar_artigos');
  if ('error' in guard) return guard.error;
  const id = req.nextUrl.searchParams.get('id') || '';
  const [settings, shared] = await Promise.all([loadSettings(), isUuid(id) ? loadShares(id) : Promise.resolve({})]);
  const ok = await configured();
  return NextResponse.json({
    networks: NETWORKS.map((n) => ({ network: n, enabled: settings[n], configured: ok[n], shared: Boolean((shared as Record<string, unknown>)[n]) })),
  });
}

/** Partilha uma notícia já gravada. Chamada depois de publicar: uma falha aqui nunca desfaz a publicação no site. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('publicar_artigos');
  if ('error' in guard) return guard.error;
  try {
    const { id, networks, force } = (await req.json()) as { id?: string; networks?: unknown; force?: boolean };
    if (!id || !isUuid(id)) return NextResponse.json({ error: 'Notícia inválida.' }, { status: 400 });
    const wanted = (Array.isArray(networks) ? networks : []).filter((n): n is Network => NETWORKS.includes(n as Network));
    if (wanted.length === 0) return NextResponse.json({ results: [] });
    return NextResponse.json({ results: await shareNews(id, wanted, { force: force === true }) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao partilhar.' }, { status: 500 });
  }
}
