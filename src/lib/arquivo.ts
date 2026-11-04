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

/** O nome de uma pasta tem no máximo 4 palavras. */
export const MAX_FOLDER_WORDS = 4;
export const wordCount = (name: string) => name.trim().split(/\s+/).filter(Boolean).length;
const tooManyWords = () => new Error(`O nome da pasta pode ter no máximo ${MAX_FOLDER_WORDS} palavras.`);

export const isFolderSlug = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length <= 60;

export type ArquivoFolder = { slug: string; nome: string; cor: string | null; count: number; cover: string | null; updated_at: string };

export const FOLDER_COLORS = ['#e5b447', '#a12a82', '#3b82f6', '#22b573', '#ef4444', '#8b5cf6'];

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

async function readMeta(slug: string): Promise<{ nome: string; cor: string | null }> {
  const fallback = slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const { data } = await supabase().storage.from(BUCKET()).download(`${ARQUIVO_ROOT}/${slug}/_pasta.json`);
  if (data) {
    try {
      const j = JSON.parse(await data.text()) as { nome?: string; cor?: string };
      return { nome: String(j.nome || '').trim() || fallback, cor: j.cor && FOLDER_COLORS.includes(j.cor) ? j.cor : null };
    } catch { /* usa o nome derivado do slug */ }
  }
  return { nome: fallback, cor: null };
}

async function writeMeta(slug: string, meta: { nome: string; cor: string | null }, upsert: boolean) {
  const { error } = await supabase()
    .storage.from(BUCKET())
    .upload(`${ARQUIVO_ROOT}/${slug}/_pasta.json`, Buffer.from(JSON.stringify(meta)), { contentType: 'application/json', upsert });
  if (error) throw new Error(error.message);
}

export async function listFolders(): Promise<ArquivoFolder[]> {
  const dirs = (await list(ARQUIVO_ROOT)).filter((r) => r.id === null && isFolderSlug(r.name));
  const folders = await Promise.all(
    dirs.map(async (d): Promise<ArquivoFolder> => {
      const files = (await list(`${ARQUIVO_ROOT}/${d.name}`)).filter((r) => r.id && IMAGE.test(r.name));
      const cover = files[0] ? supabase().storage.from(BUCKET()).getPublicUrl(`${ARQUIVO_ROOT}/${d.name}/${files[0].name}`).data.publicUrl : null;
      const meta = await readMeta(d.name);
      return { slug: d.name, nome: meta.nome, cor: meta.cor, count: files.length, cover, updated_at: files[0]?.created_at ?? d.updated_at ?? '' };
    }),
  );
  return folders.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
}

export async function createFolder(nome: string): Promise<ArquivoFolder> {
  const clean = nome.trim().replace(/\s+/g, ' ').slice(0, 80);
  const slug = folderSlug(clean);
  if (!clean || !slug) throw new Error('Dê um nome à pasta.');
  if (wordCount(clean) > MAX_FOLDER_WORDS) throw tooManyWords();
  const existing = await list(ARQUIVO_ROOT);
  if (existing.some((r) => r.id === null && r.name === slug)) throw new Error('Já existe uma pasta com esse nome.');
  await writeMeta(slug, { nome: clean, cor: null }, false);
  return { slug, nome: clean, cor: null, count: 0, cover: null, updated_at: new Date().toISOString() };
}

/** Muda o nome visível e/ou a cor de destaque de uma pasta; a sua chave (slug) não muda. */
export async function updateFolder(slug: string, changes: { nome?: string; cor?: string | null }) {
  if (!isFolderSlug(slug) || !(await folderExists(slug))) throw new Error('Essa pasta não existe.');
  const meta = await readMeta(slug);
  if (changes.nome !== undefined) {
    const clean = changes.nome.trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!clean) throw new Error('Dê um nome à pasta.');
    if (wordCount(clean) > MAX_FOLDER_WORDS) throw tooManyWords();
    meta.nome = clean;
  }
  if (changes.cor !== undefined) {
    if (changes.cor !== null && !FOLDER_COLORS.includes(changes.cor)) throw new Error('Cor inválida.');
    meta.cor = changes.cor;
  }
  await writeMeta(slug, meta, true);
}

