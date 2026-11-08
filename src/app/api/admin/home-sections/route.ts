import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/api-guard';
import { getHomeLayout, saveHomeLayout } from '@/lib/home-layout';
import { readHomeCategories, saveHomeCategories } from '@/lib/home-categories';
import { readHomeOptions, saveHomeOptions } from '@/lib/home-options';

/** Posição, categorias e opções (destaque e publicidade) das secções da home: as que estão guardadas, sem a cache de 1 hora. */
export async function GET() {
  const guard = await requireAuth('editar_definicoes');
  if ('error' in guard) return guard.error;
  return NextResponse.json({ layout: await getHomeLayout(), categories: await readHomeCategories(), options: await readHomeOptions() });
}

const isObj = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Guarda a posição, as categorias e/ou as opções das secções da home. `null` volta ao de origem. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('editar_definicoes');
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => ({}));
  const keys = ['layout', 'categories', 'options'] as const;
  if (!keys.some((k) => k in body)) return NextResponse.json({ error: 'Nada para guardar.' }, { status: 400 });
  if (keys.some((k) => k in body && body[k] !== null && !isObj(body[k]))) {
    return NextResponse.json({ error: 'Dados das secções inválidos.' }, { status: 400 });
  }
  try {
    const layout = 'layout' in body ? await saveHomeLayout(body.layout) : await getHomeLayout();
    const categories = 'categories' in body ? await saveHomeCategories(body.categories) : await readHomeCategories();
    const options = 'options' in body ? await saveHomeOptions(body.options) : await readHomeOptions();
    revalidatePath('/'); // a home refaz-se já com a nova ordem, categorias e opções
    return NextResponse.json({ ok: true, layout, categories, options });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível guardar.' }, { status: 502 });
  }
}
