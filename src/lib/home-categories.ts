import { revalidateTag, unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { defaultHomeCategories, normalizeHomeCategories, type HomeCategories } from '@/lib/home-sections';

/**
 * Categorias de cada secção da página inicial, escolhidas no painel (Página inicial). Ficam num ficheiro pequeno no
 * armazenamento, como a posição das secções, e na cache de dados com a etiqueta `home-categories`, que gravar limpa.
 */
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co', process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder', {
    auth: { autoRefreshToken: false, persistSession: false },
  });
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const FILE = 'partilhado/_config/home-categorias.json';

export type { HomeCategories } from '@/lib/home-sections';

async function read(): Promise<HomeCategories> {
  try {
    const { data } = await db().storage.from(BUCKET()).download(FILE);
    if (!data) return defaultHomeCategories();
    return normalizeHomeCategories(JSON.parse(await data.text()));
  } catch {
    return defaultHomeCategories();
  }
}

const cached = unstable_cache(read, ['home-categories', 'v1'], { tags: ['home-categories'], revalidate: 3600 });

export async function getHomeCategories(): Promise<HomeCategories> {
  try {
    return normalizeHomeCategories(await cached());
  } catch {
    return defaultHomeCategories();
  }
}

/** Lê o que está guardado, sem a cache (para o painel). */
export const readHomeCategories = read;

/** Grava as categorias das secções (já validadas) e limpa a cache. `null` volta às de origem. */
export async function saveHomeCategories(categories: unknown | null): Promise<HomeCategories> {
  const next = categories === null ? defaultHomeCategories() : normalizeHomeCategories(categories);
  const { error } = await db().storage.from(BUCKET()).upload(FILE, Buffer.from(JSON.stringify(next)), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
  try {
    revalidateTag('home-categories', { expire: 0 });
  } catch {
    /* fora de um pedido */
  }
  return next;
}
