import { revalidateTag, unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { defaultHomeOptions, normalizeHomeOptions, type HomeOptions } from '@/lib/home-sections';

/**
 * Disposição do destaque e espaços de publicidade da página inicial, escolhidos no painel (Página inicial). Ficam num
 * ficheiro pequeno no armazenamento, como a posição das secções, e na cache de dados com a etiqueta `home-options`.
 */
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co', process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder', {
    auth: { autoRefreshToken: false, persistSession: false },
  });
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const FILE = 'partilhado/_config/home-opcoes.json';

async function read(): Promise<HomeOptions> {
  try {
    const { data } = await db().storage.from(BUCKET()).download(FILE);
    if (!data) return defaultHomeOptions();
    return normalizeHomeOptions(JSON.parse(await data.text()));
  } catch {
    return defaultHomeOptions();
  }
}

const cached = unstable_cache(read, ['home-options', 'v1'], { tags: ['home-options'], revalidate: 3600 });

export async function getHomeOptions(): Promise<HomeOptions> {
  try {
    return normalizeHomeOptions(await cached());
  } catch {
    return defaultHomeOptions();
  }
}

/** Lê o que está guardado, sem a cache (para o painel). */
export const readHomeOptions = read;

/** Grava as opções (já validadas) e limpa a cache. `null` volta às de origem. */
export async function saveHomeOptions(options: unknown | null): Promise<HomeOptions> {
  const next = options === null ? defaultHomeOptions() : normalizeHomeOptions(options);
  const { error } = await db().storage.from(BUCKET()).upload(FILE, Buffer.from(JSON.stringify(next)), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
  try {
    revalidateTag('home-options', { expire: 0 });
  } catch {
    /* fora de um pedido */
  }
  return next;
}
