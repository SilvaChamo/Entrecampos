import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { runNewsletter, sendSelected } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Envio manual da newsletter (o mesmo que o envio automático das 20h). Com `slugs`, envia só essas notícias. Com `dry: true` só conta, sem enviar. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  try {
    if (Array.isArray(body.slugs) && body.slugs.length > 0) return NextResponse.json(await sendSelected(body.slugs.map(String).slice(0, 20)));
    return NextResponse.json(await runNewsletter({ dry: body.dry === true }));
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível enviar.' }, { status: 502 });
  }
}
