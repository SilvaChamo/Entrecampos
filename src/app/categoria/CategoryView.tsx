import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import { PAGE_SIZE, applyCategoryNames, categoryLabel, getCategories, getCategoryPosts, isKnownCategory, slugify } from '@/lib/news-data';
import { Pagination } from '@/components/Site/parts';
import InnerPage, { InnerExtra, InnerSidebar } from '@/components/Expnews/InnerPage';
import { NewsCard } from '@/components/Expnews/blocks';
import { getInnerLayout } from '@/lib/inner-layout-store';

/**
 * Arquivo de uma categoria. Não lê os parâmetros do pedido: recebe-os, para a página poder ficar em cache.
 * /categoria/<slug>?pagina=N chega aqui por uma reescrita em next.config.ts (o endereço que o visitante vê não muda).
 */
export default async function CategoryView({ slug: rawSlug, page: pageParam = 1 }: { slug: string; page?: number }) {
  await applyCategoryNames();
  const slug = slugify(decodeURIComponent(rawSlug));
  const posts = await getCategoryPosts(slug);

  // Categoria sem notícias e desconhecida => 404; conhecida (menu) mas vazia => página vazia.
  if (posts.length === 0 && !isKnownCategory(slug) && !(await getCategories()).some((c) => c.slug === slug)) notFound();

  const pages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const page = Math.min(Math.max(pageParam || 1, 1), pages);
  const visible = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Secção extra do modelo «Categorias» (painel, Layout): entra depois de N cards, ou no fim se a página tiver menos.
  const extraCfg = (await getInnerLayout()).categoria.extra;
  const extraAt = extraCfg.enabled ? Math.min(Math.max(extraCfg.after, 0), visible.length) : -1;
  const extra = extraAt >= 0 ? <InnerExtra page="categoria" /> : null;

  return (
    <InnerPage
      backdrop={visible.find((p) => p.image)?.image}
      title={categoryLabel(slug)}
      trail={[{ label: 'Notícias', href: '/noticias' }, { label: 'Categorias', href: '/categorias' }, { label: categoryLabel(slug) }]}
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0">
          {visible.length === 0 ? (
            <p className="bg-white py-16 text-center text-gray-500 shadow-sm">Ainda não há notícias nesta categoria.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p, i) => (
                <Fragment key={p.slug}>
                  {i === extraAt && extra && <div className="sm:col-span-2 xl:col-span-3">{extra}</div>}
                  <NewsCard post={p} byline={slug === 'opiniao'} />
                </Fragment>
              ))}
              {extraAt === visible.length && extra && <div className="sm:col-span-2 xl:col-span-3">{extra}</div>}
            </div>
          )}
          <Pagination page={page} pages={pages} hrefFor={(n) => (n === 1 ? `/categoria/${slug}` : `/categoria/${slug}?pagina=${n}`)} />
        </section>
        <InnerSidebar page="categoria" />
      </div>
    </InnerPage>
  );
}
