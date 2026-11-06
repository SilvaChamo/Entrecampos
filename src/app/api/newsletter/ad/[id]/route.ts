import { NextRequest, NextResponse } from 'next/server';
import { validUnsubscribeToken } from '@/lib/newsletter';
import { loadAds, recordClick } from '@/lib/newsletter-ads';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Clique num anúncio do e-mail: conta (uma pessoa conta uma vez) e segue para o anunciante. O destino vem sempre do
 * anúncio guardado, nunca do pedido. Sem o código certo para o e-mail, segue sem contar.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = (req.nextUrl.searchParams.get('e') || '').trim().toLowerCase();
  const token = req.nextUrl.searchParams.get('t') || '';
  let link: string | null;
  if (email && validUnsubscribeToken(email, token)) {
    link = await recordClick(id, createHash('sha256').update(email).digest('hex').slice(0, 16));
  } else {
    link = (await loadAds()).ads.find((a) => a.id === id)?.link ?? null;
  }
  return NextResponse.redirect(link || new URL('/', req.url), 302);
}
