import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runDueSchedules } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Envia os agendamentos da newsletter cuja hora já chegou. Deve ser chamado de poucos em poucos minutos com
 *   Authorization: Bearer <CRON_SECRET>
 * Sem CRON_SECRET, a rota fica desligada.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const sent = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const ok = Boolean(secret) && sent.length === secret!.length && timingSafeEqual(Buffer.from(sent), Buffer.from(secret!));
  if (!ok) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    return NextResponse.json(await runDueSchedules());
  } catch (err: any) {
    console.error('[newsletter] agenda falhou:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Falhou.' }, { status: 500 });
  }
}
