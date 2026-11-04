'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Archive, ChevronLeft, Download, PackageOpen } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import MediaGalleryView from '@/components/Admin/MediaGalleryView';

type SharedFile = { name: string; path: string; url: string; size: number; created_at: string; mime: string };

const LABELS: Record<string, string> = { imagens: 'Imagens', pdf: 'PDF', zip: 'Arquivos ZIP', documentos: 'Documentos' };
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const isZip = (f: SharedFile) => /\.zip$/i.test(f.path);

/** Um zip: “Descompactar” tira as fotos e mostra-as logo na página, no formato da galeria. */
function ZipRow({ file, onUnzipped }: { file: SharedFile; onUnzipped: (prefix: string, summary: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const unzip = async () => {
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/admin/partilhado/zip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: file.path }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao descompactar.');
      const where = Object.entries(json.byFolder as Record<string, number>).map(([k, v]) => `${v} em ${LABELS[k] ?? k}`).join(', ');
      const summary = `${json.extracted} ficheiro(s) descompactado(s)${where ? `: ${where}` : ''}.`;
      setMsg(summary);
      const src = /^(\d+-[\d_]+)-/.exec(file.path.split('/').pop() ?? '')?.[1] ?? '';
      onUnzipped(src ? `${src}-z` : '', summary);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro ao descompactar.'); }
    finally { setBusy(false); }
  };

  return (
    <li className="px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Archive className="h-5 w-5 shrink-0 text-[#00a651]" />
          <div className="min-w-0">
            <p className="truncate font-medium">{file.name}</p>
            <p className="text-xs text-[#50575e]">{kb(file.size)} · {file.created_at ? new Date(file.created_at).toLocaleString('pt-PT') : ''}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={unzip} disabled={busy} className="inline-flex items-center gap-1 rounded-[3px] bg-[#00a651] px-2 py-1 font-semibold text-white disabled:opacity-60"><PackageOpen className="h-3.5 w-3.5" /> {busy ? 'A descompactar…' : 'Descompactar'}</button>
          <a href={file.url} download className="inline-flex items-center gap-1 rounded-[3px] border border-[#00a651] px-2 py-1 text-[#008f45] hover:bg-[#f6f7f7]" title="Descarregar o zip"><Download className="h-3.5 w-3.5" /></a>
        </div>
      </div>
      {msg && <p className="mt-2 text-xs text-[#50575e]">{msg}</p>}
    </li>
  );
}

export default function PastaPage({ params }: { params: Promise<{ pasta: string }> }) {
  const { pasta } = use(params);
  const [files, setFiles] = useState<SharedFile[] | null>(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState('');
  const [unzipNote, setUnzipNote] = useState('');

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

  const [unzipping, setUnzipping] = useState(false);

  /** Escolhido no selector da galeria: descompacta o zip e mostra logo as suas fotos na página. */
  const unzipFromSelector = async (path: string) => {
    setUnzipping(true);
    setUnzipNote('');
    try {
      const res = await fetch('/api/admin/partilhado/zip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao descompactar.');
      const src = /^(\d+-[\d_]+)-/.exec(path.split('/').pop() ?? '')?.[1] ?? '';
      setUnzipNote(`${json.extracted} foto(s) do zip.`);
      setFilter(src ? `${src}-z` : '');
      setReloadKey((k) => k + 1);
      load();
    } catch (e) {
      setUnzipNote(e instanceof Error ? e.message : 'Erro ao descompactar.');
    } finally {
      setUnzipping(false);
    }
  };

  const zips = (files ?? []).filter(isZip);
  const others = (files ?? []).filter((f) => !isZip(f));

  return (
    <div className="min-h-screen p-6 text-[#2c3338]">
      <Link href="/admin/partilhado" className="mb-3 inline-flex items-center gap-1 text-sm text-[#008f45] hover:underline">
        <ChevronLeft className="h-4 w-4" /> Arquivo de fotos
      </Link>
      {pasta !== 'imagens' && <h1 className="mb-4 text-2xl font-normal">{LABELS[pasta] ?? pasta}</h1>}
      {error && <div className="rounded border border-[#d63638] bg-white p-3 text-sm text-[#d63638]">{error}</div>}
      {!files && !error && <div className="flex justify-center py-20"><Spinner /></div>}
      {files && files.length === 0 && pasta !== 'imagens' && <p className="py-10 text-center text-sm text-[#50575e]">Esta pasta ainda está vazia. Use “Sincronizar agora” na página Partilhado.</p>}

      {zips.length > 0 && pasta !== 'imagens' && (
        <>
          <h2 className="mb-2 text-sm font-semibold">Pacotes ZIP</h2>
          <ul className="mb-6 divide-y divide-[#ccd0d4] rounded border border-[#ccd0d4] bg-white">
            {zips.map((f) => <ZipRow key={f.path} file={f} onUnzipped={(prefix, summary) => { setFilter(prefix); setUnzipNote(summary); setReloadKey((k) => k + 1); load(); }} />)}
          </ul>
        </>
      )}

      {pasta === 'imagens' && (
        <>
          {unzipping && <p role="status" className="mb-2 text-sm font-semibold text-[#008f45]">A descompactar…</p>}
          {filter && !unzipping && (
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded border border-[#00a651] bg-white p-3 text-sm">
              <span>{unzipNote} A mostrar só as fotos desse zip.</span>
              <button onClick={() => { setFilter(''); setReloadKey((k) => k + 1); }} className="font-semibold text-[#008f45] hover:underline">Ver todas as fotos partilhadas</button>
            </div>
          )}
          <MediaGalleryView
            source="partilhado"
            title="Fotos partilhadas"
            embedded
            reloadKey={reloadKey}
            initialQuery={filter}
            zipOptions={zips.map((z) => ({ path: z.path, label: z.name }))}
            onPickZip={unzipFromSelector}
          />
        </>
      )}

      {others.length > 0 && pasta !== 'imagens' && (
        <ul className="divide-y divide-[#ccd0d4] rounded border border-[#ccd0d4] bg-white">
          {others.map((f) => (
            <li key={f.path} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{f.name}</p>
                <p className="text-xs text-[#50575e]">{kb(f.size)} · {f.created_at ? new Date(f.created_at).toLocaleString('pt-PT') : ''}</p>
              </div>
              <a href={f.url} target="_blank" rel="noreferrer" download className="inline-flex shrink-0 items-center gap-1 rounded-[3px] border border-[#00a651] px-2 py-1 text-[#008f45] hover:bg-[#f6f7f7]">
                <Download className="h-3.5 w-3.5" /> Descarregar
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
