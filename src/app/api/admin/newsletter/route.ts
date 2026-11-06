import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { getQueue, listSubscribers, loadState, mailConfigured, removeSubscriber } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';

/** Resumo da newsletter para o painel: subscritores, fila de notícias por enviar e estado do último envio. */
export async function GET() {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  try {
    const state = await loadState();
    const [subscribers, queue] = await Promise.all([listSubscribers(), getQueue(state)]);
    return NextResponse.json({
      subscribers,
      queue: queue.map((p) => ({ slug: p.slug, title: p.title, category: p.category, date: p.date, image: p.image ?? null, excerpt: p.excerpt ?? '' })),
      lastSentAt: state.lastSentAt ?? null,
      history: state.history,
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
