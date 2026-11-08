import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';
import { hasPermission } from '@/lib/permissions';
import { getAllPosts, matchesSearch, notNewsSlugs, searchText } from '@/lib/news-data';
import { sameAuthor } from '@/lib/columnist-utils';
import { displayNameOf } from '@/lib/display-name';

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
  { tags: ['news'], revalidate: 604800 }, // 7 dias; gravar/estado/eliminar expiram-na logo
);

/**
 * Linhas da lista do painel, na cache de dados (etiqueta `news`, que gravar, mudar de estado e eliminar já limpam): abrir
 * outra vez a mesma página já não vai à base de dados de cada vez. Tabela base (mais rápida que a vista `news`); colunas
 * opcionais que ainda possam não existir (autor, estado) vão caindo uma a uma; sem `status`, todas contam como publicadas.
 * Só as leituras (`views`) podem ficar até 1 dia atrás.
 */
const adminNewsRows = unstable_cache(
  async (): Promise<any[]> => {
    const base = 'id,title,slug,category,date,image_url,summary,views';
    let lastError = 'Sem resposta da base de dados.';
    for (const extra of [',categories,status,author_name', ',status,author_name', ',status', '']) {
      const res = await supabaseAdmin.from('news').select(`${base}${extra}`).eq('site_id', SITE_ID).order('date', { ascending: false });
      if (!res.error) return (res.data ?? []) as any[];
      lastError = res.error.message;
      if (!/categories|status|author_name/i.test(res.error.message)) break;
    }
    throw new Error(lastError);
  },
  ['admin-news-rows', 'v2'], // v2: inclui `categories` (a cache de dados sobrevive aos deploys)
  { tags: ['news'], revalidate: 86400 }, // 1 dia: só as leituras (views) demoram a actualizar; o resto muda logo ao gravar
);

/** Nome de autor da conta (é o que ficou gravado nos artigos dela); sem conta no Supabase, o nome da sessão. */
async function myAuthorName(userId: string, fallback: string): Promise<string> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return fallback;
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  return data?.user ? displayNameOf(data.user) : fallback;
}

/**
 * Lista de notícias do painel. Lê do Supabase no servidor (com a sessão do painel a decidir
 * quem pode ver); se o Supabase recusar ou estiver inacessível, mostra a cópia local do site.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAuth('ler_artigos');
  if ('error' in guard) return guard.error;

  try {
    let data: any[] | null = null;
    let error: { message: string } | null = null;
    // Com `?q=` a pesquisa corre aqui, em todo o texto da notícia (todos os estados): devolve só as que o contêm.
    const q = (req.nextUrl.searchParams.get('q') || '').trim();
    const matchIds = q ? new Set((await adminSearchIndex()).filter((r) => matchesSearch(q, r.hay)).map((r) => r.id)) : null;
    // `?ids=1`: o painel só precisa de saber quais as notícias que contêm a pesquisa (resposta imediata, sem nova ida à base).
    if (matchIds && req.nextUrl.searchParams.get('ids') === '1') return NextResponse.json({ ids: [...matchIds] });
    try {
      data = await adminNewsRows();
    } catch (e) {
      error = { message: e instanceof Error ? e.message : String(e) };
    }
    if (!error && data) {
      const excluded = notNewsSlugs();
      // Opinião tem listas próprias (menu Artigos de Opinião): com ?tipo=opiniao só vêm elas; quem publica (administrador, editor)
      // não as vê misturadas com as notícias. Quem só escreve (contribuidor, colunista) continua a ver os seus artigos todos.
      const opinion = (r: any) => String(r.category ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === 'opiniao';
      const onlyOpinion = req.nextUrl.searchParams.get('tipo') === 'opiniao';
      const hideOpinion = !onlyOpinion && req.nextUrl.searchParams.get('meus') !== '1' && hasPermission(guard.session.role, 'publicar_artigos');
      // `?meus=1`: só os artigos do próprio (pelo nome de autor da conta), de qualquer categoria e estado.
      const mine = req.nextUrl.searchParams.get('meus') === '1' ? await myAuthorName(guard.session.id, guard.session.name) : null;
      const items = (data as any[])
        .filter((r) => !excluded.has(r.slug))
        .filter((r) => mine === null || sameAuthor(String(r.author_name ?? ''), mine))
        .filter((r) => (onlyOpinion ? opinion(r) : hideOpinion ? !opinion(r) : true))
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
