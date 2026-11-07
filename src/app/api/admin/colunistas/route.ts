import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { cleanColumnist, loadColumnists, saveColumnists, MAX_COLUMNISTS } from '@/lib/columnists';
import { getAllPosts } from '@/lib/news-data';

export const dynamic = 'force-dynamic';

const fail = (err: unknown, fallback: string) => NextResponse.json({ error: err instanceof Error ? err.message : fallback }, { status: 502 });

/** Colunistas e a lista de notícias publicadas (para escolher o artigo de cada um). */
export async function GET() {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  try {
    const [columnists, { posts }] = await Promise.all([loadColumnists(), getAllPosts()]);
    return NextResponse.json({ columnists, posts: posts.map((p) => ({ slug: p.slug, title: p.title })) });
  } catch (err) {
    return fail(err, 'Não foi possível carregar os colunistas.');
  }
}

/** Cria (sem `id`) ou actualiza (com `id`) um colunista. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  const item = cleanColumnist(body);
  if (!item) return NextResponse.json({ error: 'Indique o nome do colunista.' }, { status: 400 });
  try {
    const list = await loadColumnists();
    const i = list.findIndex((c) => c.id === item.id);
    if (i >= 0) list[i] = item;
    else if (list.length >= MAX_COLUMNISTS) return NextResponse.json({ error: `No máximo ${MAX_COLUMNISTS} colunistas.` }, { status: 400 });
    else list.push(item);
    await saveColumnists(list);
    return NextResponse.json({ ok: true, columnists: list });
  } catch (err) {
    return fail(err, 'Não foi possível guardar o colunista.');
  }
}

/** Retira um colunista (`?id=`). */
export async function DELETE(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const id = req.nextUrl.searchParams.get('id') || '';
  try {
    const list = await loadColumnists();
    const rest = list.filter((c) => c.id !== id);
    if (rest.length === list.length) return NextResponse.json({ error: 'Colunista não encontrado.' }, { status: 404 });
    await saveColumnists(rest);
    return NextResponse.json({ ok: true, columnists: rest });
  } catch (err) {
    return fail(err, 'Não foi possível eliminar o colunista.');
  }
}
