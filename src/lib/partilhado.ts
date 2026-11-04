import { createClient } from '@supabase/supabase-js';
import { classify, FOLDERS, type FolderId } from '@/lib/partilhado-tipos';
import { antivirusConfigured, scanBuffer } from '@/lib/antivirus';
import { downloadMailFile, listMailFiles, mailConfigured, optimizeImage } from '@/lib/redaccao-mail';
import { extractZip, inspectZip, zipFolder } from '@/lib/zip-partilhado';

const supabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const ROOT = 'partilhado';

const slug = (name: string) =>
  name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'ficheiro';

export type SharedFile = { name: string; path: string; url: string; size: number; created_at: string; mime: string };

type Row = { name: string; id: string | null; created_at?: string; metadata?: { size?: number; mimetype?: string } | null };

async function listFolderRows(folder: FolderId): Promise<Row[]> {
  const out: Row[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase().storage.from(BUCKET()).list(`${ROOT}/${folder}`, { limit: 1000, offset, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) throw new Error(error.message);
    const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.id && r.name !== '.emptyFolderPlaceholder');
    out.push(...rows);
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function listFolder(folder: FolderId): Promise<SharedFile[]> {
  const rows = await listFolderRows(folder);
  return rows.map((r) => {
    const path = `${ROOT}/${folder}/${r.name}`;
    return {
      name: r.name.replace(/^\d+-[\d_]+-(z\d+-)?/, ''),
      path,
      url: supabase().storage.from(BUCKET()).getPublicUrl(path).data.publicUrl,
      size: r.metadata?.size ?? 0,
      created_at: r.created_at ?? '',
      mime: r.metadata?.mimetype ?? '',
    };
  });
}

export async function countFolders(): Promise<Record<FolderId, number>> {
  const entries = await Promise.all((Object.keys(FOLDERS) as FolderId[]).map(async (f) => [f, (await listFolderRows(f)).length] as const));
  return Object.fromEntries(entries) as Record<FolderId, number>;
}

export type SyncResult = {
  configured: boolean;
  antivirus: boolean;
  scanned: number;
  imported: number;
  skipped: number;
  failed: number;
  /** Apanhados pelo antivírus: não são guardados. */
  infected: number;
  /** Retidos por não haver antivírus configurado (só as fotos, que são recodificadas, passam sem análise). */
  held: number;
  byFolder: Record<string, number>;
  remaining: number;
};

const keyOf = (uid: number, part: string) => `${uid}-${part.replace(/\./g, '_')}`;
const extOf = (name: string) => (name.split('.').pop() || 'bin').toLowerCase();
const mimeOfImage = (ext: string) => `image/${ext === 'jpg' ? 'jpeg' : ext}`;

async function putFile(path: string, body: Buffer | Uint8Array, contentType: string) {
  const { error } = await supabase().storage.from(BUCKET()).upload(path, body, { contentType, upsert: false, cacheControl: '31536000' });
  if (error && !/exists|duplicate/i.test(error.message)) throw new Error(error.message);
}

/**
 * Lê a caixa da redacção (só leitura) e arruma cada anexo novo na pasta do seu tipo:
 * um zip de fotos vai para Imagens, um zip de PDF para PDF, os outros para Arquivos ZIP.
 * Cada ficheiro passa pelo antivírus (ClamAV) antes de ser guardado.
 * Em cada corrida trata no máximo `limit` ficheiros (as funções do servidor têm tempo limitado).
 */
export async function syncMailbox(limit = 15): Promise<SyncResult> {
  const av = antivirusConfigured();
  const result: SyncResult = { configured: mailConfigured(), antivirus: av, scanned: 0, imported: 0, skipped: 0, failed: 0, infected: 0, held: 0, byFolder: {}, remaining: 0 };
  if (!result.configured) return result;

  const known = new Set<string>();
  for (const f of Object.keys(FOLDERS) as FolderId[]) {
    (await listFolderRows(f)).forEach((r) => known.add(r.name.split('-').slice(0, 2).join('-')));
  }

  const pending: { uid: number; part: string; folder: FolderId }[] = [];
  for (const m of await listMailFiles()) {
    for (const file of m.files) {
      result.scanned += 1;
      const folder = classify(file.contentType, file.filename);
      if (!folder || known.has(keyOf(m.uid, file.part))) { result.skipped += 1; continue; }
      pending.push({ uid: m.uid, part: file.part, folder });
    }
  }
  result.remaining = Math.max(0, pending.length - limit);

  for (const { uid, part, folder } of pending.slice(0, limit)) {
    try {
      const file = await downloadMailFile(uid, part);
      const ext = extOf(file.filename);

      if (folder !== 'imagens' && !av && !process.env.ANTIVIRUS_OPCIONAL) { result.held += 1; continue; }
      if (av) {
        const scan = await scanBuffer(file.buffer);
        if (scan.status === 'infected') { console.warn(`Partilhado: ${file.filename} (e-mail ${uid}) bloqueado: ${scan.signature}`); result.infected += 1; continue; }
        if (scan.status === 'unavailable') throw new Error(`antivírus indisponível: ${scan.reason}`);
      }

      let target: FolderId = folder;
      let body: Buffer = file.buffer;
      let contentType = file.contentType;
      let outExt = ext;
      if (folder === 'imagens') {
        const opt = await optimizeImage(file.buffer, file.contentType.startsWith('image/') ? file.contentType : mimeOfImage(ext));
        body = opt.buffer; contentType = opt.contentType; outExt = opt.ext;
      } else if (folder === 'zip' && ext === 'zip') {
        target = zipFolder(inspectZip(file.buffer)); // zip de fotos → Imagens, zip de PDF → PDF…
        contentType = 'application/zip';
      }
      await putFile(`${ROOT}/${target}/${keyOf(uid, part)}-${slug(file.filename)}.${outExt}`, body, contentType);
      result.imported += 1;
      result.byFolder[target] = (result.byFolder[target] ?? 0) + 1;
    } catch (err) {
      console.error('Partilhado: falhou o anexo', uid, part, err instanceof Error ? err.message : err);
      result.failed += 1;
    }
  }
  return result;
}

const safePath = (p: string) => /^partilhado\/(imagens|pdf|zip|documentos)\/[^/]+\.zip$/i.test(p);

async function downloadStored(path: string) {
  if (!safePath(path)) throw new Error('Caminho inválido.');
  const { data, error } = await supabase().storage.from(BUCKET()).download(path);
  if (error || !data) throw new Error(error?.message || 'Zip não encontrado.');
  return new Uint8Array(await data.arrayBuffer());
}

/** Conteúdo de um zip guardado (para o "Abrir"). */
export async function openStoredZip(path: string) {
  return inspectZip(await downloadStored(path));
}

/** "Descompactar": põe cada foto/PDF/documento do zip, já arrumado, na pasta do seu tipo. */
export async function unzipStored(path: string): Promise<{ extracted: number; byFolder: Record<string, number> }> {
  const entries = extractZip(await downloadStored(path));
  const base = path.split('/').pop()!.replace(/\.zip$/i, '');
  const src = /^(\d+-[\d_]+)-/.exec(base)?.[1] ?? `0-${Date.now()}`;
  const byFolder: Record<string, number> = {};
  let n = 0;
  for (const e of entries) {
    n += 1;
    const leaf = e.name.split('/').pop() || e.name;
    const ext = extOf(leaf);
    let body: Buffer | Uint8Array = e.data;
    let contentType = ext === 'pdf' ? 'application/pdf' : 'application/octet-stream';
    let outExt = ext;
    if (e.folder === 'imagens') {
      const opt = await optimizeImage(Buffer.from(e.data), mimeOfImage(ext));
      body = opt.buffer; contentType = opt.contentType; outExt = opt.ext;
    }
    await putFile(`${ROOT}/${e.folder}/${src}-z${n}-${slug(leaf)}.${outExt}`, body, contentType);
    byFolder[e.folder] = (byFolder[e.folder] ?? 0) + 1;
  }
  return { extracted: entries.length, byFolder };
}
