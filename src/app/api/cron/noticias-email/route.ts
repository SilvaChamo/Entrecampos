import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { processMailbox, publishDue } from '@/lib/noticias-email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Todos os dias: lê o e-mail da redacção (Word com notícias) e publica as agendadas cuja hora chegou. `Authorization: Bearer <CRON_SECRET>`. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const sent = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const ok = Boolean(secret) && sent.length === secret!.length && timingSafeEqual(Buffer.from(sent), Buffer.from(secret!));
  if (!ok) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  try {
    const mail = await processMailbox(3).catch((e) => ({ error: e instanceof Error ? e.message : 'Erro' }));
    return NextResponse.json({ mail, agendadas: await publishDue() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 502 });
  }
}
