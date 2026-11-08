import 'server-only';
import { loadKeys } from '@/lib/social';

/** Uma configuração em falta: o que é preciso definir (nomes das variáveis, nunca valores) e para quê. */
export type ConfigItem = { vars?: string[]; text: string };
export type ConfigArea = 'redes-sociais';

/** O que falta configurar em cada área do painel. Lista vazia = tudo a funcionar. */
export async function configMissing(area: ConfigArea): Promise<ConfigItem[]> {
  switch (area) {
    case 'redes-sociais': {
      // Só o que ainda falta e que só o responsável pode dar (dados de contas na Meta e no LinkedIn). O Instagram usa a ligação do Facebook.
      const k = await loadKeys();
      const itens: ConfigItem[] = [];
      if (!k.metaPageId || !k.metaPageToken) {
        itens.push({ text: 'Facebook (e Instagram, Reels) por ligar: ligue o interruptor do Facebook e preencha o ID da Página e o token de acesso. O token cria-se numa app da Meta (developers.facebook.com) com as permissões pages_manage_posts, pages_read_engagement, pages_show_list e instagram_content_publish.' });
      }
      if (!k.linkedinOrgId || !k.linkedinToken) {
        itens.push({ text: 'LinkedIn por ligar: ligue o interruptor do LinkedIn e preencha o ID da Página e o token de acesso (app em developer.linkedin.com com a Community Management API, permissão w_organization_social).' });
      }
      return itens;
    }
  }
}

export const CONFIG_AREAS: ConfigArea[] = ['redes-sociais'];
