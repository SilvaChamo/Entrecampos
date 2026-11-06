import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runDueSchedules, runNewsletter } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Newsletter diária, às 20h de Maputo (18:00 UTC), chamada pelo agendador com
 *   Authorization: Bearer <CRON_SECRET>
 * Envia as notícias publicadas desde o último envio a todos os subscritores. Sem CRON_SECRET, a rota fica desligada.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const sent = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const ok = Boolean(secret) && sent.length === secret!.length && timingSafeEqual(Buffer.from(sent), Buffer.from(secret!));
  if (!ok) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    // Primeiro os envios agendados que já estejam na hora, depois a newsletter do dia (que já não leva o que foi enviado à mão).
    const agenda = await runDueSchedules().catch((e) => ({ error: e instanceof Error ? e.message : 'Falhou.' }));
    return NextResponse.json({ ...(await runNewsletter()), agenda });
  } catch (err: any) {
    console.error('[newsletter] cron falhou:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Falhou.' }, { status: 500 });
  }
}
