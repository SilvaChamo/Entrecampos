import { notFound } from 'next/navigation';
import { PAGE_SIZE, categoryLabel, getCategories, getCategoryPosts, isKnownCategory, slugify } from '@/lib/news-data';
import { Pagination, PostCard, SiteMain, SiteSidebar } from '@/components/Site/parts';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = slugify(decodeURIComponent((await params).slug));
  return { title: `Arquivo de ${categoryLabel(slug)} — EntreCAMPOS` };
}

/** Modelo único de categoria: serve todas as categorias (/categoria/<slug>?pagina=N). */
export default async function PaginaDeCategoria({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const slug = slugify(decodeURIComponent((await params).slug));
  const posts = await getCategoryPosts(slug);

  // Categoria sem notícias e desconhecida => 404; conhecida (menu) mas vazia => página vazia.
  if (posts.length === 0 && !isKnownCategory(slug) && !(await getCategories()).some((c) => c.slug === slug)) notFound();

  const pages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const page = Math.min(Math.max(parseInt((await searchParams).pagina || '1', 10) || 1, 1), pages);
  const visible = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <SiteMain>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0 bg-white p-6">
          <h1 className="sr-only">Arquivo de {categoryLabel(slug)}</h1>
          {visible.length === 0 ? (
            <p className="py-16 text-center text-gray-500">Ainda não há notícias nesta categoria.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          )}
          <Pagination page={page} pages={pages} hrefFor={(n) => (n === 1 ? `/categoria/${slug}` : `/categoria/${slug}?pagina=${n}`)} />
        </section>
        <SiteSidebar />
      </div>
    </SiteMain>
  );
}
