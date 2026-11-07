import { revalidateTag, unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { defaultHomeLayout, normalizeHomeLayout, type HomeLayout } from '@/lib/home-sections';

/**
 * Posição das secções da página inicial, escolhida no painel (painel, Página inicial). Fica num ficheiro pequeno no
 * armazenamento, como as cores e os nomes das categorias, e na cache de dados com a etiqueta `home-layout`, que gravar limpa.
 */
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co', process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder', {
    auth: { autoRefreshToken: false, persistSession: false },
  });
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const FILE = 'partilhado/_config/home-seccoes.json';

export type { HomeLayout, HomeZone } from '@/lib/home-sections';

async function read(): Promise<HomeLayout> {
  try {
    const { data } = await db().storage.from(BUCKET()).download(FILE);
    if (!data) return defaultHomeLayout();
    return normalizeHomeLayout(JSON.parse(await data.text()));
  } catch {
    return defaultHomeLayout();
  }
}

const cached = unstable_cache(read, ['home-layout'], { tags: ['home-layout'], revalidate: 3600 });

export async function getHomeLayout(): Promise<HomeLayout> {
  try {
    return await cached();
  } catch {
    return defaultHomeLayout();
  }
}

/** Grava a posição das secções (já validada) e limpa a cache. `null` volta à ordem de origem. */
export async function saveHomeLayout(layout: unknown | null): Promise<HomeLayout> {
  const next = layout === null ? defaultHomeLayout() : normalizeHomeLayout(layout);
  const { error } = await db().storage.from(BUCKET()).upload(FILE, Buffer.from(JSON.stringify(next)), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
  try {
    revalidateTag('home-layout', { expire: 0 });
  } catch {
    /* fora de um pedido */
  }
  return next;
}
