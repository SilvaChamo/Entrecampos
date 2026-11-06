import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { validUnsubscribeToken } from '@/lib/newsletter';
import { recordRead } from '@/lib/newsletter-reads';

export const dynamic = 'force-dynamic';

/**
 * Ligação de uma notícia dentro da newsletter: conta a leitura (uma pessoa conta uma vez por envio) e segue para a
 * notícia. O destino é sempre /noticias/<slug>, nunca um endereço vindo do pedido. Sem o código certo, segue sem contar.
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const slug = (p.get('n') || '').trim();
  const target = new URL(slug && /^[\w-]+$/.test(slug) ? `/noticias/${slug}` : '/', req.url);
  const sendId = p.get('s') || '';
  const email = (p.get('e') || '').trim().toLowerCase();
  if (sendId && slug && email && validUnsubscribeToken(email, p.get('t') || '')) {
    try {
      await recordRead(sendId, slug, createHash('sha256').update(email).digest('hex').slice(0, 16));
    } catch {
      /* o leitor segue para a notícia mesmo que o registo falhe */
    }
  }
  return NextResponse.redirect(target, 302);
}