/** Elimina uma pasta vazia (com fotos dentro não: primeiro movem-se ou eliminam-se as fotos). */
export async function deleteFolder(slug: string) {
  if (!isFolderSlug(slug) || !(await folderExists(slug))) throw new Error('Essa pasta não existe.');
  const files = (await list(`${ARQUIVO_ROOT}/${slug}`)).filter((r) => r.id && r.name !== '_pasta.json');
  if (files.length > 0) throw new Error(`A pasta ainda tem ${files.length} ${files.length === 1 ? 'foto' : 'fotos'}. Mova-as ou elimine-as primeiro.`);
  const { error } = await supabase().storage.from(BUCKET()).remove([`${ARQUIVO_ROOT}/${slug}/_pasta.json`]);
  if (error) throw new Error(error.message);
}

/** Todas as fotos de uma pasta, com os bytes (para "Transferir pasta"). */
export async function folderFiles(slug: string): Promise<{ name: string; data: Uint8Array }[]> {
  if (!isFolderSlug(slug)) throw new Error('Pasta inválida.');
  const rows = (await list(`${ARQUIVO_ROOT}/${slug}`)).filter((r) => r.id && IMAGE.test(r.name));
  const out: { name: string; data: Uint8Array }[] = [];
  let total = 0;
  for (const r of rows) {
    const { data, error } = await supabase().storage.from(BUCKET()).download(`${ARQUIVO_ROOT}/${slug}/${r.name}`);
    if (error || !data) throw new Error(error?.message || 'Não foi possível ler uma foto.');
    const bytes = new Uint8Array(await data.arrayBuffer());
    total += bytes.length;
    if (total > 120 * 1024 * 1024) throw new Error('A pasta é grande demais para um único zip (máx. 120 MB). Descarregue por partes.');
    out.push({ name: r.name.replace(/^\d+-[a-z0-9]+-/, '') || r.name, data: bytes });
  }
  return out;
}

export async function folderExists(slug: string) {
  return isFolderSlug(slug) && (await list(ARQUIVO_ROOT)).some((r) => r.id === null && r.name === slug);
}

export type FolderPhoto = { leaf: string; nome: string; url: string; size: number };

/** Nome e fotos de uma pasta (para a página de partilha pública). */
export async function folderPhotos(slug: string): Promise<{ nome: string; fotos: FolderPhoto[] } | null> {
  if (!isFolderSlug(slug) || !(await folderExists(slug))) return null;
  const rows = (await list(`${ARQUIVO_ROOT}/${slug}`)).filter((r) => r.id && IMAGE.test(r.name));
  const fotos = rows.map((r) => ({
    leaf: r.name,
    nome: r.name.replace(/^\d+-[a-z0-9]+-/, '') || r.name,
    url: supabase().storage.from(BUCKET()).getPublicUrl(`${ARQUIVO_ROOT}/${slug}/${r.name}`).data.publicUrl,
    size: Number((r as { metadata?: { size?: number } }).metadata?.size ?? 0),
  }));
  return { nome: (await readMeta(slug)).nome, fotos };
}

/** Uma foto de uma pasta (bytes), para a descarga. Só aceita nomes de ficheiro que existem na pasta. */
export async function folderPhotoFile(slug: string, leaf: string): Promise<{ data: Uint8Array; type: string; nome: string } | null> {
  if (!isFolderSlug(slug) || !/^[\w.\-]+$/.test(leaf) || !IMAGE.test(leaf)) return null;
  const { data, error } = await supabase().storage.from(BUCKET()).download(`${ARQUIVO_ROOT}/${slug}/${leaf}`);
  if (error || !data) return null;
  return { data: new Uint8Array(await data.arrayBuffer()), type: data.type || 'image/jpeg', nome: leaf.replace(/^\d+-[a-z0-9]+-/, '') || leaf };
}
