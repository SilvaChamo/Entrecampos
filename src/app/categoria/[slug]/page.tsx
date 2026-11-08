import { applyCategoryNames, categoryLabel, slugify } from '@/lib/news-data';
import CategoryView from '../CategoryView';

export const revalidate = 604800; // 7 dias; gravar no painel limpa já o cache (lib/refresh-site.ts)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  await applyCategoryNames();
  const slug = slugify(decodeURIComponent((await params).slug));
  return { title: `Arquivo de ${categoryLabel(slug)} — EntreCAMPOS` };
}

/** Modelo único de categoria (1.ª página): serve todas as categorias. Sem searchParams, para ficar em cache; ?pagina=N tem rota própria (next.config.ts). */
export default async function PaginaDeCategoria({ params }: { params: Promise<{ slug: string }> }) {
  return <CategoryView slug={(await params).slug} />;
}
