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
  { id: 'partilhado', label: 'Arquivos partilhados', short: 'Partilhados' },
];

/**
 * Galeria principal. Junto ao título há um selector para ver também o arquivo de fotos (por pasta) e as fotos
 * partilhadas. Com `?escolher=ID` (aberta pelo formulário da notícia) clicar numa foto devolve-a ao formulário.
 */
function GaleriaInner({ initialSource = 'galeria', initialPasta = '', embedded, uploadHere, bare, binMode, fourCols, refreshKey = 0 }: { initialSource?: MediaSource; initialPasta?: string; embedded?: boolean; uploadHere?: boolean; bare?: boolean; binMode?: boolean; fourCols?: boolean; refreshKey?: number }) {
  const params = useSearchParams();
  const pickId = params.get('escolher');
  const [source, setSource] = useState<MediaSource>(initialSource);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [pasta, setPasta] = useState(initialPasta);
  const [zips, setZips] = useState<{ path: string; label: string }[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState('');
  // Estado de cada zip, mostrado dentro do próprio mosaico do zip (nunca por cima da página).
  const [zipStatus, setZipStatus] = useState<Record<string, string>>({});
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
    setZipStatus((z) => ({ ...z, [path]: 'A descompactar…' }));
    try {
      const res = await fetch('/api/admin/partilhado/zip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ path }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao descompactar.');
      setReloadKey((k) => k + 1);
      setZipStatus((z) => { const n = { ...z }; delete n[path]; return n; });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao descompactar.';
      setZipStatus((z) => ({ ...z, [path]: `Erro: ${msg}` }));
      setTimeout(() => setZipStatus((z) => { const n = { ...z }; delete n[path]; return n; }), 8000);
    }
  };

  /** Para onde voltar: o ecrã de onde se veio escolher a foto (só caminhos do painel). */
  const rawBack = params.get('voltar') || '';
  const voltar = rawBack.startsWith('/admin/') && !rawBack.startsWith('//') ? rawBack : '/admin/noticias';

  /** "Voltar à notícia": volta a esse ecrã no mesmo separador (o rascunho foi guardado antes de sair). */
  const backToNews = () => { window.location.href = voltar; };

  /** Foto escolhida: guarda-se o resultado e volta-se ao ecrã de origem, que a aplica. */
  const pick = pickId
    ? (url: string) => {
        let target = 'featured';
        try { target = (JSON.parse(sessionStorage.getItem('ec-pick') || '{}') as { target?: string }).target || 'featured'; } catch { /* usa a foto de destaque */ }
        try { sessionStorage.setItem('ec-pick-result', JSON.stringify({ id: pickId, url, target })); } catch { /* sem armazenamento */ }
        window.location.href = voltar;
      }
    : undefined;

  const visibleTabs = TABS.filter((t) => t.id !== 'partilhado' || canSeeShared);
  const tabs = (
    <>
    <select
      value={source}
      onChange={(e) => { setSource(e.target.value as MediaSource); setPasta(''); }}
      className="h-9 w-full border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none md:hidden"
    >
      {visibleTabs.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
    </select>
    <div className="hidden flex-nowrap items-center gap-1.5 sm:gap-2 md:flex">
      {visibleTabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => { setSource(t.id); setPasta(''); }}
          className={`h-8 shrink-0 whitespace-nowrap rounded-[3px] border px-1.5 text-[10px] sm:px-2 sm:text-xs 2xl:px-3 2xl:text-sm ${source === t.id ? 'border-[#00a651] bg-[#00a651] text-white' : 'border-[#ccd0d4] bg-white text-[#50575e] hover:bg-[#f6f7f7]'}`}
        >
          <span className="2xl:hidden">{t.short}</span>
          <span className="hidden 2xl:inline">{t.label}</span>
        </button>
      ))}
    </div>
    </>
  );

  return (
    <>
      {pick && (
        <div className="flex items-center justify-between gap-3 bg-[#00a651] px-6 py-2 text-white">
          <span className="text-sm font-semibold">Escolher foto</span>
          <button type="button" onClick={backToNews} className="inline-flex items-center gap-1.5 text-sm underline-offset-2 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar à notícia
          </button>
        </div>
      )}
      <MediaGalleryView
        key={`${source}:${pasta}:${reloadKey}:${refreshKey}`}
        source={source}
        pasta={pasta}
        pick={pick}
        embedded={embedded}
        bare={bare}
        binMode={binMode}
        fourCols={fourCols}
        // "Adicionar" só na galeria; o arquivo recebe fotos no seu próprio lugar (a página de cada pasta) e as partilhadas só chegam por e-mail.
        uploadDisabled={!(source === 'galeria' || (source === 'arquivo' && !!pasta && !!uploadHere))}
        reloadKey={reloadKey}
        initialQuery={filter}
        zipOptions={source === 'partilhado' ? zips : undefined}
        onPickZip={unzip}
        zipStatus={zipStatus}
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
export default function MediaGaleria(props: { initialSource?: MediaSource; initialPasta?: string; embedded?: boolean; uploadHere?: boolean; bare?: boolean; binMode?: boolean; fourCols?: boolean; refreshKey?: number }) {
  return (
    <Suspense fallback={null}>
      <GaleriaInner {...props} />
    </Suspense>
  );
}
