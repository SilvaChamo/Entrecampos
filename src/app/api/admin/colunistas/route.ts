import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { cleanColumnist, loadColumnists, saveColumnists, MAX_COLUMNISTS } from '@/lib/columnists';
import { opinionPosts, sameAuthor } from '@/lib/columnist-utils';
import { getAllPosts } from '@/lib/news-data';
import { createClient } from '@supabase/supabase-js';
import { siteAccess } from '@/lib/site-accounts';
import { displayNameOf } from '@/lib/display-name';

export const dynamic = 'force-dynamic';

const fail = (err: unknown, fallback: string) => NextResponse.json({ error: err instanceof Error ? err.message : fallback }, { status: 502 });

/** Quem pode escrever artigos neste site (contribuidor, editor, administrador): os nomes que ficam como autor. */
async function writerNames(): Promise<string[]> {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const names: string[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    for (const u of data.users) {
      const access = siteAccess(u);
      if (access && /^(administrador|editor|contribuidor|colunista)$/i.test(access.role)) names.push(displayNameOf(u));
    }
    if (data.users.length < 1000) break;
  }
  return names;
}

/** Colunistas, os autores possíveis e os artigos de Opinião (para o painel escolher o artigo de cada colunista). */
export async function GET() {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  try {
    const [columnists, { posts }, writers] = await Promise.all([loadColumnists(), getAllPosts(), writerNames().catch(() => [] as string[])]);
    const opinion = opinionPosts(posts).map((p) => ({ slug: p.slug, title: p.title, author: p.author }));
    // Autores: quem pode escrever (mesmo sem artigos ainda) e quem já tem artigos de Opinião, sem repetir.
    const authors: string[] = [];
    for (const n of [...writers, ...opinion.map((o) => o.author), ...columnists.map((c) => c.autor)]) {
      if (n && !authors.some((a) => sameAuthor(a, n))) authors.push(n);
    }
    return NextResponse.json({ columnists, authors: authors.sort((a, b) => a.localeCompare(b, 'pt')), opinion });
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
