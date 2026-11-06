'use client';

import React, { useState, useEffect } from 'react';
import { adminCacheGet, adminCacheSet, cachedNewsWithStatus } from '@/lib/admin-cache';
import Link from 'next/link';
import { RefreshCw, RotateCcw, Trash2, Archive, AlertTriangle } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  image_url: string;
  status?: string;
}

export default function ArquivadasPage() {
  const [news, setNews] = useState<NewsItem[]>(() => cachedNewsWithStatus<NewsItem>('archived'));
  const [loading, setLoading] = useState(() => adminCacheGet('news') === undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirmação na própria página: os diálogos nativos do navegador podem não aparecer e a acção ficava sem efeito.
  const [ask, setAsk] = useState<{ text: string; done: (ok: boolean) => void } | null>(null);
  const confirmAsync = (text: string) => new Promise<boolean>((done) => setAsk({ text, done }));

  const loadNews = async () => {
    // Já há cópia guardada: mostra-se logo e actualiza-se em segundo plano.
    if (adminCacheGet('news') === undefined) setLoading(true);
    // Lê no servidor: com a chave pública do navegador as notícias que não estão publicadas não aparecem.
    try {
      const res = await fetch('/api/admin/news/list', { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) adminCacheSet('news', body.items || []);
      if (res.ok) setNews(((body.items || []) as NewsItem[]).filter((n) => String(n.status || '').toLowerCase() === 'archived'));
    } catch { /* mantém a lista */ }
    setLoading(false);
  };

  useEffect(() => { loadNews(); }, []);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.size === news.length ? new Set() : new Set(news.map(n => n.id)));
  };

  const restore = async (ids: string[]) => {
    if (!(await confirmAsync(`Restaurar ${ids.length} notícia(s)?`))) return;
    const res = await fetch('/api/admin/news/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, status: 'Published' }),
    });
    if (res.ok) {
      setNews(prev => prev.filter(n => !ids.includes(n.id)));
      setSelectedIds(new Set());
    } else {
      const err = await res.json();
      alert('Erro: ' + err.error);
    }
  };

  const deletePermanently = async (ids: string[]) => {
    if (!(await confirmAsync(`Eliminar permanentemente ${ids.length} notícia(s)? Esta acção não pode ser revertida.`))) return;
    const res = await fetch('/api/admin/news/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setNews(prev => prev.filter(n => !ids.includes(n.id)));
      setSelectedIds(new Set());
    } else {
      const err = await res.json();
      alert('Erro: ' + err.error);
    }
  };

  return (
    <div className="ec-page text-[#2c3338]">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-[23px] font-normal text-[#1d2327] flex items-center gap-2">
          <Archive className="w-5 h-5 text-gray-500" /> Notícias Arquivadas
        </h1>
        <span className="text-sm text-gray-400">({news.length} itens)</span>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <span className="text-sm font-medium text-blue-700">{selectedIds.size} seleccionado(s)</span>
          <button
            onClick={() => restore(Array.from(selectedIds))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00a651] text-white text-sm rounded-md hover:bg-[#008f46]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
          </button>
          <button
            onClick={() => deletePermanently(Array.from(selectedIds))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d63638] text-white text-sm rounded-md hover:bg-[#b32d2e]"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar permanentemente
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
        </div>
      )}

      <div className="bg-white border border-[#ccd0d4] rounded-md overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-white text-left font-bold border-b border-[#ccd0d4] text-[#2c3338]">
              <th className="p-3 w-10 text-center"><input type="checkbox" checked={selectedIds.size === news.length && news.length > 0} onChange={toggleAll} /></th>
              <th className="p-3">Título</th>
              <th className="p-3 w-40">Categoria</th>
              <th className="p-3 w-44">Data</th>
              <th className="p-3 w-48 text-center">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center"><Spinner size={24} className="mx-auto" /></td></tr>
            ) : news.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-400">Nenhuma notícia arquivada.</td></tr>
            ) : news.map((item, idx) => (
              <tr key={item.id} className={`group border-b border-[#f0f0f1] hover:bg-[#f6f7f7] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'} ${selectedIds.has(item.id) ? 'bg-green-50' : ''}`}>
                <td className="p-3 text-center"><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} className="w-10 h-10 object-cover border border-[#ccd0d4] flex-shrink-0" alt="" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                    <span className="font-medium text-[#1d2327]">{item.title}</span>
                  </div>
                </td>
                <td className="p-3 text-[#50575e] capitalize">{item.category}</td>
                <td className="p-3 text-[#50575e]">{new Date(item.date).toLocaleDateString('pt-PT')}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => restore([item.id])}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-[#00a651] text-white rounded hover:bg-[#008f46]"
                    >
                      <RotateCcw className="w-3 h-3" /> Restaurar
                    </button>
                    <button
                      onClick={() => deletePermanently([item.id])}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-white border border-[#d63638] text-[#d63638] rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ask && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Confirmar">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
            <p className="text-center text-sm text-[#3c434a]">{ask.text}</p>
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" onClick={() => { ask.done(false); setAsk(null); }} className="rounded-[3px] border border-[#ccd0d4] bg-white px-4 py-1.5 text-sm font-semibold text-[#50575e] hover:bg-[#f6f7f7]">Cancelar</button>
              <button type="button" onClick={() => { ask.done(true); setAsk(null); }} className="rounded-[3px] bg-[#d63638] px-5 py-1.5 text-sm font-semibold text-white hover:bg-[#b32d2e]">Sim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
