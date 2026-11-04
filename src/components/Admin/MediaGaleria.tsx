'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import MediaGalleryView, { type MediaSource } from '@/components/Admin/MediaGalleryView';
import { useAuth } from '@/context/AuthContext';
import { type FolderInfo } from '@/components/Admin/ArquivoFolders';

const TABS: { id: MediaSource; label: string; short: string }[] = [
  { id: 'galeria', label: 'Galeria', short: 'Galeria' },
  { id: 'arquivo', label: 'Arquivo de fotos', short: 'Arquivo' },
  { id: 'partilhado', label: 'Fotos partilhadas', short: 'Partilhadas' },
];

/**
 * Galeria principal. Junto ao título há um selector para ver também o arquivo de fotos (por pasta) e as fotos
 * partilhadas. Com `?escolher=ID` (aberta pelo formulário da notícia) clicar numa foto devolve-a ao formulário.
 */
function GaleriaInner({ initialSource = 'galeria', initialPasta = '' }: { initialSource?: MediaSource; initialPasta?: string }) {
  const params = useSearchParams();
  const pickId = params.get('escolher');
  const [source, setSource] = useState<MediaSource>(initialSource);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [pasta, setPasta] = useState(initialPasta);
  const [done, setDone] = useState(false);
  const [zips, setZips] = useState<{ path: string; label: string }[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState('');
  const [unzipMsg, setUnzipMsg] = useState('');
  const { user } = useAuth();
  // As fotos partilhadas (e-mail da redacção) são só para administrador e editor.
  const canSeeShared = user?.role === 'admin' || user?.role === 'editor';

  useEffect(() => {
    if (source !== 'arquivo' || folders.length) return;
    fetch('/api/admin/arquivo', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => setFolders(b.folders ?? []))
      .catch(() => {});
  }, [source, folders.length]);

  // Zips de fotos partilhadas: aparecem no selector de tipo da galeria; escolher um descompacta-o e mostra as fotos.
  const loadZips = () => {
    fetch('/api/admin/partilhado?pasta=imagens', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => setZips((b.files ?? []).filter((f: { path: string }) => /\.zip$/i.test(f.path)).map((f: { path: string; name: string }) => ({ path: f.path, label: f.name }))))
      .catch(() => {});
  };
  useEffect(() => { if (source === 'partilhado') loadZips(); }, [source]);

  const unzip = async (path: string) => {
    setUnzipMsg('A descompactar…');
    try {
      const res = await fetch('/api/admin/partilhado/zip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ path }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao descompactar.');
      const prefix = /^(\d+-[\d_]+)-/.exec(path.split('/').pop() ?? '')?.[1] ?? '';
      setFilter(prefix ? `${prefix}-z` : '');
      setReloadKey((k) => k + 1);
      setUnzipMsg('');
    } catch (e) {
      setUnzipMsg(e instanceof Error ? e.message : 'Erro ao descompactar.');
    }
  };

  /** Fecha este separador e volta à notícia (se não o puder fechar, recua ou vai para a lista de notícias). */
  const backToNews = () => {
    window.close();
    setTimeout(() => { if (!window.closed) { if (history.length > 1) history.back(); else window.location.href = '/admin/noticias'; } }, 250);
  };

  const pick = pickId
    ? (url: string) => {
        const channel = new BroadcastChannel('ec-media-pick');
        channel.postMessage({ id: pickId, url });
        channel.close();
        setDone(true);
        window.close();
      }
    : undefined;

  if (done) {
    return (
      <div className="p-10 text-center text-[#2c3338]">
        <p className="text-lg font-semibold text-[#008f45]">Foto escolhida.</p>
        <p className="mt-1 text-sm text-[#50575e]">Já pode fechar este separador e voltar à notícia.</p>
      </div>
    );
  }

  const tabs = (
    <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2">
      {TABS.filter((t) => t.id !== 'partilhado' || canSeeShared).map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => { setSource(t.id); setPasta(''); }}
          className={`h-8 shrink-0 whitespace-nowrap rounded-[3px] border px-1.5 text-[10px] font-semibold sm:px-2 sm:text-xs 2xl:px-3 2xl:text-sm ${source === t.id ? 'border-[#00a651] bg-[#00a651] text-white' : 'border-[#ccd0d4] bg-white text-[#50575e] hover:bg-[#f6f7f7]'}`}
        >
          <span className="2xl:hidden">{t.short}</span>
          <span className="hidden 2xl:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      {pick && (
        <div className="flex items-center justify-between gap-3 bg-[#00a651] px-6 py-2 text-white">
          <span className="text-sm font-semibold">Escolher foto</span>
          <button type="button" onClick={backToNews} className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar à notícia
          </button>
        </div>
      )}
      {unzipMsg && <p role="status" className="px-6 pt-3 text-sm text-[#50575e]">{unzipMsg}</p>}
      <MediaGalleryView
        key={`${source}:${pasta}:${reloadKey}`}
        source={source}
        pasta={pasta}
        pick={pick}
        reloadKey={reloadKey}
        initialQuery={filter}
        zipOptions={source === 'partilhado' ? zips : undefined}
        onPickZip={unzip}
        folders={source === 'arquivo' && !pasta ? folders : undefined}
        onOpenFolder={setPasta}
        tabsRow={
          <>
            {tabs}
          </>
        }
      />
    </>
  );
}

/** A galeria principal, com selector Galeria | Arquivo de fotos | Fotos partilhadas. Pode abrir já numa origem/pasta. */
export default function MediaGaleria(props: { initialSource?: MediaSource; initialPasta?: string }) {
  return (
    <Suspense fallback={null}>
      <GaleriaInner {...props} />
    </Suspense>
  );
}
