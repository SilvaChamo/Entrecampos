import { Fragment } from 'react';
import { ARCHIVE_PAGE_SIZE, getAllPosts, searchSlugs } from '@/lib/news-data';
import { Pagination } from '@/components/Site/parts';
import InnerPage, { InnerExtra, InnerSidebar } from '@/components/Expnews/InnerPage';
import { NewsCard } from '@/components/Expnews/blocks';
import { getInnerLayout } from '@/lib/inner-layout-store';

/**
 * Arquivo de todas as notícias, com pesquisa e paginação. Não lê os parâmetros do pedido: recebe-os, para o arquivo
 * (sem pesquisa) poder ficar em cache. Os endereços /noticias?pagina=N e /noticias?q=... chegam aqui por reescritas em
 * next.config.ts (o endereço que o visitante vê não muda).
 */
export default async function ArchiveView({ q = '', page: pageParam = 1 }: { q?: string; page?: number }) {
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
  const page = Math.min(Math.max(pageParam || 1, 1), pages);
  const visible = found.slice((page - 1) * ARCHIVE_PAGE_SIZE, page * ARCHIVE_PAGE_SIZE);
  // Secção extra do modelo «Categorias» (painel, Layout), só no arquivo sem pesquisa.
  const extraCfg = (await getInnerLayout()).categoria.extra;
  const extraAt = extraCfg.enabled && !query ? Math.min(Math.max(extraCfg.after, 0), visible.length) : -1;
  const extra = extraAt >= 0 ? <InnerExtra page="categoria" /> : null;
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
              {visible.map((p, i) => (
                <Fragment key={p.slug}>
                  {i === extraAt && extra && <div className="sm:col-span-2 xl:col-span-3">{extra}</div>}
                  <NewsCard post={p} />
                </Fragment>
              ))}
              {extraAt === visible.length && extra && <div className="sm:col-span-2 xl:col-span-3">{extra}</div>}
            </div>
          )}
          <Pagination page={page} pages={pages} hrefFor={qs} />
        </section>
        <InnerSidebar page="categoria" />
      </div>
    </InnerPage>
  );
}
