'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { SESSION_COOKIE, verifySession } from '@/lib/local-session';
import { hasPermission } from '@/lib/permissions';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';

/** Corrige a imagem de uma notícia deste site. Exige sessão do painel com permissão de editar artigos. */
export async function repairNewsImage(newsId: string, newUrl: string) {
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || !hasPermission(session.role, 'editar_artigos')) {
    throw new Error('Não tem permissão para esta operação.');
  }

  const id = String(newsId || '').trim();
  const url = String(newUrl || '').trim();
  if (!id) throw new Error('Notícia inválida.');
  // Vazio remove a imagem (usado ao desfazer); caso contrário só ligações http(s).
  if (url && !/^https?:\/\//i.test(url)) throw new Error('A ligação da imagem tem de começar por http:// ou https://.');

  // Chave de serviço: só existe no servidor (nunca NEXT_PUBLIC_*).
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Só se altera uma notícia deste site.
  const { data, error } = await supabaseAdmin
    .from('news')
    .update({ image_url: url || null })
    .eq('id', id)
    .eq('site_id', SITE_ID)
    .select('id');

  if (error) throw new Error(`Erro na base de dados: ${error.message}`);
  if (!data || data.length === 0) throw new Error('A notícia não foi encontrada neste site.');
  return true;
}
