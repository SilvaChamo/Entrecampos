import 'server-only';
import { loadKeys } from '@/lib/social';

/** Uma configuração em falta: o que é preciso definir (nomes das variáveis, nunca valores) e para quê. */
export type ConfigItem = { vars?: string[]; text: string; link?: { texto: string; href: string } };
export type ConfigArea = 'redes-sociais';

/** O que falta configurar em cada área do painel. Lista vazia = tudo a funcionar. */
export async function configMissing(area: ConfigArea): Promise<ConfigItem[]> {
  switch (area) {
    case 'redes-sociais': {
      // Só o que ainda falta e que só o responsável pode dar (dados de contas na Meta e no LinkedIn). O Instagram usa a ligação do Facebook.
      const k = await loadKeys();
      const itens: ConfigItem[] = [];
      if (!k.metaPageId || !k.metaPageToken) {
        itens.push({ text: 'Facebook (e Instagram, Reels) por ligar: ligue o interruptor do Facebook e siga o guia que aparece no cartão para obter o ID e o token da Página.', link: { texto: 'Abrir developers.facebook.com', href: 'https://developers.facebook.com/apps' } });
      }
      if (!k.linkedinOrgId || !k.linkedinToken) {
        itens.push({ text: 'LinkedIn por ligar: ligue o interruptor do LinkedIn e siga o guia que aparece no cartão para obter o ID e o token da Página.', link: { texto: 'Abrir linkedin.com/developers', href: 'https://www.linkedin.com/developers/apps' } });
      }
      return itens;
    }
  }
}

export const CONFIG_AREAS: ConfigArea[] = ['redes-sociais'];
