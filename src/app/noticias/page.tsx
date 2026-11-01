import { PAGE_SIZE, getAllPosts } from '@/lib/news-data';
import { Pagination, PostCard, SiteMain, SiteSidebar } from '@/components/Site/parts';

export const revalidate = 60;
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
  const found = query
    ? posts.filter((p) => `${p.title} ${p.excerpt} ${p.category}`.toLowerCase().includes(query))
    : posts;

  const pages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
  const page = Math.min(Math.max(parseInt(pagina || '1', 10) || 1, 1), pages);
  const visible = found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const qs = (n: number) => `/noticias?${new URLSearchParams({ ...(q ? { q } : {}), ...(n > 1 ? { pagina: String(n) } : {}) })}`;

  return (
    <SiteMain>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0 bg-white p-6">
          <h1 className="mb-5 border-l-[3px] border-red-600 pl-3 text-[18px] font-bold uppercase text-gray-700">
            {q ? `Resultados para “${q}”` : 'Arquivo de notícias'}
          </h1>
          {visible.length === 0 ? (
            <p className="py-16 text-center text-gray-500">Nenhuma notícia encontrada.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          )}
          <Pagination page={page} pages={pages} hrefFor={qs} />
        </section>
        <SiteSidebar />
      </div>
    </SiteMain>
  );
}
