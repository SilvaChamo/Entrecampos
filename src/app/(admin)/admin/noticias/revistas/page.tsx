'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckSquare, RefreshCw, Edit2, ExternalLink } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  image_url: string;
  status: string;
  author_name?: string;
}

const LIMIT = 30;

/** Últimas notícias revistas: as mais recentes que já passaram a revisão e estão publicadas. */
export default function ReviewedNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/news/list', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Não foi possível carregar as notícias.');
        const published = (data.items as NewsItem[]).filter((n) => String(n.status).toLowerCase() === 'published');
        setNews(published.slice(0, LIMIT));
      })
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="mb-8">
        <h1 className="text-2xl font-normal flex items-center gap-3">
          <CheckSquare className="w-6 h-6 text-green-600" />
          Últimas Notícias Revistas
        </h1>
        <p className="text-sm text-gray-500 mt-1">As {LIMIT} notícias publicadas mais recentes.</p>
      </div>

      {errorMsg && <p className="mb-4 border-l-4 border-[#d63638] bg-red-50 px-3 py-2 text-sm text-red-800">{errorMsg}</p>}

      <div className="bg-white border border-[#ccd0d4] rounded-md overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-white text-left font-bold border-b border-[#ccd0d4]">
              <th className="p-4">Artigo</th>
              <th className="p-4 whitespace-nowrap">Autor</th>
              <th className="p-4 whitespace-nowrap">Data</th>
              <th className="p-4 whitespace-nowrap text-right">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center"><Spinner size={32} className=" mx-auto" /></td></tr>
            ) : news.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-500">Ainda não há notícias publicadas.</td></tr>
            ) : (
              news.map((item) => (
                <tr key={item.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7]">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} className="w-12 h-12 object-cover border border-gray-200" alt="" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 border border-gray-200" />
                      )}
                      <div>
                        <Link href={`/admin/noticias/editar/${item.id}`} className="text-[#2271b1] font-bold text-[14px] hover:underline block">
                          {item.title}
                        </Link>
                        <span className="text-[11px] text-gray-400 capitalize">{item.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap text-[#50575e]">{item.author_name || '—'}</td>
                  <td className="p-4 whitespace-nowrap text-[#50575e]">{new Date(item.date).toLocaleDateString('pt-PT')}</td>
                  <td className="p-4 text-right space-x-2">
                    <Link href={`/admin/noticias/editar/${item.id}`} aria-label="Editar" className="inline-flex p-1.5 text-[#2271b1] hover:bg-blue-50 rounded max-md:h-11 max-md:w-11 max-md:items-center max-md:justify-center">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <Link href={`/noticias/${item.slug}`} target="_blank" aria-label="Ver no site" className="inline-flex p-1.5 text-[#50575e] hover:bg-gray-100 rounded max-md:h-11 max-md:w-11 max-md:items-center max-md:justify-center">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
