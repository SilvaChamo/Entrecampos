import { ARCHIVE_PAGE_SIZE, getAllPosts, searchSlugs } from '@/lib/news-data';
import { Pagination } from '@/components/Site/parts';
import InnerPage, { InnerSidebar } from '@/components/Expnews/InnerPage';
import { NewsCard } from '@/components/Expnews/blocks';

export const revalidate = 604800; // 7 dias; gravar no painel limpa já o cache (lib/refresh-site.ts)
export const metadata = { title: 'Arquivo de notícias — EntreCAMPOS' };

/** Arquivo de todas as notícias, com pesquisa (?q=) e paginação (?pagina=). */
export default async function ArquivoDeNoticias({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  const { q = '', pagina } = await searchParams;
  const query = q.trim().toLowerCase();
  const { posts } = await getAllPosts();
  // A pesquisa procura em todo o texto das notícias (título, resumo, categorias, autor e corpo), ignorando acentos.
  const matches = query ? await searchSlugs(query) : null;
  const found = !query
    ? posts
    : matches
      ? posts.filter((p) => matches.has(p.slug))
      : posts.filter((p) => `${p.title} ${p.excerpt} ${p.category}`.toLowerCase().includes(query));

  const pages = Math.max(1, Math.ceil(found.length / ARCHIVE_PAGE_SIZE));
  const page = Math.min(Math.max(parseInt(pagina || '1', 10) || 1, 1), pages);
  const visible = found.slice((page - 1) * ARCHIVE_PAGE_SIZE, page * ARCHIVE_PAGE_SIZE);
  const qs = (n: number) => `/noticias?${new URLSearchParams({ ...(q ? { q } : {}), ...(n > 1 ? { pagina: String(n) } : {}) })}`;

  return (
    <InnerPage
      title={q ? `Resultados para “${q}”` : 'Arquivo de notícias'}
      trail={q ? [{ label: 'Notícias', href: '/noticias' }, { label: 'Pesquisa' }] : [{ label: 'Notícias' }]}
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0">
          {visible.length === 0 ? (
            <p className="bg-white py-16 text-center text-gray-500 shadow-sm">Nenhuma notícia encontrada.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p) => (
                <NewsCard key={p.slug} post={p} />
              ))}
            </div>
          )}
          <Pagination page={page} pages={pages} hrefFor={qs} />
        </section>
        <InnerSidebar />
      </div>
    </InnerPage>
  );
}
