import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { refreshSite } from '@/lib/refresh-site';

export const dynamic = 'force-dynamic';

/**
 * Limpeza semanal do cache (todos os sábados), chamada pelo agendador do servidor (cron) com
 *   Authorization: Bearer <CRON_SECRET>
 * Sem CRON_SECRET definido, a rota fica desligada.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const sent = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const ok = Boolean(secret) && sent.length === secret!.length && timingSafeEqual(Buffer.from(sent), Buffer.from(secret!));
  if (!ok) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  refreshSite();
  return NextResponse.json({ ok: true, limpo_em: new Date().toISOString() });
}
