import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/api-guard';
import { getHomeLayout, saveHomeLayout } from '@/lib/home-layout';
import { readHomeCategories, saveHomeCategories } from '@/lib/home-categories';

/** Posição e categorias actuais das secções da home (as que estão guardadas, sem a cache de 1 hora). */
export async function GET() {
  const guard = await requireAuth('editar_definicoes');
  if ('error' in guard) return guard.error;
  return NextResponse.json({ layout: await getHomeLayout(), categories: await readHomeCategories() });
}

const isObj = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Guarda a posição e/ou as categorias das secções da home. `null` volta ao de origem. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('editar_definicoes');
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => ({}));
  const hasLayout = 'layout' in body;
  const hasCategories = 'categories' in body;
  if (!hasLayout && !hasCategories) return NextResponse.json({ error: 'Nada para guardar.' }, { status: 400 });
  if ((hasLayout && body.layout !== null && !isObj(body.layout)) || (hasCategories && body.categories !== null && !isObj(body.categories))) {
    return NextResponse.json({ error: 'Dados das secções inválidos.' }, { status: 400 });
  }
  try {
    const layout = hasLayout ? await saveHomeLayout(body.layout) : await getHomeLayout();
    const categories = hasCategories ? await saveHomeCategories(body.categories) : await readHomeCategories();
    revalidatePath('/'); // a home refaz-se já com a nova ordem e categorias
    return NextResponse.json({ ok: true, layout, categories });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível guardar.' }, { status: 502 });
  }
}
