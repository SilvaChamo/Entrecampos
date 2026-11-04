import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Limpa o cache público do site (home, categorias, notícias, páginas e comentários).
 * Chamada ao gravar/apagar/mudar o estado de uma notícia e pela limpeza semanal de sábado.
 */
export function refreshSite() {
  revalidatePath('/', 'layout');
  try {
    revalidateTag('news', 'max');
    revalidateTag('comments', 'max');
  } catch {
    /* fora de um pedido (ex.: scripts): o revalidatePath acima já chega */
  }
}
