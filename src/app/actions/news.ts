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

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

/**
 * Imagens do servidor para a reparação de notícias: raiz do bucket e as suas pastas (ex.: news/).
 * Lê com a chave de serviço, porque o cliente do browser não tem permissão para listar o armazenamento.
 */
export async function listLibraryImages(): Promise<{ name: string }[]> {
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || !hasPermission(session.role, 'editar_artigos')) {
    throw new Error('Não tem permissão para esta operação.');
  }

  const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ).storage.from(bucket);

  const options = { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } } as const;
  const { data: root, error } = await storage.list('', options);
  if (error) throw new Error(`Erro ao listar o armazenamento: ${error.message}`);

  const folders = (root ?? []).filter((f) => !f.id).map((f) => f.name); // pastas não têm id
  const nested = await Promise.all(
    folders.map(async (folder) => ((await storage.list(folder, options)).data ?? []).filter((f) => f.id).map((f) => ({ ...f, name: `${folder}/${f.name}` })))
  );
  return [...(root ?? []).filter((f) => f.id), ...nested.flat()]
    .filter((f) => IMAGE_EXT.test(f.name))
    .map((f) => ({ name: f.name }));
}
