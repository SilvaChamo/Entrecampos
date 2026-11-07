import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

/**
 * Colunistas da home: nome, @, foto, redes sociais e o autor cujos artigos de Opinião aparecem no card. Ficam num ficheiro pequeno
 * no armazenamento (como as cores das categorias) e na cache de dados com a etiqueta `columnists`, que gravar limpa.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const FILE = 'partilhado/_config/colunistas.json';
export const MAX_COLUMNISTS = 12;

export type Columnist = {
  id: string;
  nome: string;
  /** Sem o @; mostra-se como @utilizador por baixo do nome. */
  handle: string;
  foto: string;
  /** Nome do autor dos artigos (o mesmo que aparece como autor nas notícias): os artigos de Opinião com este autor são os do colunista. */
  autor: string;
  /** Slug do artigo de Opinião fixado no card; vazio = o mais recente do colunista. */
  artigo: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  x: string;
};

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
/** Só ligações https (o painel é de confiança, mas o endereço acaba num <a href> público). */
const url = (v: unknown) => {
  const s = str(v, 300);
  return /^https:\/\/[^\s]+$/i.test(s) ? s : '';
};

/** Limpa um colunista vindo do ficheiro ou do painel; devolve null se faltar o essencial (nome). */
export function cleanColumnist(raw: unknown): Columnist | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const nome = str(r.nome, 80);
  const id = str(r.id, 40) || Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  if (!nome || !/^[\w-]+$/.test(id)) return null;
  return {
    id,
    nome,
    handle: str(r.handle, 40).replace(/^@+/, '').replace(/[^\w.-]/g, ''),
    foto: url(r.foto),
    autor: str(r.autor, 80),
    artigo: /^[\w-]+$/.test(str(r.artigo, 200)) ? str(r.artigo, 200) : '',
    facebook: url(r.facebook),
    instagram: url(r.instagram),
    linkedin: url(r.linkedin),
    x: url(r.x),
  };
}

async function readFile(): Promise<Columnist[]> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET()).download(FILE);
  if (error || !data) return [];
  try {
    const raw = JSON.parse(await data.text());
    return Array.isArray(raw) ? (raw.map(cleanColumnist).filter(Boolean) as Columnist[]).slice(0, MAX_COLUMNISTS) : [];
  } catch {
    return [];
  }
}

const cached = unstable_cache(readFile, ['columnists'], { tags: ['columnists'], revalidate: 3600 });

/** Para o site público (com cache). */
export async function getColumnists(): Promise<Columnist[]> {
  try {
    return await cached();
  } catch {
    return [];
  }
}

/** Para o painel: lê sempre directamente do armazenamento. */
export const loadColumnists = readFile;

/** Grava a lista inteira e limpa a cache do site. */
export async function saveColumnists(list: Columnist[]) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET())
    .upload(FILE, Buffer.from(JSON.stringify(list.slice(0, MAX_COLUMNISTS))), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
  try {
    revalidateTag('columnists', { expire: 0 });
  } catch {
    /* fora de um pedido */
  }
  revalidatePath('/', 'layout');
}
