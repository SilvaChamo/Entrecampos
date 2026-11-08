import { applyCategoryNames, categoryLabel, slugify } from '@/lib/news-data';
import CategoryView from '@/app/categoria/CategoryView';

export const revalidate = 604800; // 7 dias; gravar no painel limpa já o cache (lib/refresh-site.ts)

/** Sem páginas geradas no deploy: cada uma gera-se no primeiro acesso e fica em cache (sem isto a Vercel renderiza-a a cada pedido). */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  await applyCategoryNames();
  const slug = slugify(decodeURIComponent((await params).slug));
  return { title: `Arquivo de ${categoryLabel(slug)} — EntreCAMPOS` };
}

/** Páginas 2, 3... de uma categoria. Serve /categoria/<slug>?pagina=N (reescrita em next.config.ts) e fica em cache. */
export default async function PaginaDeCategoriaN({ params }: { params: Promise<{ slug: string; pagina: string }> }) {
  const { slug, pagina } = await params;
  return <CategoryView slug={slug} page={parseInt(pagina, 10) || 1} />;
}
