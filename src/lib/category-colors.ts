import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { isHexColor } from '@/lib/category-palette';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const FILE = 'partilhado/_config/categoria-cores.json';

/**
 * Cores escolhidas no painel para as etiquetas de categoria ({ slug: '#rrggbb' }). Ficam num ficheiro pequeno no
 * armazenamento (como a presença do painel) e na cache de dados com a etiqueta `category-colors`, que gravar limpa.
 */
const cachedColors = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET()).download(FILE);
    if (error || !data) return {};
    try {
      const raw = JSON.parse(await data.text()) as Record<string, unknown>;
      return Object.fromEntries(Object.entries(raw).filter(([, v]) => isHexColor(v))) as Record<string, string>;
    } catch {
      return {};
    }
  },
  ['category-colors'],
  { tags: ['category-colors'], revalidate: 3600 },
);

export async function getCategoryColors(): Promise<Record<string, string>> {
  try {
    return await cachedColors();
  } catch {
    return {};
  }
}

/** Grava (ou, com `color` nulo, retira) a cor de uma categoria e limpa a cache do site. */
export async function setCategoryColor(slug: string, color: string | null) {
  // Lê directamente (sem cache) para não perder uma alteração recente.
  const { data } = await supabaseAdmin.storage.from(BUCKET()).download(FILE);
  let current: Record<string, string> = {};
  try {
    if (data) current = JSON.parse(await data.text());
  } catch {
    current = {};
  }
  if (color) current[slug] = color;
  else delete current[slug];
  const { error } = await supabaseAdmin.storage
    .from(BUCKET())
    .upload(FILE, Buffer.from(JSON.stringify(current)), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
  try {
    revalidateTag('category-colors', { expire: 0 });
  } catch {
    /* fora de um pedido */
  }
  revalidatePath('/', 'layout');
  return current;
}
