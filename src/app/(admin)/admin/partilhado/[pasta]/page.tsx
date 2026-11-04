'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Archive, ChevronLeft, Download, FolderOpen, PackageOpen } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

type SharedFile = { name: string; path: string; url: string; size: number; created_at: string; mime: string };

const LABELS: Record<string, string> = { imagens: 'Imagens', pdf: 'PDF', zip: 'Arquivos ZIP', documentos: 'Documentos' };
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

type ZipEntry = { name: string; size: number; folder: string | null };

const isZip = (f: SharedFile) => /\.zip$/i.test(f.path);

/** Um zip: “Abrir” mostra o que tem lá dentro; “Descompactar” põe cada ficheiro na pasta do seu tipo. */
function ZipRow({ file, onDone }: { file: SharedFile; onDone: () => void }) {
  const [entries, setEntries] = useState<ZipEntry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const open = async () => {
    if (entries) return setEntries(null);
    setBusy(true); setMsg('');
    try {
      const res = await fetch(`/api/admin/partilhado/zip?path=${encodeURIComponent(file.path)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao abrir o zip.');
      setEntries(json.entries);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro ao abrir o zip.'); }
    finally { setBusy(false); }
  };

  const unzip = async () => {
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/admin/partilhado/zip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: file.path }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao descompactar.');
      const where = Object.entries(json.byFolder as Record<string, number>).map(([k, v]) => `${v} em ${LABELS[k] ?? k}`).join(', ');
      setMsg(`${json.extracted} ficheiro(s) descompactado(s)${where ? `: ${where}` : ''}.`);
      onDone();
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
          <button onClick={open} disabled={busy} className="inline-flex items-center gap-1 rounded-[3px] border border-[#ccd0d4] px-2 py-1 hover:bg-[#f6f7f7]"><FolderOpen className="h-3.5 w-3.5" /> {entries ? 'Fechar' : 'Abrir'}</button>
          <button onClick={unzip} disabled={busy} className="inline-flex items-center gap-1 rounded-[3px] bg-[#00a651] px-2 py-1 font-semibold text-white disabled:opacity-60"><PackageOpen className="h-3.5 w-3.5" /> {busy ? 'A trabalhar…' : 'Descompactar'}</button>
          <a href={file.url} download className="inline-flex items-center gap-1 rounded-[3px] border border-[#00a651] px-2 py-1 text-[#008f45] hover:bg-[#f6f7f7]"><Download className="h-3.5 w-3.5" /></a>
        </div>
      </div>
      {msg && <p className="mt-2 text-xs text-[#50575e]">{msg}</p>}
      {entries && (
        <ul className="mt-2 max-h-56 overflow-auto rounded border border-[#e2e4e7] bg-[#f6f7f7] p-2 text-xs">
          {entries.length === 0 && <li>O zip está vazio.</li>}
          {entries.map((e) => (
            <li key={e.name} className="flex justify-between gap-2 py-0.5"><span className="truncate">{e.name}</span><span className="shrink-0 text-[#50575e]">{e.folder ? LABELS[e.folder] ?? e.folder : 'ignorado'} · {kb(e.size)}</span></li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function PastaPage({ params }: { params: Promise<{ pasta: string }> }) {
  const { pasta } = use(params);
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

  const zips = (files ?? []).filter(isZip);
  const others = (files ?? []).filter((f) => !isZip(f));

  return (
    <div className="min-h-screen p-6 text-[#2c3338]">
      <Link href="/admin/partilhado" className="mb-3 inline-flex items-center gap-1 text-sm text-[#008f45] hover:underline">
        <ChevronLeft className="h-4 w-4" /> Partilhado
      </Link>
      <h1 className="mb-4 text-2xl font-normal">{LABELS[pasta] ?? pasta}</h1>
      {error && <div className="rounded border border-[#d63638] bg-white p-3 text-sm text-[#d63638]">{error}</div>}
      {!files && !error && <div className="flex justify-center py-20"><Spinner /></div>}
      {files && files.length === 0 && <p className="py-10 text-center text-sm text-[#50575e]">Esta pasta ainda está vazia. Use “Sincronizar agora” na página Partilhado.</p>}

      {zips.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold">Pacotes ZIP</h2>
          <ul className="mb-6 divide-y divide-[#ccd0d4] rounded border border-[#ccd0d4] bg-white">
            {zips.map((f) => <ZipRow key={f.path} file={f} onDone={load} />)}
          </ul>
        </>
      )}

      {others.length > 0 && pasta === 'imagens' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {others.map((f) => (
            <a key={f.path} href={f.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded border border-[#ccd0d4] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.name} loading="lazy" className="aspect-square w-full object-cover" />
              <p className="truncate px-2 py-1 text-[11px]" title={f.name}>{f.name}</p>
            </a>
          ))}
        </div>
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
