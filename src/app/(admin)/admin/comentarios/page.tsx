'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, MessageSquare, RefreshCw, RotateCcw, ShieldAlert, Trash2, X } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';
import AdminSelect from '@/components/Admin/AdminSelect';

type Status = 'pending' | 'approved' | 'spam' | 'trash';
interface Comment {
  id: string;
  news_slug: string;
  name: string;
  email: string;
  website: string | null;
  content: string;
  status: Status;
  created_at: string;
}

const TABS: { key: Status; label: string }[] = [
  { key: 'pending', label: 'Pendentes' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'spam', label: 'Spam' },
  { key: 'trash', label: 'Lixo' },
];

/** Moderação dos comentários das notícias: só os aprovados aparecem no site. */
export default function ComentariosPage() {
  const [tab, setTab] = useState<Status>('pending');
  // Cópia guardada da última visita: mostra-se logo e a página actualiza-se em segundo plano.
  const first = adminCacheGet<{ items: Comment[]; counts: Record<string, number> }>('comments:pending');
  const [items, setItems] = useState<Comment[]>(first?.items ?? []);
  const [counts, setCounts] = useState<Record<string, number>>(first?.counts ?? {});
  const [loading, setLoading] = useState(!first);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const saved = adminCacheGet<{ items: Comment[]; counts: Record<string, number> }>(`comments:${tab}`);
    if (saved) {
      setItems(saved.items);
      setCounts(saved.counts);
      setLoading(false);
    } else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/comments?status=${tab}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar os comentários.');
      adminCacheSet(`comments:${tab}`, { items: data.items, counts: data.counts || {} });
      setItems(data.items);
      setCounts(data.counts || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar os comentários.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, body: { status?: Status; action?: 'delete' }) {
    if (body.action === 'delete' && !confirm('Eliminar este comentário de forma definitiva?')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao actualizar.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao actualizar.');
    } finally {
      setBusy(false);
    }
  }

  const btn = 'flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium disabled:opacity-60';

  return (
    <div className="ec-page text-[#2c3338]">
      <div className="mb-4 flex items-center gap-4">
        <h1 className="flex items-center gap-2 text-[23px] font-normal text-[#1d2327]">
          <MessageSquare className="h-5 w-5 text-gray-500" /> Comentários
        </h1>
        <button onClick={load} className="ml-auto flex items-center gap-1.5 text-sm text-[#2271b1] hover:underline">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* Telemóvel: os separadores passam a um selector */}
      <AdminSelect
        value={tab}
        onChange={(e) => setTab(e.target.value as Status)}
        className="mb-3 h-9 w-full border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none md:hidden"
      >
        {TABS.map((t) => (
          <option key={t.key} value={t.key}>{t.label} ({counts[t.key] ?? 0})</option>
        ))}
      </AdminSelect>

      <ul className="hidden flex-wrap gap-1 border-b border-[#ccd0d4] text-[13px] md:flex">
        {TABS.map((t) => (
          <li key={t.key}>
            <button
              onClick={() => setTab(t.key)}
              className={`-mb-px border border-b-0 px-3 py-2 ${tab === t.key ? 'border-[#ccd0d4] bg-white font-semibold text-[#1d2327]' : 'border-transparent text-[#008f45] hover:text-[#006b33]'}`}
            >
              {t.label} <span className="text-gray-400">({counts[t.key] ?? 0})</span>
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="mb-4 border-l-4 border-[#d63638] bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <div className="border border-[#ccd0d4] bg-white md:border-t-0">
        {loading && items.length === 0 ? (
          <div className="flex min-h-[calc(100vh-160px)] items-center justify-center"><Spinner size={40} /></div>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Nenhum comentário aqui.</p>
        ) : (
          <ul className="divide-y divide-[#e5e5e5]">
            {items.map((c) => (
              <li key={c.id} className="p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px]">
                  <strong className="text-[#1d2327]">{c.name}</strong>
                  <a href={`mailto:${c.email}`} className="text-[#2271b1] hover:underline">{c.email}</a>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="nofollow noopener noreferrer" className="text-gray-500 hover:underline">
                      {c.website}
                    </a>
                  )}
                  <span className="text-gray-400">{new Date(c.created_at).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <Link href={`/noticias/${c.news_slug}#comentarios`} target="_blank" className="ml-auto flex items-center gap-1 text-[#2271b1] hover:underline">
                    Ver notícia <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <p className="mt-2 whitespace-pre-line break-words text-[14px] leading-6">{c.content}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.status !== 'approved' && (
                    <button disabled={busy} onClick={() => act(c.id, { status: 'approved' })} className={`${btn} bg-[#00a651] text-white hover:bg-[#008f46]`}>
                      <Check className="h-3.5 w-3.5" /> Aprovar
                    </button>
                  )}
                  {c.status === 'pending' && (
                    <button disabled={busy} onClick={() => act(c.id, { status: 'trash' })} className={`${btn} bg-[#d63638] text-white hover:bg-[#b32d2e]`}>
                      <X className="h-3.5 w-3.5" /> Rejeitar
                    </button>
                  )}
                  {c.status === 'approved' && (
                    <button disabled={busy} onClick={() => act(c.id, { status: 'pending' })} className={`${btn} border border-[#ccd0d4] text-[#2c3338] hover:bg-gray-50`}>
                      <RotateCcw className="h-3.5 w-3.5" /> Retirar do site
                    </button>
                  )}
                  {(c.status === 'pending' || c.status === 'approved') && (
                    <button disabled={busy} onClick={() => act(c.id, { status: 'spam' })} className={`${btn} border border-[#ccd0d4] text-[#2c3338] hover:bg-gray-50`}>
                      <ShieldAlert className="h-3.5 w-3.5" /> Spam
                    </button>
                  )}
                  {(c.status === 'spam' || c.status === 'trash') && (
                    <button disabled={busy} onClick={() => act(c.id, { status: 'pending' })} className={`${btn} border border-[#ccd0d4] text-[#2c3338] hover:bg-gray-50`}>
                      <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                    </button>
                  )}
                  {c.status === 'trash' && (
                    <button disabled={busy} onClick={() => act(c.id, { action: 'delete' })} className={`${btn} bg-[#d63638] text-white hover:bg-[#b32d2e]`}>
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar de vez
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
