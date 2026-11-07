'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { SkeletonTableRow } from '@/components/Admin/Skeleton';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';

interface NewsItem {
  id: string;
  title: string;
  slug?: string;
  category: string;
  date: string;
  status: string;
  views?: number;
}

const STATUS: Record<string, string> = { published: 'Publicado', pending: 'Pendente de revisão', draft: 'Rascunho', archived: 'Arquivado', trash: 'Lixo' };
const SEP = "max-md:before:content-['·_'] max-md:before:text-gray-400";
const LBL = "max-md:before:font-normal max-md:before:text-gray-500 max-md:before:content-[attr(data-label)_':_']";

/**
 * Meus artigos: o único menu do colunista. Lista dos artigos da própria conta, na mesma configuração da lista de
 * notícias do painel (título com atalhos, categoria, estado e data, leituras), mas sem foto.
 */
export default function MeusArtigosPage() {
  const [items, setItems] = useState<NewsItem[]>(() => adminCacheGet<NewsItem[]>('meus-artigos') ?? []);
  const [loading, setLoading] = useState(() => adminCacheGet('meus-artigos') === undefined);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (adminCacheGet('meus-artigos') === undefined) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/news/list?meus=1', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar os artigos.');
      adminCacheSet('meus-artigos', data.items);
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

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((n) => n.title.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const statusOf = (n: NewsItem) => STATUS[String(n.status).toLowerCase()] || n.status;

  return (
    <div className="ec-page text-[#2c3338]">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <h1 className="w-full text-2xl font-normal sm:w-auto">Meus artigos</h1>
          <Link
            href="/admin/noticias/nova"
            className="flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-[#00a651] bg-white px-4 text-[13px] font-normal text-[#00a651] transition-all hover:bg-[#f6f7f7]"
          >
            <Plus className="h-4 w-4" />
            Escrever artigo
          </Link>
        </div>
        <input
          type="text"
          placeholder="Pesquisar artigos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full min-w-0 rounded-md border border-[#ccd0d4] px-3 text-[13px] outline-none focus:border-[#00a651] md:w-64"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-[#ccd0d4] bg-white">
        <table className="ec-cards w-full border-collapse text-[13px] max-md:block">
          <thead className="max-md:hidden">
            <tr className="border-b border-[#ccd0d4] bg-white text-left font-bold text-[#2c3338]">
              <th className="min-w-[300px] p-3">Título</th>
              <th className="w-40 p-3">Categoria</th>
              <th className="w-56 p-3">Estado e data</th>
              <th className="w-32 p-3">Hits</th>
            </tr>
          </thead>
          <tbody className="max-md:block">
            {loading && items.length === 0 ? (
              <SkeletonTableRow columns={4} />
            ) : error ? (
              <tr><td colSpan={4} className="bg-red-50 p-10 text-center font-medium text-red-600">{error}</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-500">{items.length === 0 ? 'Ainda não escreveu nenhum artigo.' : 'Nenhum artigo encontrado.'}</td></tr>
            ) : (
              shown.map((n, idx) => (
                <tr key={n.id} className={`group border-b border-[#f0f0f1] hover:bg-[#f6f7f7] max-md:block max-md:p-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                  <td className="p-3 align-top max-md:block max-md:p-0">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Link href={`/admin/noticias/editar/${n.id}`} title={n.title} className="line-clamp-2 break-words text-[12px] font-bold leading-snug text-[#2271b1] hover:text-[#135e96] min-[1500px]:text-[14px]">
                        {n.title}
                      </Link>
                      <div className="flex flex-nowrap items-center gap-x-1.5 whitespace-nowrap text-[11px] font-medium leading-none text-[#2271b1] md:invisible md:group-hover:visible [@media(hover:none)]:md:!visible">
                        <Link href={`/admin/noticias/editar/${n.id}`} className="hover:text-[#135e96]">Editar</Link>
                        {String(n.status).toLowerCase() === 'published' && n.slug && (
                          <>
                            <span className="text-gray-300">|</span>
                            <Link href={`/noticias/${n.slug}`} target="_blank" className="hover:text-[#135e96]">Ver</Link>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td data-label="Categoria" className={`p-3 align-top capitalize text-[#50575e] max-md:inline-block max-md:p-0 max-md:pr-1 max-md:pt-2 max-md:text-[11px] ${LBL}`}>
                    {n.category}
                  </td>
                  <td className="p-3 align-top text-[#50575e] max-md:inline-block max-md:p-0 max-md:pt-2 max-md:text-[11px]">
                    <div className="flex flex-col leading-tight max-md:flex-row max-md:gap-1">
                      <span className={SEP}>{statusOf(n)}</span>
                      <span className={SEP}>
                        {new Date(n.date).toLocaleDateString('pt-PT')}
                        <span className="max-md:hidden"> às {new Date(n.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-3 align-top text-[#50575e] max-md:hidden">
                    <span className="font-bold text-[#1d2327]">{n.views || 0} leituras</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[13px] text-[#50575e]">{shown.length} {shown.length === 1 ? 'artigo' : 'artigos'}</div>
    </div>
  );
}
