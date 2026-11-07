'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Eye, Trash2 } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';

interface NewsItem {
  id: string;
  title: string;
  date: string;
  status: string;
  author_name?: string;
}

/** Artigos de opinião à espera de revisão (os dos colunistas que não podem publicar). */
export default function OpiniaoPendentesPage() {
  const [all, setAll] = useState<NewsItem[]>(() => adminCacheGet<NewsItem[]>('opinion') ?? []);
  const [loading, setLoading] = useState(() => adminCacheGet('opinion') === undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = all.filter((n) => String(n.status).toLowerCase() === 'pending');

  const load = useCallback(async () => {
    if (adminCacheGet('opinion') === undefined) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/news/list?tipo=opiniao', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar os artigos.');
      adminCacheSet('opinion', data.items);
      setAll(data.items as NewsItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Publicar (ou enviar para o lixo) grava o novo estado no servidor, que confirma se o papel pode fazê-lo.
  const setStatus = async (id: string, status: 'published' | 'trash') => {
    if (status === 'trash' && !confirm('Enviar este artigo para o lixo?')) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch('/api/admin/news/status', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível actualizar o artigo.');
      const next = all.map((n) => (n.id === id ? { ...n, status } : n));
      adminCacheSet('opinion', next);
      setAll(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao actualizar.');
    } finally {
      setBusy(null);
    }
  };

  const btn = 'inline-flex h-9 items-center gap-1.5 px-3 text-[13px] rounded-md whitespace-nowrap disabled:opacity-60';

  return (
    <div className="ec-page text-[#2c3338]">
      <div className="mb-6">
        <h1 className="text-2xl text-[#1d2327]">Artigos de opinião pendentes</h1>
        <p className="text-[#50575e] mt-1">Artigos de opinião que aguardam revisão antes de serem publicados</p>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700">{error}</div>}

      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#f6f7f7] text-left border-b border-[#ccd0d4]">
              <th className="p-4 font-normal">Artigo</th>
              <th className="p-4 font-normal hidden md:table-cell">Autor</th>
              <th className="p-4 font-normal hidden md:table-cell">Data</th>
              <th className="p-4 text-right font-normal">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="h-[55vh] p-10 text-center align-middle"><Spinner size={32} className="mx-auto" /></td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-[#50575e]">Não há artigos de opinião pendentes.</td>
              </tr>
            ) : (
              items.map((n, idx) => (
                <tr key={n.id} className={`border-b border-[#f0f0f1] hover:bg-[#f6f7f7] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                  <td className="px-4 py-2">
                    <Link href={`/admin/noticias/editar/${n.id}`} className="text-[#2271b1] hover:underline">{n.title}</Link>
                    <div className="mt-0.5 text-[12px] text-[#50575e] md:hidden">{n.author_name || '—'} · {new Date(n.date).toLocaleDateString('pt-PT')}</div>
                  </td>
                  <td className="px-4 py-2 text-[#50575e] hidden md:table-cell">{n.author_name || '—'}</td>
                  <td className="px-4 py-2 text-[#50575e] hidden md:table-cell">{new Date(n.date).toLocaleDateString('pt-PT')}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button disabled={busy === n.id} onClick={() => setStatus(n.id, 'published')} className={`${btn} bg-[#00a651] text-white hover:bg-[#008f45]`}>
                        <CheckCircle className="w-4 h-4" /> Publicar
                      </button>
                      <Link href={`/admin/noticias/editar/${n.id}`} className={`${btn} border border-[#ccd0d4] bg-white hover:bg-[#f6f7f7]`}>
                        <Eye className="w-4 h-4" /> Rever
                      </Link>
                      <button disabled={busy === n.id} onClick={() => setStatus(n.id, 'trash')} aria-label="Enviar para o lixo" className={`${btn} border border-[#ccd0d4] bg-white text-red-600 hover:bg-red-50`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[13px] text-[#50575e]">{items.length} artigos pendentes</div>
    </div>
  );
}
