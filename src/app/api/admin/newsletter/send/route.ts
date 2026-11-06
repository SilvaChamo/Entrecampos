import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { runNewsletter } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Envio manual da newsletter (o mesmo que o envio automático das 20h). Com `dry: true` só conta, sem enviar. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  try {
    return NextResponse.json(await runNewsletter({ dry: body.dry === true }));
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível enviar.' }, { status: 502 });
  }
}
