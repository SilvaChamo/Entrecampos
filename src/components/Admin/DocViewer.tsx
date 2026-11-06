'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

type Props = { name: string; path: string; onClose: () => void };

type View = { kind: 'frame'; src: string } | { kind: 'html'; html: string } | { kind: 'text'; text: string } | { kind: 'table'; rows: unknown[][] } | { kind: 'none' };

/** O ficheiro passa pelo próprio painel (mesma origem): abre inline ou baixa com `download=1`. */
const fileUrl = (path: string, download = false) => `/api/admin/partilhado/file?path=${encodeURIComponent(path)}${download ? '&download=1' : ''}`;

/** Abre um documento dentro do painel (PDF, Word, Excel, texto); descarregar é uma opção à parte. */
export default function DocViewer({ name, path, onClose }: Props) {
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState('');
  const ext = (name.split('.').pop() || '').toLowerCase();

  useEffect(() => {
    let alive = true;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);

    (async () => {
      try {
        if (ext === 'pdf') return alive && setView({ kind: 'frame', src: fileUrl(path) });
        const res = await fetch(fileUrl(path));
        if (!res.ok) throw new Error('Não foi possível ler o ficheiro.');
        if (['txt', 'md', 'csv', 'json', 'log'].includes(ext)) return alive && setView({ kind: 'text', text: await res.text() });
        if (['docx'].includes(ext)) {
          const mammoth = await import('mammoth/mammoth.browser');
          const { value } = await mammoth.convertToHtml({ arrayBuffer: await res.arrayBuffer() });
          return alive && setView({ kind: 'html', html: value });
        }
        if (ext === 'xlsx') {
          const { readSheet } = await import('read-excel-file/browser');
          return alive && setView({ kind: 'table', rows: (await readSheet(await res.blob())) as unknown[][] });
        }
        if (alive) setView({ kind: 'none' });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Não foi possível abrir o ficheiro.');
      }
    })();

    return () => {
      alive = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [path, ext, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div role="dialog" aria-label={name} className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#ccd0d4] px-4 py-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1d2327]">{name}</span>
          <a href={fileUrl(path, true)} className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-[#ccd0d4] bg-white px-3 text-sm text-[#2c3338] hover:bg-[#f6f7f7]">
            <Download className="h-3.5 w-3.5" /> Descarregar
          </a>
          <button type="button" onClick={onClose} aria-label="Fechar" className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] hover:bg-[#f6f7f7]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-[#f6f7f7]">
          {error ? (
            <p className="p-6 text-sm text-[#d63638]">{error}</p>
          ) : !view ? (
            <div className="flex justify-center py-20"><Spinner /></div>
          ) : view.kind === 'frame' ? (
            <iframe title={name} src={view.src} className="h-full w-full border-0 bg-white" />
          ) : view.kind === 'html' ? (
            // Sem scripts: o conteúdo vem de e-mails externos, por isso corre isolado.
            <iframe title={name} sandbox="" srcDoc={`<style>body{font:15px/1.6 system-ui,sans-serif;padding:24px;max-width:820px;margin:auto;color:#222}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 8px}img{max-width:100%}</style>${view.html}`} className="h-full w-full border-0 bg-white" />
          ) : view.kind === 'text' ? (
            <pre className="whitespace-pre-wrap break-words p-6 text-sm text-[#2c3338]">{view.text}</pre>
          ) : view.kind === 'table' ? (
            <table className="m-4 border-collapse bg-white text-sm">
              <tbody>
                {view.rows.map((row, i) => (
                  <tr key={i}>{row.map((cell, j) => <td key={j} className="border border-[#ccd0d4] px-2 py-1">{cell == null ? '' : String(cell)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-sm text-[#50575e]">Este formato não tem pré-visualização no painel. Use “Descarregar” para o abrir no computador.</p>
          )}
        </div>
      </div>
    </div>
  );
}
