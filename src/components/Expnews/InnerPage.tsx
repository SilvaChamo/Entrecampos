import ExpShell from '@/components/Expnews/Shell';
import WeatherCard from '@/components/Expnews/WeatherCard';
import ExchangeCard from '@/components/Expnews/ExchangeCard';
import StickyColumn from '@/components/Expnews/StickyColumn';
import { SiteSidebar } from '@/components/Site/parts';
import PageHeaderCard, { type Crumb } from '@/components/Expnews/PageHeaderCard';
import CategorySection from '@/components/Expnews/CategorySection';
import { getInnerLayout } from '@/lib/inner-layout-store';
import type { InnerPageKey } from '@/lib/inner-layout';
import { applyCategoryNames, categoryLabel, getAllPosts, getCategoryPosts } from '@/lib/news-data';

/**
 * Páginas interiores: o mesmo cabeçalho, menu lateral e rodapé da home.
 * Com `title` (e o caminho em `trail`) mostra o card de título no topo, igual em todas as páginas interiores.
 */
export default function InnerPage({
  children,
  backdrop,
  title,
  trail = [],
}: {
  children: React.ReactNode;
  backdrop?: string;
  title?: string;
  trail?: Crumb[];
}) {
  return (
    <ExpShell backdrop={backdrop}>
      <main className="pb-6">
        {title && <PageHeaderCard title={title} trail={trail} />}
        <div className="mx-3">
          <div className="mx-auto max-w-[1280px]">{children}</div>
        </div>
      </main>
    </ExpShell>
  );
}

/**
 * Coluna lateral das páginas interiores: fica fixa ao fazer scroll. Leva os blocos escolhidos no painel (Layout) para
 * este tipo de página, pela ordem escolhida; os que são só cartões brancos seguidos (destaque, Facebook, publicidade) ficam juntos.
 */
export async function InnerSidebar({ page = 'interior' }: { page?: InnerPageKey }) {
  const order = (await getInnerLayout())[page].sidebar;
  const out: React.ReactNode[] = [];
  let white: ('destaque' | 'facebook' | 'publicidade')[] = [];
  const flush = () => {
    if (white.length) out.push(<SiteSidebar key={`w${out.length}`} blocks={white} />);
    white = [];
  };
  for (const id of order) {
    if (id === 'tempo') { flush(); out.push(<WeatherCard key={id} />); }
    else if (id === 'cambio') { flush(); out.push(<ExchangeCard key={id} />); }
    else white.push(id);
  }
  flush();
  return <StickyColumn className="min-w-0 space-y-3">{out}</StickyColumn>;
}

/**
 * Secção de notícias que o painel (Layout) acrescenta no meio da página, no layout e na categoria escolhidos.
 * Não aparece se estiver desligada. `skip` tira uma notícia (a que está a ser lida).
 */
export async function InnerExtra({ page, skip }: { page: InnerPageKey; skip?: string }) {
  const cfg = (await getInnerLayout())[page].extra;
  if (!cfg.enabled) return null;
  await applyCategoryNames();
  const pool = cfg.category === 'ultimas' ? (await getAllPosts()).posts : await getCategoryPosts(cfg.category);
  const posts = pool.filter((p) => p.slug !== skip).slice(0, 60).map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt.slice(0, 220), category: p.category, categorySlug: p.categorySlug, image: p.image, date: p.date }));
  if (posts.length === 0) return null;
  const label = cfg.category === 'ultimas' ? 'Últimas notícias' : categoryLabel(cfg.category);
  return (
    <div className="min-w-0">
      <CategorySection
        groups={[{ slug: cfg.category, label, posts }]}
        layout={cfg.layout}
        rows={cfg.rows}
        carousel={cfg.carousel}
        listCarousel={cfg.listCarousel}
        listVisible={cfg.visible}
        arrowsOnTop
      />
    </div>
  );
}
