import { revalidateTag, unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

/**
 * Notícias activadas para a secção "Sugestões de leitura" (fim da home). A lista de endereços (slugs) fica num ficheiro
 * pequeno no armazenamento, como as cores das categorias: não mexe na tabela de notícias.
 */
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co', process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder', {
    auth: { autoRefreshToken: false, persistSession: false },
  });
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const FILE = 'partilhado/_config/sugestoes-leitura.json';

async function readSlugs(): Promise<string[]> {
  try {
    const { data } = await db().storage.from(BUCKET()).download(FILE);
    if (!data) return [];
    const raw = JSON.parse(await data.text());
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

const cached = unstable_cache(readSlugs, ['reading-suggestions'], { tags: ['reading-suggestions'], revalidate: 3600 });

export async function getSuggestionSlugs(): Promise<Set<string>> {
  try {
    return new Set(await cached());
  } catch {
    return new Set();
  }
}

/** Activa ou desactiva uma notícia nas sugestões de leitura. */
export async function setSuggestion(slug: string, on: boolean) {
  const current = new Set(await readSlugs()); // sem cache: não perde uma alteração recente
  if (on) current.add(slug);
  else current.delete(slug);
  const { error } = await db().storage.from(BUCKET()).upload(FILE, Buffer.from(JSON.stringify([...current])), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
  try {
    revalidateTag('reading-suggestions', { expire: 0 });
  } catch {
    /* fora de um pedido */
  }
}
