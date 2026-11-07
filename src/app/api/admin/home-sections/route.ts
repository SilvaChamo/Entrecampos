import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/api-guard';
import { getHomeLayout, saveHomeLayout } from '@/lib/home-layout';

/** Posição actual das secções da home (a que está guardada, sem a cache de 1 hora). */
export async function GET() {
  const guard = await requireAuth('editar_definicoes');
  if ('error' in guard) return guard.error;
  return NextResponse.json({ layout: await getHomeLayout() });
}

/** Guarda a posição das secções da home. `layout: null` volta à ordem de origem. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('editar_definicoes');
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => ({}));
  if (body.layout !== null && (typeof body.layout !== 'object' || Array.isArray(body.layout))) {
    return NextResponse.json({ error: 'Posição das secções inválida.' }, { status: 400 });
  }
  try {
    const layout = await saveHomeLayout(body.layout);
    revalidatePath('/'); // a home refaz-se já com a nova ordem
    return NextResponse.json({ ok: true, layout });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível guardar.' }, { status: 502 });
  }
}
