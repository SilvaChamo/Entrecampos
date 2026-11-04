import { unzipSync } from 'fflate';
import { classify, type FolderId } from '@/lib/partilhado-tipos';

export type ZipEntry = { name: string; size: number; folder: FolderId | null };

const MAX_ENTRIES = 500;
const MAX_TOTAL = 300 * 1024 * 1024; // protege de "bombas zip"
export const MAX_ENTRY = 25 * 1024 * 1024;

const junk = (name: string) => name.endsWith('/') || name.startsWith('__MACOSX/') || /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/i.test(name);

/** Lista o conteúdo do zip sem o descompactar. Lança erro se estiver corrompido ou for perigoso (demasiado grande). */
export function inspectZip(data: Uint8Array): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let total = 0;
  unzipSync(data, {
    filter: (file) => {
      if (!junk(file.name)) {
        total += file.originalSize;
        entries.push({ name: file.name, size: file.originalSize, folder: classify('', file.name) });
        if (entries.length > MAX_ENTRIES) throw new Error('O zip tem ficheiros a mais.');
        if (total > MAX_TOTAL) throw new Error('O zip é demasiado grande depois de descompactado.');
      }
      return false;
    },
  });
  return entries;
}

/** Pasta onde o zip fica: a do conteúdo, se este for maioritariamente fotos, PDF ou documentos; senão a dos ZIP. */
export function zipFolder(entries: ZipEntry[]): FolderId {
  const typed = entries.filter((e) => e.folder);
  if (!typed.length) return 'zip';
  for (const folder of ['imagens', 'pdf', 'documentos'] as const) {
    if (typed.filter((e) => e.folder === folder).length / typed.length >= 0.6) return folder;
  }
  return 'zip';
}

/** Descompacta só os ficheiros que têm pasta (fotos, PDF, documentos), até ao limite por ficheiro. */
export function extractZip(data: Uint8Array): { name: string; data: Uint8Array; folder: FolderId }[] {
  const wanted = new Map<string, FolderId>();
  inspectZip(data).forEach((e) => {
    if (e.folder && e.folder !== 'zip' && e.size <= MAX_ENTRY) wanted.set(e.name, e.folder);
  });
  const files = unzipSync(data, { filter: (file) => wanted.has(file.name) });
  return Object.entries(files).map(([name, bytes]) => ({ name, data: bytes, folder: wanted.get(name)! }));
}
