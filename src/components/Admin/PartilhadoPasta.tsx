'use client';

import { useCallback, useEffect, useState } from 'react';
import { File as FileIcon, FileArchive, FileSpreadsheet, FileText, Presentation } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import MediaGaleria from '@/components/Admin/MediaGaleria';
import DocViewer from '@/components/Admin/DocViewer';

type SharedFile = { name: string; path: string; url: string; size: number; created_at: string; mime: string };

const LABELS: Record<string, string> = { imagens: 'Imagens', pdf: 'PDF', zip: 'Arquivos ZIP', documentos: 'Documentos' };
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const isZip = (f: SharedFile) => /\.zip$/i.test(f.path);

/** Conteúdo de uma pasta partilhada: as imagens são a galeria do painel; as outras pastas são listas de ficheiros. Mostra-se onde for pedido. */
export default function PartilhadoPasta({ pasta, withTitle = false, bin = false }: { pasta: string; withTitle?: boolean; bin?: boolean }) {
  if (pasta === 'imagens') return <MediaGaleria initialSource="partilhado" embedded bare binMode={bin} />;
  return <ListaPasta pasta={pasta} withTitle={withTitle} />;
}

/** Formato do documento: ícone, cor e a extensão em letras pequenas. */
function formatOf(name: string): { ext: string; color: string; Icon: LucideIcon } {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return { ext, color: '#d63638', Icon: FileText };
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return { ext, color: '#2271b1', Icon: FileText };
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return { ext, color: '#1e8e4f', Icon: FileSpreadsheet };
  if (['ppt', 'pptx', 'odp'].includes(ext)) return { ext, color: '#d97706', Icon: Presentation };
  if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return { ext, color: '#00a651', Icon: FileArchive };
  if (ext === 'txt') return { ext, color: '#50575e', Icon: FileText };
  return { ext, color: '#50575e', Icon: FileIcon };
}

/** Ícone de ficheiro PDF (página com faixa vermelha, como o do Adobe Acrobat). */
function PdfIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <path d="M7 2h13l6 6v22H7z" fill="#fff" stroke="#8c8f94" strokeWidth="1" />
      <path d="M20 2v6h6" fill="#f0f0f1" stroke="#8c8f94" strokeWidth="1" />
      <rect x="3" y="14" width="22" height="10" rx="1.5" fill="#d63638" />
      <text x="14" y="21.8" textAnchor="middle" fontSize="7.5" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif" fill="#fff">PDF</text>
    </svg>
  );
}

const CARD = 'group relative flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded border border-[#ccd0d4] bg-white p-1.5 text-center transition hover:border-[#00a651]';

/** Cartão pequeno de um documento (abre-o dentro do painel; descarregar fica no visualizador). */
function DocCard({ file }: { file: SharedFile }) {
  const { ext, color, Icon } = formatOf(file.name);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
    <button type="button" onClick={() => setOpen(true)} title={`${file.name} · ${kb(file.size)}${file.created_at ? ` · ${new Date(file.created_at).toLocaleDateString('pt-PT')}` : ''}`} className={CARD}>
      {ext === 'pdf' ? <PdfIcon /> : <Icon className="h-8 w-8" style={{ color }} strokeWidth={1.5} aria-hidden="true" />}
      {ext !== 'pdf' && <span className="rounded-[2px] px-1 text-[8px] font-bold uppercase leading-4 text-white" style={{ backgroundColor: color }}>{ext || 'ficheiro'}</span>}
      <span className="line-clamp-2 w-full break-words text-[10px] leading-tight text-[#2c3338]">{file.name}</span>
      <span className="text-[9px] leading-none text-[#8c8f94]">{kb(file.size)}</span>
    </button>
    {open && <DocViewer name={file.name} path={file.path} onClose={close} />}
    </>
  );
}

/** Cartão pequeno de um zip: clicar descompacta (as fotos vão para as Imagens) e o estado aparece dentro do cartão. */
function ZipCard({ file, onDone }: { file: SharedFile; onDone: () => void }) {
  const [status, setStatus] = useState('');
  const { color, Icon } = formatOf(file.name);

  const unzip = async () => {
    setStatus('A descompactar…');
    try {
      const res = await fetch('/api/admin/partilhado/zip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: file.path }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao descompactar.');
      setStatus(`${json.extracted} ficheiro(s) em Imagens`);
      onDone();
    } catch (e) {
      setStatus(`Erro: ${e instanceof Error ? e.message : 'não foi possível descompactar.'}`);
    }
    setTimeout(() => setStatus(''), 8000);
  };

  return (
    <button type="button" onClick={unzip} aria-label={`Abrir o zip ${file.name}`} className={CARD}>
      <Icon className={`h-8 w-8 ${status === 'A descompactar…' ? 'animate-pulse' : ''}`} style={{ color }} strokeWidth={1.5} aria-hidden="true" />
      <span className="rounded-[2px] px-1 text-[8px] font-bold uppercase leading-4 text-white" style={{ backgroundColor: color }}>zip</span>
      <span className="line-clamp-2 w-full break-words text-[10px] leading-tight text-[#2c3338]">{file.name}</span>
      <span role={status ? 'status' : undefined} className={`w-full truncate text-[9px] leading-none ${status.startsWith('Erro') ? 'text-[#d63638]' : status ? 'text-[#008f45]' : 'text-[#8c8f94]'}`}>{status || kb(file.size)}</span>
    </button>
  );
}

function ListaPasta({ pasta, withTitle }: { pasta: string; withTitle: boolean }) {
  const [files, setFiles] = useState<SharedFile[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetch(`/api/admin/partilhado?pasta=${encodeURIComponent(pasta)}`, { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Erro ao ler a pasta.');
        setFiles(json.files);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao ler a pasta.'));
  }, [pasta]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="text-[#2c3338]">
      {withTitle && <h1 className="mb-4 text-2xl font-normal">{LABELS[pasta] ?? pasta}</h1>}
      {error && <div className="rounded border border-[#d63638] bg-white p-3 text-sm text-[#d63638]">{error}</div>}
      {!files && !error && <div className="flex min-h-[calc(100vh-160px)] items-center justify-center"><Spinner /></div>}
      {files && files.length === 0 && <p className="py-10 text-center text-sm text-[#50575e]">Esta pasta ainda está vazia. Use “Sincronizar agora” na página Partilhado.</p>}

      {files && files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 min-[1680px]:grid-cols-7 gap-2">
          {files.map((f) => (isZip(f) ? <ZipCard key={f.path} file={f} onDone={load} /> : <DocCard key={f.path} file={f} />))}
        </div>
      )}
    </div>
  );
}
