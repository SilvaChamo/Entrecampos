import { revalidateTag, unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const FILE = 'partilhado/_config/categoria-nomes.json';

/** `names`: nome escolhido no painel para cada categoria ({ slug: nome }). `aliases`: o endereço do nome novo aponta para a categoria de sempre ({ nome-novo: slug }). */
export type CategoryNames = { names: Record<string, string>; aliases: Record<string, string> };

const EMPTY: CategoryNames = { names: {}, aliases: {} };
const keyOf = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function parse(raw: unknown): CategoryNames {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const pick = (v: unknown) =>
    Object.fromEntries(Object.entries((v && typeof v === 'object' ? v : {}) as Record<string, unknown>).filter(([, x]) => typeof x === 'string' && x)) as Record<string, string>;
  return { names: pick(r.names), aliases: pick(r.aliases) };
}

/**
 * Nomes das categorias escolhidos no painel. Ficam num ficheiro pequeno no armazenamento (como as cores das etiquetas) e na
 * cache de dados com a etiqueta `category-names`, que gravar limpa. O slug (endereço) da categoria nunca muda: só o nome.
 */
const cachedNames = unstable_cache(
  async (): Promise<CategoryNames> => {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET()).download(FILE);
    if (error || !data) return EMPTY;
    try {
      return parse(JSON.parse(await data.text()));
    } catch {
      return EMPTY;
    }
  },
  ['category-names'],
  { tags: ['category-names'], revalidate: 3600 },
);

export async function getCategoryNames(): Promise<CategoryNames> {
  try {
    return await cachedNames();
  } catch {
    return EMPTY;
  }
}

/** Grava (ou, com `name` nulo, retira) o nome de uma categoria. Lê directamente (sem cache) para não perder uma alteração recente. */
export async function setCategoryName(slug: string, name: string | null): Promise<CategoryNames> {
  const { data } = await supabaseAdmin.storage.from(BUCKET()).download(FILE);
  let current = EMPTY;
  try {
    if (data) current = parse(JSON.parse(await data.text()));
  } catch {
    current = EMPTY;
  }
  const next: CategoryNames = { names: { ...current.names }, aliases: { ...current.aliases } };
  for (const [k, v] of Object.entries(next.aliases)) if (v === slug) delete next.aliases[k]; // o nome antigo deixa de apontar para aqui
  if (name) {
    next.names[slug] = name;
    const alias = keyOf(name);
    if (alias && alias !== slug) next.aliases[alias] = slug;
  } else {
    delete next.names[slug];
  }
  const { error } = await supabaseAdmin.storage
    .from(BUCKET())
    .upload(FILE, Buffer.from(JSON.stringify(next)), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
  try {
    revalidateTag('category-names', { expire: 0 });
  } catch {
    /* fora de um pedido */
  }
  return next;
}
