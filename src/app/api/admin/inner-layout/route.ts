import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { readInnerLayout, saveInnerLayout } from '@/lib/inner-layout-store';
import { refreshSite } from '@/lib/refresh-site';

/** Modelo das páginas interiores: o que está guardado, sem a cache de 1 hora. */
export async function GET() {
  const guard = await requireAuth('editar_definicoes');
  if ('error' in guard) return guard.error;
  return NextResponse.json({ layout: await readInnerLayout() });
}

/** Guarda o modelo das páginas interiores. `null` volta ao de origem. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('editar_definicoes');
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => ({}));
  if (!('layout' in body) || (body.layout !== null && (typeof body.layout !== 'object' || Array.isArray(body.layout)))) {
    return NextResponse.json({ error: 'Dados do layout inválidos.' }, { status: 400 });
  }
  try {
    const layout = await saveInnerLayout(body.layout);
    refreshSite(); // as páginas interiores estão em cache (7 dias): refazem-se já com o novo modelo
    return NextResponse.json({ ok: true, layout });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível guardar.' }, { status: 502 });
  }
}
