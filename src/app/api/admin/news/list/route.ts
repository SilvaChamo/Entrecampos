import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';
import { getAllPosts, matchesSearch, notNewsSlugs, searchText } from '@/lib/news-data';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Índice de pesquisa do painel: todo o texto de cada notícia, de qualquer estado. Fica na cache de dados (etiqueta `news`,
 * que gravar/mudar estado/eliminar já limpa), por isso só a primeira pesquisa depois de uma alteração é lenta.
 */
const adminSearchIndex = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from('news')
      .select('id,slug,title,summary,content,category,categories,author_name')
      .eq('site_id', SITE_ID);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: String(r.id),
      slug: String(r.slug ?? ''),
      hay: searchText([r.title, r.summary, r.category, r.categories, r.author_name, r.slug, r.content].join(' ')),
    }));
  },
  ['admin-search-index'],
  { tags: ['news'], revalidate: 3600 },
);

/**
 * Lista de notícias do painel. Lê do Supabase no servidor (com a sessão do painel a decidir
 * quem pode ver); se o Supabase recusar ou estiver inacessível, mostra a cópia local do site.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAuth('ler_artigos');
  if ('error' in guard) return guard.error;

  try {
    // Tabela base (mais rápida que a vista `news`). Colunas opcionais que ainda possam não existir na tabela
    // (autor, estado) vão caindo uma a uma; sem `status`, todas contam como publicadas.
    const base = 'id,title,slug,category,date,image_url,summary,views';
    let data: any[] | null = null;
    let error: { message: string } | null = null;
    // Com `?q=` a pesquisa corre aqui, em todo o texto da notícia (todos os estados): devolve só as que o contêm.
    const q = (req.nextUrl.searchParams.get('q') || '').trim();
    const matchIds = q ? new Set((await adminSearchIndex()).filter((r) => matchesSearch(q, r.hay)).map((r) => r.id)) : null;
    // `?ids=1`: o painel só precisa de saber quais as notícias que contêm a pesquisa (resposta imediata, sem nova ida à base).
    if (matchIds && req.nextUrl.searchParams.get('ids') === '1') return NextResponse.json({ ids: [...matchIds] });
    const withText = '';
    for (const extra of [',status,author_name', ',status', '']) {
      const res = await supabaseAdmin.from('news').select(`${base}${withText}${extra}`).eq('site_id', SITE_ID).order('date', { ascending: false });
      data = res.data as any[] | null;
      error = res.error;
      if (!error || !/status|author_name/i.test(error.message)) break;
    }
    if (!error && data) {
      const excluded = notNewsSlugs();
      const items = (data as any[])
        .filter((r) => !excluded.has(r.slug))
        .filter((r) => !matchIds || matchIds.has(String(r.id)))
        .map((r) => ({ ...r, status: r.status || 'Published' }));
      return NextResponse.json({ items, source: 'supabase' });
    }
    console.warn('[admin/news/list] Supabase recusou:', error?.message);
  } catch (err) {
    console.warn('[admin/news/list] Supabase inacessível:', err instanceof Error ? err.message : err);
  }

  const { posts } = await getAllPosts();
  const items = posts.map((p) => ({
    id: p.slug,
    title: p.title,
    slug: p.slug,
    category: p.category,
    date: p.date,
    image_url: p.image,
    status: 'Published',
    summary: p.excerpt,
    views: 0,
  }));
  return NextResponse.json({ items, source: 'local' });
}
