'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FolderPlus, Search } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import ArquivoTabs from '@/components/Admin/ArquivoTabs';
import ArquivoFolders, { type FolderActions, type FolderInfo } from '@/components/Admin/ArquivoFolders';
import { useAuth } from '@/context/AuthContext';

/** Arquivo de fotos do jornal: pastas com nome, como num Drive só de fotos. */
export default function ArquivoPage() {
  const [folders, setFolders] = useState<FolderInfo[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
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
    onRename: (f) => { const nome = prompt('Novo nome da pasta:', f.nome); if (nome && nome.trim() && nome.trim() !== f.nome) patch({ slug: f.slug, nome }); },
    onColor: (f, cor) => { patch({ slug: f.slug, cor }); },
    onShare: async (f) => {
      const url = `${window.location.origin}/admin/arquivo/${f.slug}`;
      try { await navigator.clipboard.writeText(url); setNotice(`Ligação da pasta “${f.nome}” copiada. Quem tiver acesso ao painel abre-a directamente.`); }
      catch { prompt('Copie a ligação da pasta:', url); }
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

  const shown = useMemo(() => (folders ?? []).filter((f) => f.nome.toLowerCase().includes(query.toLowerCase())), [folders, query]);

  return (
    <div className="min-h-screen p-6 text-[#2c3338]">
      <h1 className="mb-3 text-2xl font-normal">Arquivo de fotos</h1>

      <ArquivoTabs
        active="arquivo"
        right={
          <div className="flex items-center gap-2">
            <div className="relative">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar pasta…" aria-label="Procurar pasta" className="h-8 w-72 max-w-full rounded-[3px] border border-[#ccd0d4] pl-8 pr-2 text-sm outline-none focus:border-[#00a651]" />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#50575e]" />
            </div>
            <button onClick={() => setCreating((c) => !c)} className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[3px] bg-[#00a651] px-3 text-sm font-semibold text-white">
              <FolderPlus className="h-4 w-4" /> Nova pasta
            </button>
          </div>
        }
      />

      {creating && (
        <form onSubmit={create} className="mb-5 flex flex-wrap items-center gap-2 rounded border border-[#ccd0d4] bg-white p-3">
          <label htmlFor="nome-pasta" className="text-sm font-semibold">Nome da pasta</label>
          <input id="nome-pasta" autoFocus required maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Eleições 2026" className="h-8 min-w-[16rem] flex-1 rounded-[3px] border border-[#ccd0d4] px-2 text-sm outline-none focus:border-[#00a651]" />
          <button type="submit" disabled={saving} className="h-8 rounded-[3px] bg-[#00a651] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'A criar…' : 'Criar'}</button>
          <button type="button" onClick={() => { setCreating(false); setNome(''); }} className="h-8 rounded-[3px] border border-[#ccd0d4] bg-white px-4 text-sm">Cancelar</button>
        </form>
      )}

      {notice && <div className="mb-4 rounded border border-[#00a651] bg-white p-3 text-sm">{notice}</div>}
      {error && <div className="mb-4 rounded border border-[#d63638] bg-white p-3 text-sm text-[#d63638]">{error}</div>}
      {!folders && !error && <div className="flex justify-center py-20"><Spinner /></div>}
      {folders && folders.length === 0 && (
        <p className="rounded border border-dashed border-[#ccd0d4] bg-white py-12 text-center text-sm text-[#50575e]">O arquivo ainda não tem pastas. Clique em “Nova pasta”, dê-lhe um nome e carregue as fotos.</p>
      )}

      <ArquivoFolders folders={shown} hrefBase="/admin/arquivo" actions={actions} />
    </div>
  );
}
