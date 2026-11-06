import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { addAd, deleteAd, loadAds, setPrices, updateAd } from '@/lib/newsletter-ads';

export const dynamic = 'force-dynamic';

const fail = (err: unknown, status = 400) => NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível guardar.' }, { status });

/** Preços, anúncios e números da publicidade da newsletter (só administrador). */
export async function GET() {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const d = await loadAds();
  return NextResponse.json({
    prices: d.prices,
    ads: d.ads,
    stats: Object.fromEntries(Object.entries(d.stats).map(([id, s]) => [id, { sent: s.sent, clicks: s.clicks, people: s.clickers.length }])),
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  try {
    return NextResponse.json({ ad: await addAd(body) });
  } catch (err) {
    return fail(err);
  }
}

/** `{ id, active }` liga ou desliga um anúncio; `{ prices }` grava os custos de cada espaço. */
export async function PATCH(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  try {
    if (body.prices && typeof body.prices === 'object') await setPrices(body.prices);
    else if (typeof body.id === 'string') await updateAd(body.id, { active: body.active });
    else return fail(new Error('Pedido inválido.'));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== 'string') return fail(new Error('Anúncio inválido.'));
  try {
    await deleteAd(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err, 502);
  }
}
