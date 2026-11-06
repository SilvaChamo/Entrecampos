import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { getAllPosts } from '@/lib/news-data';
import { loadState } from '@/lib/newsletter';
import { loadReads } from '@/lib/newsletter-reads';

export const dynamic = 'force-dynamic';

/** Relatório das newsletters enviadas: quantas pessoas alcançaram e quantas leram as notícias que levaram. */
export async function GET() {
  const guard = await requireAuth('ver_estatisticas', 'acesso_total');
  if ('error' in guard) return guard.error;
  try {
    const [state, reads, all] = await Promise.all([loadState(), loadReads(), getAllPosts()]);
    const title = (slug: string) => all.posts.find((p) => p.slug === slug)?.title ?? slug;
    const sends = state.history.map((h) => {
      const r = reads[h.at];
      return {
        at: h.at,
        news: h.news,
        recipients: h.recipients,
        reached: h.sent,
        failed: h.failed,
        tracked: Boolean(h.tracked),
        readers: r?.readers.length ?? 0,
        reads: r?.clicks ?? 0,
        top: Object.entries(r?.bySlug ?? {})
          .map(([slug, v]) => ({ slug, title: title(slug), readers: v.readers.length, clicks: v.clicks }))
          .sort((a, b) => b.readers - a.readers || b.clicks - a.clicks)
          .slice(0, 5),
      };
    });
    return NextResponse.json({ sends });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível carregar o relatório.' }, { status: 502 });
  }
}
