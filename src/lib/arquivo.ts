import { createClient } from '@supabase/supabase-js';

/**
 * Arquivo de fotos do jornal: pastas criadas pela redacção (`arquivo/<pasta>/<foto>`), à parte da galeria geral.
 * O nome bonito da pasta fica em `arquivo/<pasta>/_pasta.json`; a chave da pasta é o seu "slug".
 */
const supabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
export const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
export const ARQUIVO_ROOT = 'arquivo';

export const folderSlug = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export const isFolderSlug = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length <= 60;

export type ArquivoFolder = { slug: string; nome: string; count: number; cover: string | null; updated_at: string };

type Row = { name: string; id: string | null; created_at?: string; updated_at?: string; metadata?: { mimetype?: string } | null };

const IMAGE = /\.(jpe?g|png|gif|webp|avif)$/i;

async function list(prefix: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase().storage.from(BUCKET()).list(prefix, { limit: 1000, offset, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function readName(slug: string): Promise<string> {
  const { data } = await supabase().storage.from(BUCKET()).download(`${ARQUIVO_ROOT}/${slug}/_pasta.json`);
  if (data) {
    try {
      const nome = String((JSON.parse(await data.text()) as { nome?: string }).nome || '').trim();
      if (nome) return nome;
    } catch { /* usa o nome derivado do slug */ }
  }
  return slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

export async function listFolders(): Promise<ArquivoFolder[]> {
  const dirs = (await list(ARQUIVO_ROOT)).filter((r) => r.id === null && isFolderSlug(r.name));
  const folders = await Promise.all(
    dirs.map(async (d): Promise<ArquivoFolder> => {
      const files = (await list(`${ARQUIVO_ROOT}/${d.name}`)).filter((r) => r.id && IMAGE.test(r.name));
      const cover = files[0] ? supabase().storage.from(BUCKET()).getPublicUrl(`${ARQUIVO_ROOT}/${d.name}/${files[0].name}`).data.publicUrl : null;
      return { slug: d.name, nome: await readName(d.name), count: files.length, cover, updated_at: files[0]?.created_at ?? d.updated_at ?? '' };
    }),
  );
  return folders.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
}

export async function createFolder(nome: string): Promise<ArquivoFolder> {
  const clean = nome.trim().replace(/\s+/g, ' ').slice(0, 80);
  const slug = folderSlug(clean);
  if (!clean || !slug) throw new Error('Dê um nome à pasta.');
  const existing = await list(ARQUIVO_ROOT);
  if (existing.some((r) => r.id === null && r.name === slug)) throw new Error('Já existe uma pasta com esse nome.');
  const { error } = await supabase()
    .storage.from(BUCKET())
    .upload(`${ARQUIVO_ROOT}/${slug}/_pasta.json`, Buffer.from(JSON.stringify({ nome: clean })), { contentType: 'application/json', upsert: false });
  if (error) throw new Error(error.message);
  return { slug, nome: clean, count: 0, cover: null, updated_at: new Date().toISOString() };
}

export async function renameFolder(slug: string, nome: string) {
  const clean = nome.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (!isFolderSlug(slug) || !clean) throw new Error('Pedido inválido.');
  const { error } = await supabase()
    .storage.from(BUCKET())
    .upload(`${ARQUIVO_ROOT}/${slug}/_pasta.json`, Buffer.from(JSON.stringify({ nome: clean })), { contentType: 'application/json', upsert: true });
  if (error) throw new Error(error.message);
}

export async function folderExists(slug: string) {
  return isFolderSlug(slug) && (await list(ARQUIVO_ROOT)).some((r) => r.id === null && r.name === slug);
}
