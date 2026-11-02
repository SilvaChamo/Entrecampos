'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle, Trash2, RefreshCw, AlertTriangle, Clock, Eye } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

interface NewsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  image_url: string;
  status: string;
  author_name?: string;
}

export default function PendingNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/news/list', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar as notícias.');
      setNews((data.items as NewsItem[]).filter((n) => String(n.status).toLowerCase() === 'pending'));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Publicar (ou enviar para o lixo) grava o novo estado no servidor, que confirma se o papel pode fazê-lo.
  const setStatus = async (id: string, status: 'published' | 'trash') => {
    if (status === 'trash' && !confirm('Enviar esta notícia para o lixo?')) return;
    setBusy(id);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/news/status', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível actualizar a notícia.');
      setNews((list) => list.filter((n) => n.id !== id));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao actualizar.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-normal flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-500" />
            Notícias Pendentes de Revisão
          </h1>
          <p className="text-sm text-gray-500 mt-1">Artigos submetidos por visitantes e contribuidores que aguardam aprovação.</p>
        </div>
      </div>

      {errorMsg && <p className="mb-4 border-l-4 border-[#d63638] bg-red-50 px-3 py-2 text-sm text-red-800">{errorMsg}</p>}

      <div className="bg-white border border-[#ccd0d4] rounded-md overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-white text-left font-bold border-b border-[#ccd0d4] text-[#2c3338]">
              <th className="p-4 whitespace-nowrap">Artigo</th>
              <th className="p-4 whitespace-nowrap">Autor</th>
              <th className="p-4 whitespace-nowrap">Data de Submissão</th>
              <th colSpan={3} className="p-4 whitespace-nowrap text-center">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-10 text-center"><Spinner size={32} className=" mx-auto" /></td></tr>
            ) : news.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-500 py-20">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-20" />
                Não existem notícias pendentes de momento.
              </td></tr>
            ) : (
              news.map((item) => (
                <tr key={item.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7] group">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} className="w-12 h-12 object-cover border border-gray-200" alt="" />
                      ) : (
                        <div className="w-12 h-12 bg-amber-50 border border-amber-200 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                      )}
                      <div>
                        <Link href={`/admin/noticias/editar/${item.id}`} className="text-[#2271b1] font-bold text-[14px] hover:underline block">
                          {item.title}
                        </Link>
                        <span className="text-[11px] text-gray-400 capitalize">{item.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap text-[#50575e] font-medium">{item.author_name || '—'}</td>
                  <td className="p-4 text-[#50575e]">{new Date(item.date).toLocaleDateString('pt-PT')}</td>
                  <td className="py-4 pl-4 pr-1 text-center">
                    <button
                      disabled={busy === item.id}
                      onClick={() => setStatus(item.id, 'published')}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-md text-[12px] font-bold hover:bg-green-700 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60 max-md:min-h-11"
                    >
                      <CheckCircle className="w-4 h-4" /> Publicar
                    </button>
                  </td>
                  <td className="py-4 px-1 text-center">
                    <Link
                      href={`/admin/noticias/editar/${item.id}`}
                      className="px-3 py-1.5 bg-white border border-[#ccd0d4] text-[#2c3338] rounded-md text-[12px] font-bold hover:bg-[#f6f7f7] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap max-md:min-h-11"
                    >
                      <Eye className="w-4 h-4" /> Rever
                    </Link>
                  </td>
                  <td className="py-4 pl-1 pr-4 text-center">
                    <button
                      disabled={busy === item.id}
                      onClick={() => setStatus(item.id, 'trash')}
                      aria-label="Enviar para o lixo"
                      className="p-1.5 text-[#d63638] hover:bg-red-50 rounded transition-colors disabled:opacity-60 max-md:flex max-md:h-11 max-md:w-11 max-md:items-center max-md:justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[13px] text-gray-500">{news.length} artigos aguardando revisão</div>
    </div>
  );
}
