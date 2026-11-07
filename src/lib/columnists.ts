import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { siteAccess } from '@/lib/site-accounts';
import { displayNameOf } from '@/lib/display-name';
import { gravatarUrl } from '@/lib/gravatar';

/**
 * Colunistas = contas do EntreCAMPOS com o nível Colunista (sozinho ou somado a outro papel, ex.: Editor e colunista).
 * O nome, a foto e as redes sociais vêm da própria conta (criar/editar utilizador); os artigos são os de Opinião
 * cujo autor é o nome de exibição da conta. Fica na cache de dados com a etiqueta `columnists`, que criar, editar
 * e apagar contas limpam (lib/refresh-site.ts: refreshColumnists).
 */
export type Columnist = {
  /** Id da conta. */
  id: string;
  nome: string;
  /** Sem o @; mostra-se como @utilizador por baixo do nome. */
  handle: string;
  foto: string;
  /** Nome de exibição da conta (o mesmo que fica como autor das notícias): os artigos de Opinião com este autor são os do colunista. */
  autor: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  x: string;
};

export const SOCIAL_KEYS = ['facebook', 'instagram', 'linkedin', 'x'] as const;

/** Só ligações https (o painel é de confiança, mas o endereço acaba num <a href> público). */
export function cleanUrl(v: unknown): string {
  const s = typeof v === 'string' ? v.trim().slice(0, 300) : '';
  return /^https:\/\/[^\s]+$/i.test(s) ? s : '';
}

async function readAccounts(): Promise<Columnist[]> {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const list: Columnist[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    for (const u of data.users) {
      const access = siteAccess(u);
      if (!access || !access.approved || !(access.colunista || /^colunista$/i.test(access.role))) continue;
      const m = (u.user_metadata || {}) as Record<string, unknown>;
      const nome = displayNameOf(u);
      list.push({
        id: u.id,
        nome,
        handle: String(m.username || u.email?.split('@')[0] || '').replace(/^@+/, '').replace(/[^\w.-]/g, '').slice(0, 40),
        // Foto da conta; sem ela, o avatar do e-mail (se o e-mail não tiver, o card mostra as iniciais).
        foto: cleanUrl(m.avatar_url) || gravatarUrl(u.email),
        autor: nome,
        facebook: cleanUrl(m.facebook),
        instagram: cleanUrl(m.instagram),
        linkedin: cleanUrl(m.linkedin),
        x: cleanUrl(m.x),
      });
    }
    if (data.users.length < 1000) break;
  }
  return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
}

const cached = unstable_cache(async () => readAccounts(), ['columnists-accounts'], { tags: ['columnists'], revalidate: 604800 });

/** Para o site público (com cache de 7 dias; mudar uma conta limpa-a logo). */
export async function getColumnists(): Promise<Columnist[]> {
  try {
    return await cached();
  } catch {
    return [];
  }
}
