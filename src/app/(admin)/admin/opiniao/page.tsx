'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit2 } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';

interface NewsItem {
  id: string;
  title: string;
  slug?: string;
  category: string;
  date: string;
  status: string;
  author_name?: string;
}

const STATUS: Record<string, string> = { published: 'Publicado', pending: 'Pendente', draft: 'Rascunho', archived: 'Arquivado', trash: 'Lixo' };

/** Artigos de opinião: lista própria (muitos não têm foto, por isso não vão para a lista de notícias). */
export default function ArtigosDeOpiniaoPage() {
  const [items, setItems] = useState<NewsItem[]>(() => adminCacheGet<NewsItem[]>('opinion') ?? []);
  const [loading, setLoading] = useState(() => adminCacheGet('opinion') === undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (adminCacheGet('opinion') === undefined) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/news/list?tipo=opiniao', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar os artigos.');
      adminCacheSet('opinion', data.items);
      setItems(data.items as NewsItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="ec-page text-[#2c3338]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl text-[#1d2327]">Todos os artigos de opinião</h1>
          <p className="text-[#50575e] mt-1">Todos os artigos da categoria Opinião e o colunista autor de cada um</p>
        </div>
        <Link href="/admin/noticias/nova" className="flex h-9 items-center gap-2 px-4 text-[13px] bg-[#00a651] text-white rounded-md hover:bg-[#008f45]">
          Escrever artigo
        </Link>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700">{error}</div>}

      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#f6f7f7] text-left border-b border-[#ccd0d4]">
              <th className="p-4 font-normal">Artigo</th>
              <th className="p-4 font-normal">Autor</th>
              <th className="p-4 font-normal hidden md:table-cell">Data</th>
              <th className="p-4 font-normal hidden md:table-cell">Estado</th>
              <th className="p-4 text-right font-normal">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="h-[55vh] p-10 text-center align-middle"><Spinner size={32} className="mx-auto" /></td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-[#50575e]">Ainda não há artigos de opinião.</td>
              </tr>
            ) : (
              items.map((n, idx) => (
                <tr key={n.id} className={`border-b border-[#f0f0f1] hover:bg-[#f6f7f7] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                  <td className="px-4 py-2">
                    <Link href={`/admin/noticias/editar/${n.id}`} className="text-[#2271b1] hover:underline">{n.title}</Link>
                    <div className="mt-0.5 text-[12px] text-[#50575e] md:hidden">{new Date(n.date).toLocaleDateString('pt-PT')} · {STATUS[String(n.status).toLowerCase()] || n.status}</div>
                  </td>
                  <td className="px-4 py-2 text-[#50575e]">{n.author_name || '—'}</td>
                  <td className="px-4 py-2 text-[#50575e] hidden md:table-cell">{new Date(n.date).toLocaleDateString('pt-PT')}</td>
                  <td className="px-4 py-2 text-[#50575e] hidden md:table-cell">{STATUS[String(n.status).toLowerCase()] || n.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/admin/noticias/editar/${n.id}`} aria-label={`Editar ${n.title}`} className="inline-flex p-2 text-[#2271b1] hover:bg-green-50 rounded">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[13px] text-[#50575e]">{items.length} artigos de opinião</div>
    </div>
  );
}
