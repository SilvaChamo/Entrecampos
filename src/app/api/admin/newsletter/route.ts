import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { getAllPosts } from '@/lib/news-data';
import { getCategoryColors } from '@/lib/category-colors';
import { defaultCategoryColor } from '@/lib/category-palette';
import { getQueue, listSubscribers, loadSchedules, loadState, mailConfigured, removeSubscriber } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';

/** Resumo da newsletter para o painel: subscritores, fila de notícias por enviar e estado do último envio. */
export async function GET() {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  try {
    const state = await loadState();
    const [subscribers, queue, schedules, all, colors] = await Promise.all([listSubscribers(), getQueue(state), loadSchedules(), getAllPosts(), getCategoryColors()]);
    const card = (p: (typeof all.posts)[number]) => ({ slug: p.slug, title: p.title, category: p.category, categorySlug: p.categorySlug, color: colors[p.categorySlug] ?? defaultCategoryColor(p.categorySlug), date: p.date, image: p.image ?? null, excerpt: p.excerpt ?? '' });
    return NextResponse.json({
      subscribers,
      queue: queue.map((p) => ({ slug: p.slug, title: p.title, category: p.category, categorySlug: p.categorySlug, date: p.date, image: p.image ?? null, excerpt: p.excerpt ?? '' })),
      schedules: schedules
        .sort((a, b) => a.at.localeCompare(b.at))
        .map((x) => ({ ...x, posts: x.slugs.map((slug) => all.posts.find((p) => p.slug === slug)).filter((p): p is (typeof all.posts)[number] => Boolean(p)).map(card) })),
      lastSentAt: state.lastSentAt ?? null,
      history: state.history.map((h) => ({ ...h, posts: (h.slugs ?? []).map((slug) => all.posts.find((p) => p.slug === slug)).filter((p): p is (typeof all.posts)[number] => Boolean(p)).map(card) })),
      smtp: mailConfigured(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível carregar a newsletter.' }, { status: 502 });
  }
}

/** Retira um subscritor da lista. */
export async function DELETE(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== 'string' || !body.id) return NextResponse.json({ error: 'Subscritor inválido.' }, { status: 400 });
  try {
    await removeSubscriber({ id: body.id });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível remover.' }, { status: 502 });
  }
}
