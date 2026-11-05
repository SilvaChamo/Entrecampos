import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Limpa o cache público do site (home, categorias, notícias, páginas e comentários).
 * Chamada ao gravar/apagar/mudar o estado de uma notícia e pela limpeza semanal de sábado.
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
