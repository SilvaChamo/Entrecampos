import { revalidateTag, unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { defaultInnerLayout, normalizeInnerLayout, type InnerLayout } from '@/lib/inner-layout';

/**
 * Modelo das páginas interiores (painel, Layout): barra lateral e secção extra de cada tipo de página. Fica num ficheiro
 * pequeno no armazenamento, como a posição das secções da home, e na cache de dados com a etiqueta `inner-layout`.
 */
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co', process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder', {
    auth: { autoRefreshToken: false, persistSession: false },
  });
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const FILE = 'partilhado/_config/paginas-interiores.json';

async function read(): Promise<InnerLayout> {
  try {
    const { data } = await db().storage.from(BUCKET()).download(FILE);
    if (!data) return defaultInnerLayout();
    return normalizeInnerLayout(JSON.parse(await data.text()));
  } catch {
    return defaultInnerLayout();
  }
}

const cached = unstable_cache(read, ['inner-layout', 'v1'], { tags: ['inner-layout'], revalidate: 3600 });

export async function getInnerLayout(): Promise<InnerLayout> {
  try {
    return normalizeInnerLayout(await cached());
  } catch {
    return defaultInnerLayout();
  }
}

/** Lê o que está guardado, sem a cache (para o painel). */
export const readInnerLayout = read;

/** Grava o modelo (já validado) e limpa a cache. `null` volta ao de origem. */
export async function saveInnerLayout(layout: unknown | null): Promise<InnerLayout> {
  const next = layout === null ? defaultInnerLayout() : normalizeInnerLayout(layout);
  const { error } = await db().storage.from(BUCKET()).upload(FILE, Buffer.from(JSON.stringify(next)), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
  try {
    revalidateTag('inner-layout', { expire: 0 });
  } catch {
    /* fora de um pedido */
  }
  return next;
}
