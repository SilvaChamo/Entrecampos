/** Pastas do menu Partilhado: cada anexo recebido por e-mail vai directamente para a sua. */
export const FOLDERS = {
  imagens: { label: 'Imagens', hint: 'Fotografias e gráficos' },
  pdf: { label: 'PDF', hint: 'Documentos em PDF' },
  zip: { label: 'Arquivos ZIP', hint: 'Zip, RAR, 7z' },
  documentos: { label: 'Documentos', hint: 'Word, Excel, PowerPoint, texto' },
} as const;
export type FolderId = keyof typeof FOLDERS;
export const isFolder = (v: string): v is FolderId => v in FOLDERS;

const DOC_EXT = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'txt', 'csv', 'rtf'];
const ZIP_EXT = ['zip', 'rar', '7z', 'gz', 'tar'];
const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

/** Decide a pasta pelo tipo e pela extensão (muitos e-mails mandam tudo como octet-stream). Executáveis ficam de fora. */
export function classify(contentType: string, filename: string): FolderId | null {
  const type = contentType.toLowerCase();
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (IMG_EXT.includes(ext) || (type.startsWith('image/') && IMG_EXT.includes(type.split('/')[1]))) return 'imagens';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (ZIP_EXT.includes(ext)) return 'zip';
  if (DOC_EXT.includes(ext)) return 'documentos';
  return null;
}
