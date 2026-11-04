'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FolderPlus, Search } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import ArquivoTabs from '@/components/Admin/ArquivoTabs';
import ArquivoFolders, { type FolderInfo } from '@/components/Admin/ArquivoFolders';

/** Arquivo de fotos do jornal: pastas com nome, como num Drive só de fotos. */
export default function ArquivoPage() {
  const [folders, setFolders] = useState<FolderInfo[] | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

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

  const shown = useMemo(() => (folders ?? []).filter((f) => f.nome.toLowerCase().includes(query.toLowerCase())), [folders, query]);

  return (
    <div className="min-h-screen p-6 text-[#2c3338]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-normal">Arquivo de fotos</h1>
          <p className="mt-1 text-sm text-[#50575e]">As fotos do jornal, em pastas. Qualquer pessoa da equipa pode abrir uma pasta, partilhar as fotos e usá-las nas notícias.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar pasta…" className="h-8 w-56 rounded-[3px] border border-[#ccd0d4] pl-8 pr-2 text-sm outline-none focus:border-[#00a651]" />
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#50575e]" />
          </div>
          <button onClick={() => setCreating((c) => !c)} className="inline-flex h-8 items-center gap-1.5 rounded-[3px] bg-[#00a651] px-3 text-sm font-semibold text-white">
            <FolderPlus className="h-4 w-4" /> Nova pasta
          </button>
        </div>
      </div>

      <ArquivoTabs active="arquivo" />

      {creating && (
        <form onSubmit={create} className="mb-5 flex flex-wrap items-center gap-2 rounded border border-[#ccd0d4] bg-white p-3">
          <label htmlFor="nome-pasta" className="text-sm font-semibold">Nome da pasta</label>
          <input id="nome-pasta" autoFocus required maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Eleições 2026" className="h-8 min-w-[16rem] flex-1 rounded-[3px] border border-[#ccd0d4] px-2 text-sm outline-none focus:border-[#00a651]" />
          <button type="submit" disabled={saving} className="h-8 rounded-[3px] bg-[#00a651] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'A criar…' : 'Criar'}</button>
          <button type="button" onClick={() => { setCreating(false); setNome(''); }} className="h-8 rounded-[3px] border border-[#ccd0d4] bg-white px-4 text-sm">Cancelar</button>
        </form>
      )}

      {error && <div className="mb-4 rounded border border-[#d63638] bg-white p-3 text-sm text-[#d63638]">{error}</div>}
      {!folders && !error && <div className="flex justify-center py-20"><Spinner /></div>}
      {folders && folders.length === 0 && (
        <p className="rounded border border-dashed border-[#ccd0d4] bg-white py-12 text-center text-sm text-[#50575e]">O arquivo ainda não tem pastas. Clique em “Nova pasta”, dê-lhe um nome e carregue as fotos.</p>
      )}

      <ArquivoFolders folders={shown} hrefBase="/admin/arquivo" />
    </div>
  );
}
