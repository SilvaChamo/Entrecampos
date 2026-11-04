'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, FolderPlus, ImagePlus, Search, Trash2 } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import ArquivoTabs from '@/components/Admin/ArquivoTabs';
import ArquivoFolders, { type FolderActions, type FolderInfo } from '@/components/Admin/ArquivoFolders';
import { useAuth } from '@/context/AuthContext';
import MediaGaleria from '@/components/Admin/MediaGaleria';
import { prepareImage } from '@/lib/client-image';

/** Nome de pasta: no máximo 4 palavras (a quinta não chega a ser escrita). */
const limitWords = (v: string) => { const w = v.trimStart().split(/\s+/); return w.length > 4 ? w.slice(0, 4).join(' ') : v.trimStart(); };

/** Arquivo de fotos do jornal: pastas com nome, como num Drive só de fotos. */
export default function ArquivoPage() {
  const [folders, setFolders] = useState<FolderInfo[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [aberta, setAberta] = useState<string | null>(null); // pasta aberta aqui mesmo, sem sair da página
  const [selCount, setSelCount] = useState(0); // fotos selecionadas na grelha (a lixeira elimina-as, com confirmação)
  const [refresh, setRefresh] = useState(0);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [addMenu, setAddMenu] = useState(false);
  const { user } = useAuth();
  const canDelete = user?.role === 'admin' || user?.role === 'editor';

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/arquivo', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao ler o arquivo.');
      setFolders(json.folders);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao ler o arquivo.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Ligação directa a uma pasta (?pasta=...): abre-a aqui.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('pasta');
    if (p) setAberta(p);
  }, []);

  useEffect(() => {
    const onCount = (e: Event) => setSelCount(Number((e as CustomEvent).detail) || 0);
    // Clicar no menu "Arquivo de fotos" estando já aqui fecha a pasta aberta e mostra as pastas.
    const onNav = (e: Event) => { if ((e as CustomEvent).detail === '/admin/arquivo') { setAberta(null); setSelCount(0); } };
    window.addEventListener('ec-bulk-count', onCount);
    window.addEventListener('ec-nav', onNav);
    return () => { window.removeEventListener('ec-bulk-count', onCount); window.removeEventListener('ec-nav', onNav); };
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/arquivo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Não foi possível criar a pasta.');
      setNome('');
      setCreating(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a pasta.');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/arquivo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error || 'Não foi possível guardar.'); return false; }
    setError('');
    await load();
    return true;
  };

  const actions: FolderActions = {
    onRename: (f) => { const nome = prompt('Novo nome da pasta (máx. 4 palavras):', f.nome); if (nome && nome.trim() && nome.trim() !== f.nome) patch({ slug: f.slug, nome }); },
    onColor: (f, cor) => { patch({ slug: f.slug, cor }); },
    onShare: async (f) => {
      try {
        const res = await fetch('/api/admin/arquivo/partilhar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: f.slug }) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Não foi possível criar a ligação.');
        const url = `${window.location.origin}${json.path}`;
        const msg = `Fotos partilhadas do EntreCAMPOS (“${f.nome}”): ${url}\nDescarregue as fotos o quanto antes: a ligação só funciona durante ${json.horas} horas.`;
        try { await navigator.clipboard.writeText(msg); setNotice(`Ligação da pasta “${f.nome}” copiada, com o aviso de que dura ${json.horas} horas. Quem a receber vê só as fotos e descarrega-as sem fazer login.`); }
        catch { prompt('Copie a mensagem e a ligação:', msg); }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Não foi possível criar a ligação.');
      }
    },
    onDownload: (f) => { window.location.href = `/api/admin/arquivo/zip?pasta=${encodeURIComponent(f.slug)}`; },
    onDelete: canDelete
      ? async (f) => {
          if (!confirm(`Eliminar a pasta “${f.nome}”? Só é possível se estiver vazia.`)) return;
          const res = await fetch('/api/admin/arquivo', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: f.slug }) });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) setError(json.error || 'Não foi possível eliminar a pasta.');
          else { setError(''); await load(); }
        }
      : undefined,
  };

  /** Carrega várias fotos (ou todas as fotos de uma pasta do computador) para a pasta aberta. As outras ficheiros são ignorados. */
  const uploadFiles = async (list: FileList | null) => {
    const all = list ? Array.from(list) : [];
    if (!aberta || all.length === 0) return;
    const images = all.filter((f) => f.type.startsWith('image/'));
    const skipped = all.length - images.length;
    if (images.length === 0) { setUploadMsg('Nenhuma foto encontrada no que escolheu.'); return; }
    setUploading(true);
    let ok = 0;
    let lastError = '';
    for (const original of images) {
      setUploadMsg(`A carregar ${ok + 1} de ${images.length}…`);
      const file = await prepareImage(original);
      const form = new FormData();
      form.append('file', file);
      form.append('pasta', aberta);
      const res = await fetch('/api/admin/arquivo/upload', { method: 'POST', credentials: 'include', body: form });
      if (res.ok) ok += 1;
      else lastError = (await res.json().catch(() => ({}))).error || 'Erro ao carregar.';
    }
    setUploading(false);
    setUploadMsg(`${ok} de ${images.length} foto(s) carregada(s)${skipped ? `; ${skipped} ficheiro(s) que não são fotos foram ignorados` : ''}${lastError ? `. Falhou: ${lastError}` : '.'}`);
    setRefresh((r) => r + 1);
    load();
    setTimeout(() => setUploadMsg(''), 8000);
  };

  const pastaAberta = folders?.find((f) => f.slug === aberta);

  const shown = useMemo(() => (folders ?? []).filter((f) => f.nome.toLowerCase().includes(query.toLowerCase())), [folders, query]);

  return (
    <div className="min-h-screen p-6 text-[#2c3338]">
      <h1 className="mb-1 text-2xl font-normal">Arquivo de fotos</h1>
      <p className="mb-3 text-sm text-[#50575e]">Arquivo de fotos do EntreCAMPOS.{aberta && <> Pasta: <strong>{pastaAberta?.nome ?? aberta}</strong>.</>}</p>

      <ArquivoTabs
        active="arquivo"
        slots={!!aberta}
        onArquivoClick={() => { setAberta(null); setSelCount(0); }}
        right={
          aberta ? (
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddMenu((o) => !o)}
                disabled={uploading}
                aria-haspopup="menu"
                aria-expanded={addMenu}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[3px] bg-[#00a651] px-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <ImagePlus className="h-4 w-4" /> {uploading ? 'A carregar…' : 'Adicionar fotos'} <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {addMenu && (
                <div role="menu" className="absolute right-0 top-9 z-30 w-56 overflow-hidden rounded-lg border border-[#e2e4e7] bg-white py-1 shadow-lg">
                  <label role="menuitem" className="block cursor-pointer px-4 py-2 text-[13px] text-[#2c3338] hover:bg-[#f6f7f7]">
                    Escolher fotos…
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const l = e.target.files; setAddMenu(false); uploadFiles(l).finally(() => { e.target.value = ''; }); }} />
                  </label>
                  <label role="menuitem" className="block cursor-pointer px-4 py-2 text-[13px] text-[#2c3338] hover:bg-[#f6f7f7]">
                    Escolher uma pasta…
                    <input type="file" multiple className="hidden" {...({ webkitdirectory: '', directory: '' } as Record<string, string>)} onChange={(e) => { const l = e.target.files; setAddMenu(false); uploadFiles(l).finally(() => { e.target.value = ''; }); }} />
                  </label>
                </div>
              )}
              {selCount > 0 && (
                <button
                  type="button"
                  title="Eliminar as fotos selecionadas"
                  aria-label="Eliminar as fotos selecionadas"
                  onClick={() => window.dispatchEvent(new Event('ec-bulk-delete'))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] border border-[#d63638] bg-[#d63638] text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar pasta…" aria-label="Procurar pasta" className="h-8 w-72 max-w-full rounded-[3px] border border-[#ccd0d4] pl-8 pr-2 text-sm outline-none focus:border-[#00a651]" />
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#50575e]" />
              </div>
              <button onClick={() => setCreating((c) => !c)} className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[3px] bg-[#00a651] px-3 text-sm font-semibold text-white">
                <FolderPlus className="h-4 w-4" /> Nova pasta
              </button>
            </div>
          )
        }
      />

      {creating && !aberta && (
        <form onSubmit={create} className="mb-5 flex flex-wrap items-center gap-2 rounded border border-[#ccd0d4] bg-white p-3">
          <label htmlFor="nome-pasta" className="text-sm font-semibold">Nome da pasta</label>
          <input id="nome-pasta" autoFocus required maxLength={80} value={nome} onChange={(e) => setNome(limitWords(e.target.value))} placeholder="Ex.: Eleições 2026 (máx. 4 palavras)" className="h-8 min-w-[16rem] flex-1 rounded-[3px] border border-[#ccd0d4] px-2 text-sm outline-none focus:border-[#00a651]" />
          <button type="submit" disabled={saving} className="h-8 rounded-[3px] bg-[#00a651] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'A criar…' : 'Criar'}</button>
          <button type="button" onClick={() => { setCreating(false); setNome(''); }} className="h-8 rounded-[3px] border border-[#ccd0d4] bg-white px-4 text-sm">Cancelar</button>
        </form>
      )}

      {uploadMsg && <div role="status" className="mb-4 rounded border border-[#00a651] bg-white p-3 text-sm">{uploadMsg}</div>}
      {notice && <div className="mb-4 rounded border border-[#00a651] bg-white p-3 text-sm">{notice}</div>}
      {error && <div className="mb-4 rounded border border-[#d63638] bg-white p-3 text-sm text-[#d63638]">{error}</div>}
      {!aberta && !folders && !error && <div className="flex justify-center py-20"><Spinner /></div>}
      {!aberta && folders && folders.length === 0 && (
        <p className="rounded border border-dashed border-[#ccd0d4] bg-white py-12 text-center text-sm text-[#50575e]">O arquivo ainda não tem pastas. Clique em “Nova pasta”, dê-lhe um nome e carregue as fotos.</p>
      )}

      {aberta ? (
        <MediaGaleria key={aberta} initialSource="arquivo" initialPasta={aberta} embedded bare refreshKey={refresh} />
      ) : (
        <ArquivoFolders folders={shown} onOpen={(slug) => { setSelCount(0); setAberta(slug); }} actions={actions} />
      )}
    </div>
  );
}
