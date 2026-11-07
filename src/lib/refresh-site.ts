import { revalidatePath, revalidateTag } from 'next/cache';
import { slugify } from '@/lib/news-data';

/**
 * Limpa o cache público do site (home, categorias, notícias, páginas e comentários).
 * Usada na limpeza semanal de sábado, no botão "limpar cache" e quando se apaga/retira uma notícia
 * (as outras páginas podem ter um link para ela).
 */
export function refreshSite() {
  revalidatePath('/', 'layout');
  try {
    // Expira já (e não "max", que serve a versão velha ao 1.º visitante): a notícia publicada aparece logo no site.
    revalidateTag('news', { expire: 0 });
    revalidateTag('comments', { expire: 0 });
  } catch {
    /* fora de um pedido (ex.: scripts): o revalidatePath acima já chega */
  }
}

export type NewsRef = { slug?: unknown; category?: unknown; categories?: unknown };

/**
 * Limpeza dirigida: gravar ou publicar uma notícia refaz só o que a mostra (a notícia, a sua categoria/categorias,
 * a home, o arquivo e o mapa do site). As outras categorias e páginas ficam em cache (7 dias).
 * A cache de dados `news` expira sempre: é uma só consulta e refaz-se num instante.
 */
export function refreshNews(refs: NewsRef[]) {
  const paths = new Set<string>(['/', '/noticias', '/categorias', '/sitemap.xml']);
  for (const ref of refs) {
    const slug = typeof ref.slug === 'string' ? ref.slug.trim() : '';
    if (slug) paths.add(`/noticias/${slug}`);
    const cats = [ref.category, ...(Array.isArray(ref.categories) ? ref.categories : [])];
    for (const c of cats) {
      const cat = typeof c === 'string' ? slugify(c) : '';
      if (cat) paths.add(`/categoria/${cat}`);
    }
  }
  try {
    revalidateTag('news', { expire: 0 });
    for (const p of paths) revalidatePath(p);
  } catch {
    /* fora de um pedido */
  }
}

/** Criar, editar ou apagar uma conta pode mudar os colunistas da home: refaz só esse bloco (a home e a etiqueta `columnists`). */
export function refreshColumnists() {
  try {
    revalidateTag('columnists', { expire: 0 });
    revalidatePath('/');
  } catch {
    /* fora de um pedido */
  }
}
