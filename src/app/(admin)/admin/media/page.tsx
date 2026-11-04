'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import MediaGalleryView, { type MediaSource } from '@/components/Admin/MediaGalleryView';
import ArquivoFolders, { type FolderInfo } from '@/components/Admin/ArquivoFolders';

const TABS: { id: MediaSource; label: string }[] = [
  { id: 'galeria', label: 'Galeria' },
  { id: 'arquivo', label: 'Arquivo de fotos' },
  { id: 'partilhado', label: 'Fotos partilhadas' },
];

/**
 * Galeria principal. Em baixo do título há um selector para ver também o arquivo de fotos (por pasta) e as fotos
 * partilhadas. Com `?escolher=ID` (aberta pelo formulário da notícia) clicar numa foto devolve-a ao formulário.
 */
function GaleriaPage() {
  const params = useSearchParams();
  const pickId = params.get('escolher');
  const [source, setSource] = useState<MediaSource>('galeria');
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [pasta, setPasta] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (source !== 'arquivo' || folders.length) return;
    fetch('/api/admin/arquivo', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => setFolders(b.folders ?? []))
      .catch(() => {});
  }, [source, folders.length]);

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
    <div className="flex flex-wrap items-center gap-1">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => { setSource(t.id); setPasta(''); }}
          className={`h-8 rounded-[3px] border px-3 text-sm font-semibold ${source === t.id ? 'border-[#00a651] bg-[#00a651] text-white' : 'border-[#ccd0d4] bg-white text-[#50575e] hover:bg-[#f6f7f7]'}`}
        >
          {t.label}
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
      {source === 'arquivo' && !pasta ? (
        <div className="p-6">
          <div className="mb-4">{tabs}</div>
          {folders.length === 0 ? (
            <p className="text-sm text-[#50575e]">Ainda não há pastas no arquivo. Crie uma em “Arquivo de fotos”.</p>
          ) : (
            <ArquivoFolders folders={folders} onOpen={setPasta} />
          )}
        </div>
      ) : (
        <MediaGalleryView
          key={`${source}:${pasta}`}
          source={source}
          pasta={pasta}
          pick={pick}
          title={pick ? 'Escolher foto' : 'Biblioteca multimédia'}
          headerExtra={
            <>
              {source === 'arquivo' && (
                <button type="button" onClick={() => setPasta('')} className="inline-flex h-8 items-center gap-1 rounded-[3px] border border-[#ccd0d4] bg-white px-2 text-sm font-semibold text-[#008f45] hover:bg-[#f6f7f7]">
                  <ChevronLeft className="h-4 w-4" /> Todas as pastas
                </button>
              )}
              {tabs}
            </>
          }
        />
      )}
    </>
  );
}

export default function MediaPage() {
  return (
    <Suspense fallback={null}>
      <GaleriaPage />
    </Suspense>
  );
}
