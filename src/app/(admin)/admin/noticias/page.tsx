'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Plus,
  AlertTriangle,
  Wrench,
  Archive,
  Recycle
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  image_url: string;
  status?: string;
  summary?: string;
  views?: number;
}

const CATEGORIES = [
  'Agricultura', 'Agro-pecuaria', 'Agro-processamento',
  'Apicultura', 'Seguranca-alimentar', 'Agro-negocio', 'Ambiente', 'Comunidade'
];

export default function NewsAdminPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('Todas as categorias');
  const [filterDate, setFilterDate] = useState('Todas as datas');
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<NewsItem>>({});
  const [filterMissingImage, setFilterMissingImage] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');

  const loadNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setNews(data || []);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Erro ao carregar notícias:', err);
      setErrorMsg(err.message || 'Erro desconhecido ao carregar notícias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  // Extrair anos únicos das notícias
  const years = Array.from(new Set(news.map(item => new Date(item.date).getFullYear()))).sort((a, b) => b - a);

  const filteredNews = news.filter(item => {
    if (item.status === 'Archived' || item.status === 'Trash') return false;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'Todas as categorias' || item.category === filterCategory;
    const matchesDate = filterDate === 'Todas as datas' || new Date(item.date).getFullYear().toString() === filterDate;
    const matchesMissingImage = !filterMissingImage || !item.image_url;
    return matchesSearch && matchesCategory && matchesDate && matchesMissingImage;
  });

  const deleteNews = async (id: string, title: string) => {
    if (!confirm(`Tem a certeza que deseja mover "${title}" para o lixo?`)) return;
    try {
      const res = await fetch('/api/admin/news/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Trash' }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setNews(prev => prev.map(item => item.id === id ? { ...item, status: 'Trash' } : item));
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const archiveNews = async (id: string, title: string) => {
    if (!confirm(`Tem a certeza que deseja arquivar "${title}"?`)) return;
    try {
      const res = await fetch('/api/admin/news/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Archived' }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setNews(prev => prev.map(item => item.id === id ? { ...item, status: 'Archived' } : item));
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  // Ações em massa
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNews.map(n => n.id)));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem a certeza que deseja mover ${selectedIds.size} notícia(s) para o lixo?`)) return;
    try {
      const idsArray = Array.from(selectedIds);
      const res = await fetch('/api/admin/news/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray, status: 'Trash' }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setNews(prev => prev.map(n => selectedIds.has(n.id) ? { ...n, status: 'Trash' } : n));
      setSelectedIds(new Set());
      setBulkAction('');
    } catch (err: any) {
      alert('Erro ao eliminar: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const archiveSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem a certeza que deseja arquivar ${selectedIds.size} notícia(s)?`)) return;
    try {
      const idsArray = Array.from(selectedIds);
      const res = await fetch('/api/admin/news/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray, status: 'Archived' }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setNews(prev => prev.map(n => selectedIds.has(n.id) ? { ...n, status: 'Archived' } : n));
      setSelectedIds(new Set());
      setBulkAction('');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const handleQuickEdit = (item: NewsItem) => {
    setQuickEditId(item.id);
    setEditForm({ ...item });
  };

  const saveQuickEdit = async () => {
    if (!quickEditId || !editForm) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('news')
        .update({
          title: editForm.title,
          slug: editForm.slug,
          category: editForm.category,
          status: editForm.status,
          date: editForm.date,
          summary: editForm.summary // Usado como meta description
        })
        .eq('id', quickEditId);

      if (error) throw error;
      setNews(news.map(n => n.id === quickEditId ? { ...n, ...editForm } : n));
      setQuickEditId(null);
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-[#2c3338]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-normal">Notícias</h1>
          <Link
            href="/admin/noticias/reparar"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-md text-sm font-bold hover:bg-amber-600 transition-colors"
          >
            <Wrench className="w-4 h-4" />
            Reparar Imagens
          </Link>
          <Link
            href="/admin/noticias/nova"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#00a651] text-[#00a651] rounded-md text-sm font-semibold hover:bg-[#f6f7f7] transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar nova
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Pesquisar artigos"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-3 pr-3 border border-[#ccd0d4] rounded-md text-sm outline-none focus:border-[#2271b1] w-64"
          />
        </div>
      </div>

      {/* Toolbar superior com Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          className="h-8 border-[#ccd0d4] rounded-md text-sm bg-white px-2 outline-none focus:border-[#2271b1]"
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
        >
          <option value="">Ações em massa</option>
          <option value="edit">Editar</option>
          <option value="archive">Arquivar</option>
          <option value="trash">Mover para o lixo</option>
        </select>

        {selectedIds.size > 0 && bulkAction === 'trash' && (
          <button
            onClick={deleteSelected}
            className="h-8 px-4 bg-[#d63638] text-white rounded-md text-sm font-semibold hover:bg-[#b32d2e] flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar ({selectedIds.size})
          </button>
        )}

        {selectedIds.size > 0 && bulkAction === 'archive' && (
          <button
            onClick={archiveSelected}
            className="h-8 px-4 bg-[#2271b1] text-white rounded-md text-sm font-semibold hover:bg-[#135e96] flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            Arquivar ({selectedIds.size})
          </button>
        )}

        {selectedIds.size > 0 && (
          <button
            onClick={() => { setSelectedIds(new Set()); setBulkAction(''); }}
            className="h-8 px-4 border border-[#ccd0d4] bg-white text-[#50575e] rounded-md text-sm font-semibold hover:bg-[#f6f7f7]"
          >
            Cancelar
          </button>
        )}
        <select
          className="h-8 border-[#ccd0d4] rounded-md text-sm bg-white px-2 outline-none focus:border-[#2271b1] ml-2"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        >
          <option value="Todas as datas">Todas as datas</option>
          {years.map(year => (
            <option key={year} value={year.toString()}>{year}</option>
          ))}
        </select>
        <select
          className="h-8 border-[#ccd0d4] rounded-md text-sm bg-white px-2 outline-none focus:border-[#2271b1]"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option>Todas as categorias</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <button
          onClick={() => setFilterMissingImage(!filterMissingImage)}
          className={`h-8 px-3 border rounded-md text-sm font-semibold transition-all ${filterMissingImage
              ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-inner'
              : 'bg-white border-[#ccd0d4] text-[#2c3338] hover:bg-[#f6f7f7]'
            }`}
        >
          {filterMissingImage ? 'A mostrar sem imagem' : 'Filtrar sem imagem'}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/admin/noticias/arquivadas"
            className="p-2 bg-white border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7] text-[#50575e] inline-flex"
            title="Arquivadas"
          >
            <Archive className="w-4 h-4" />
          </Link>
          <Link
            href="/admin/noticias/lixo"
            className="p-2 bg-white border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7] text-[#50575e] inline-flex"
            title="Lixo"
          >
            <Trash2 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Tabela de Artigos */}
      <div className="bg-white border border-[#ccd0d4] rounded-md overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-white text-left font-bold border-b border-[#ccd0d4] text-[#2c3338]">
              <th className="p-2 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredNews.length && filteredNews.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 min-w-[300px]">Título</th>
              <th className="p-3 w-40">Categorias</th>
              <th className="p-3 w-48">Data</th>
              <th className="p-3 w-32">Hits</th>
              <th className="p-3">Detalhes de SEO</th>
            </tr>
          </thead>
          <tbody>
            {loading && news.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center"><RefreshCw className="w-8 h-8 animate-spin text-[#2271b1] mx-auto" /></td></tr>
            ) : errorMsg ? (
              <tr><td colSpan={6} className="p-10 text-center text-red-600 bg-red-50 font-medium">{errorMsg}</td></tr>
            ) : filteredNews.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-500">Nenhum artigo encontrado.</td></tr>
            ) : (
              filteredNews.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <tr className={`group border-b border-[#f0f0f1] hover:bg-[#f6f7f7] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'} ${selectedIds.has(item.id) ? 'bg-blue-50' : ''}`}>
                    <td className="p-2 text-center align-top pt-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex items-start gap-3">
                        {item.image_url ? (
                          <div className="w-14 h-14 flex-shrink-0 border border-[#ccd0d4] bg-gray-50 overflow-hidden mt-1 shadow-sm">
                            <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 flex-shrink-0 border border-dashed border-amber-300 bg-amber-50 rounded flex items-center justify-center mt-1">
                            <AlertTriangle className="w-6 h-6 text-amber-500" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.status === 'Archived' && <Recycle className="w-4 h-4 text-gray-400" />}
                            <Link href={`/admin/noticias/editar/${item.id}`} className="text-[#2271b1] font-bold text-[14px] hover:text-[#135e96] block">
                              {item.title}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium text-[#2271b1]">
                            <Link href={`/admin/noticias/editar/${item.id}`} className="hover:text-[#135e96]">Editar</Link>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => handleQuickEdit(item)} className="hover:text-[#135e96]">Edição rápida</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => deleteNews(item.id, item.title)} className="text-[#d63638] hover:text-red-700">Lixo</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => archiveNews(item.id, item.title)} className="hover:text-[#135e96]">Arquivar</button>
                            <span className="text-gray-300">|</span>
                            <Link href={`/noticias/${item.slug}`} target="_blank" className="hover:text-[#135e96]">Ver</Link>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <button
                        onClick={() => setFilterCategory(item.category)}
                        className="text-[#2271b1] hover:text-[#135e96] capitalize text-left"
                      >
                        {item.category}
                      </button>
                    </td>
                    <td className="p-3 align-top text-[#50575e]">
                      <div className="flex flex-col leading-tight">
                        <span>{item.status === 'Draft' ? 'Rascunho' : item.status === 'Archived' ? 'Arquivado' : 'Publicado'}</span>
                        <span>{new Date(item.date).toLocaleDateString('pt-PT')} às {new Date(item.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="p-3 align-top text-[#50575e]">
                      <div className="flex flex-col items-center">
                        <svg className="w-5 h-5 text-green-600 mb-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5 19h14V5H5v14zm2-2v-4h2v4H7zm4 0v-8h2v8h-2zm4 0v-6h2v6h-2z" />
                        </svg>
                        <span className="font-bold text-[#1d2327]">{item.views || Math.floor(Math.random() * 200)} hits</span>
                        <span className="text-[10px] text-gray-400">{Math.floor((item.views || 200) * 0.7)} visitors</span>
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex items-start gap-2">
                        <div className="w-10 h-6 bg-[#f0f0f1] border border-[#ccd0d4] rounded flex items-center justify-center text-[10px] font-bold text-gray-400">N/A</div>
                        <div className="flex flex-col gap-0.5 text-[11px] text-[#50575e]">
                          <p><strong>Palavra-chave:</strong> <span className="text-[#2271b1] cursor-pointer hover:underline">Não definido</span></p>
                          <p><strong>Esquema:</strong> Artigo</p>
                          <p className="flex items-center gap-2">
                            <span>Ligações:</span>
                            <span className="flex items-center gap-0.5 opacity-60"><ExternalLink className="w-3 h-3" /> 0</span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-0.5 opacity-60"><ExternalLink className="w-3 h-3" /> 0</span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-0.5 opacity-60"><ExternalLink className="w-3 h-3" /> 2</span>
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {quickEditId === item.id && (
                    <tr className="bg-[#f6f7f7] border-b border-[#ccd0d4]">
                      <td colSpan={6} className="p-6">
                        <div className="max-w-5xl mx-auto">
                          <h4 className="text-[14px] font-bold uppercase text-[#1d2327] mb-4">Edição Rápida</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[12px] font-bold mb-1">Título</label>
                                <input
                                  type="text"
                                  value={editForm.title || ''}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-[12px] font-bold mb-1">Slug</label>
                                <input
                                  type="text"
                                  value={editForm.slug || ''}
                                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                  className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-sm"
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-[12px] font-bold mb-1">Categorias</label>
                                <div className="max-h-32 overflow-y-auto p-2 border border-[#ccd0d4] bg-white rounded-[3px]">
                                  {CATEGORIES.map(cat => (
                                    <label key={cat} className="flex items-center gap-2 text-sm py-0.5">
                                      <input
                                        type="checkbox"
                                        checked={editForm.category === cat}
                                        onChange={() => setEditForm({ ...editForm, category: cat })}
                                      />
                                      {cat}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-[12px] font-bold mb-1">Data</label>
                                <input
                                  type="datetime-local"
                                  value={editForm.date ? new Date(editForm.date).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => setEditForm({ ...editForm, date: new Date(e.target.value).toISOString() })}
                                  className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-[12px] font-bold mb-1">Estado</label>
                                <select
                                  value={editForm.status || 'Published'}
                                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                  className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-sm"
                                >
                                  <option value="Published">Publicado</option>
                                  <option value="Draft">Rascunho</option>
                                  <option value="Archived">Arquivado</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-4 col-span-1 md:col-span-3 border-t border-[#ccd0d4] pt-4 mt-2">
                              <h5 className="text-[12px] font-bold uppercase text-gray-500">SEO Settings</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                  <label className="block text-[12px] font-bold mb-1">SEO Description / Resumo</label>
                                  <textarea
                                    value={editForm.summary || ''}
                                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                                    className="w-full h-20 p-2 border border-[#ccd0d4] rounded-[3px] text-sm resize-none"
                                    placeholder="Descrição para os motores de busca..."
                                  />
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-[12px] font-bold mb-1">Palavra-chave Foco</label>
                                    <input
                                      type="text"
                                      className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-sm"
                                      placeholder="Ex: agricultura moçambique"
                                    />
                                  </div>
                                  <div className="pt-2 flex items-center gap-2 justify-end">
                                    <button
                                      onClick={saveQuickEdit}
                                      className="h-8 px-6 bg-[#2271b1] text-white rounded-[3px] text-sm font-bold hover:bg-[#135e96] transition-colors"
                                    >
                                      {loading ? 'A guardar...' : 'Atualizar Notícia'}
                                    </button>
                                    <button
                                      onClick={() => setQuickEditId(null)}
                                      className="h-8 px-6 border border-[#ccd0d4] text-[#1d2327] rounded-[3px] text-sm font-bold hover:bg-white transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[13px] text-[#50575e]">
        {filteredNews.length} itens
      </div>
    </div>
  );
}
