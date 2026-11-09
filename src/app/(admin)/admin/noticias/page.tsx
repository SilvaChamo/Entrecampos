'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { SkeletonTableRow, SkeletonHeader } from '@/components/Admin/Skeleton';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';
import AdminSelect from '@/components/Admin/AdminSelect';
import { useAuth } from '@/context/AuthContext';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  categories?: string[] | null;
  date: string;
  image_url: string;
  status?: string;
  summary?: string;
  views?: number;
}

type CategoryOption = { slug: string; label: string };

/** Mesma regra do site (lib/news-data.ts): é assim que "Sector público" e o antigo "sector-agrario" são a mesma categoria. */
const slugOf = (value: string | undefined | null) => {
  const slug = String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug === 'entrevsta' ? 'entrevista' : slug === 'sector-agrario' ? 'sector-publico' : slug; // entrevsta: erro de escrita antigo; Sector agrário passou a Sector público
};

/** Todas as categorias da notícia, a principal primeiro (sem repetições). */
const itemCategories = (item: { category?: string; categories?: string[] | null }) =>
  [...new Set([item.category, ...(Array.isArray(item.categories) ? item.categories : [])].map((c) => slugOf(c)).filter(Boolean))];

/** Verificações de SEO com o que está realmente guardado na notícia (título, resumo, imagem, endereço). */
function seoChecks(n: NewsItem) {
  const titulo = (n.title || '').trim().length;
  const resumo = (n.summary || '').trim().length;
  return [
    { id: 'titulo', label: 'Título', detalhe: `${titulo} caracteres (ideal: 30 a 65)`, ok: titulo >= 30 && titulo <= 65 },
    { id: 'resumo', label: 'Descrição (resumo)', detalhe: resumo ? `${resumo} caracteres (ideal: 70 a 160)` : 'Sem descrição', ok: resumo >= 70 && resumo <= 160 },
    { id: 'imagem', label: 'Imagem de destaque', detalhe: n.image_url ? 'Tem imagem' : 'Sem imagem', ok: !!n.image_url },
    { id: 'endereco', label: 'Endereço', detalhe: n.slug ? `/noticias/${n.slug}` : 'Sem endereço', ok: !!n.slug },
  ];
}

const SEP = "max-md:before:content-['·_'] max-md:before:text-gray-400";
const LBL = "max-md:before:font-normal max-md:before:text-gray-500 max-md:before:content-[attr(data-label)_':_']";

export default function NewsAdminPage() {
  const [news, setNews] = useState<NewsItem[]>(() => adminCacheGet<NewsItem[]>('news') ?? []);
  // Confirmação na própria página: os diálogos nativos do navegador podem não aparecer e a acção ficava sem efeito.
  const { user } = useAuth();
  const router = useRouter();
  // Agendar na newsletter: escolher a que envio agendado se junta a notícia (só o administrador).
  const [sched, setSched] = useState<{ item: NewsItem; slots: { id: string; at: string; slugs: string[] }[] | null; msg: string | null; err: boolean } | null>(null);
  const openSchedule = async (item: NewsItem) => {
    setSched({ item, slots: null, msg: null, err: false });
    try {
      const res = await fetch('/api/admin/newsletter/agenda', { credentials: 'include', cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status}.`);
      // Sem nenhum envio agendado não há onde juntar a notícia: leva logo ao separador Agendamento da newsletter.
      if (!Array.isArray(body.schedules) || body.schedules.length === 0) {
        setSched(null);
        router.push('/admin/newsletter?aba=agenda');
        return;
      }
      setSched({ item, slots: body.schedules, msg: null, err: false });
    } catch (e) {
      setSched({ item, slots: [], msg: e instanceof Error ? e.message : 'Não foi possível carregar os horários.', err: true });
    }
  };
  const attachToSchedule = async (slotId: string) => {
    if (!sched) return;
    try {
      const res = await fetch('/api/admin/newsletter/agenda', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: slotId, add: sched.item.slug }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status}.`);
      setSched({ ...sched, slots: sched.slots?.map((x) => (x.id === slotId ? body.schedule : x)) ?? null, msg: 'Notícia juntada a este envio.', err: false });
    } catch (e) {
      setSched({ ...sched, msg: e instanceof Error ? e.message : 'Não foi possível juntar a notícia.', err: true });
    }
  };
  const [ask, setAsk] = useState<{ text: string; done: (ok: boolean) => void } | null>(null);
  const confirmAsync = (text: string) => new Promise<boolean>((done) => setAsk({ text, done }));
  const [loading, setLoading] = useState(() => adminCacheGet('news') === undefined);
  // Categorias reais (as do menu e as que já têm notícias): vêm do servidor, não de uma lista fixa.
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(() => adminCacheGet<CategoryOption[]>('category-options') ?? []);
  useEffect(() => {
    fetch('/api/admin/categories', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.options) return;
        adminCacheSet('category-options', data.options);
        setCategoryOptions(data.options as CategoryOption[]);
      })
      .catch(() => {});
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  // Ids das notícias que contêm a pesquisa em qualquer parte do texto (o servidor procura no corpo, não só no título).
  const [searchIds, setSearchIds] = useState<Set<string> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('Todas as categorias');
  // Vindo da página de Categorias (?categoria=<slug>) a lista abre já filtrada; o menu "Todas as Notícias" volta a mostrá-las todas.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('categoria');
    if (fromUrl) setFilterCategory(fromUrl);
    const onNav = (e: Event) => {
      const href = String((e as CustomEvent).detail || '');
      if (href === '/admin/noticias') setFilterCategory('Todas as categorias');
    };
    window.addEventListener('ec-nav', onNav);
    return () => window.removeEventListener('ec-nav', onNav);
  }, []);
  const [filterDate, setFilterDate] = useState('Todas as datas');
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [seoItem, setSeoItem] = useState<NewsItem | null>(null); // popup com o SEO desta notícia
  const [editForm, setEditForm] = useState<Partial<NewsItem>>({});
  const [filterMissingImage, setFilterMissingImage] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');

  const [localCopy, setLocalCopy] = useState(false);
  const [page, setPage] = useState(1);
  // Notícias por página: 30 (por defeito), 50, 100, 200 ou todas; a escolha fica guardada neste browser.
  const PER_PAGE_OPTIONS = [10, 30, 50, 100, 200, 0]; // 0 = todas numa única página
  const [perPage, setPerPage] = useState(30);
  useEffect(() => {
    const raw = localStorage.getItem('ec-admin-news-perpage');
    if (raw !== null && PER_PAGE_OPTIONS.includes(Number(raw))) setPerPage(Number(raw));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNews = async () => {
    // Já há cópia guardada: mostra-se logo e actualiza-se em segundo plano, sem voltar ao ecrã de espera.
    if (adminCacheGet('news') === undefined) setLoading(true);
    try {
      // O servidor decide quem pode ver (sessão + permissão) e lê do Supabase; sem Supabase usa a cópia local.
      const res = await fetch('/api/admin/news/list', { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao carregar notícias.`);
      adminCacheSet('news', body.items || []);
      setNews(body.items || []);
      setLocalCopy(body.source === 'local');
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Erro ao carregar notícias:', err?.message || err);
      setErrorMsg(err?.message || 'Erro desconhecido ao carregar notícias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchIds(null);
      return;
    }
    let alive = true;
    setSearchIds(null);
    const timer = setTimeout(() => {
      fetch(`/api/admin/news/list?q=${encodeURIComponent(q)}&ids=1`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => alive && data && setSearchIds(new Set((data.ids as string[]).map(String))))
        .catch(() => {});
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Extrair anos únicos das notícias
  const years = Array.from(new Set(news.map(item => new Date(item.date).getFullYear()))).sort((a, b) => b - a);

  const filteredNews = news.filter(item => {
    if (item.status === 'Archived' || item.status === 'Trash') return false;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || !!searchIds?.has(String(item.id));
    const matchesCategory = filterCategory === 'Todas as categorias' || itemCategories(item).includes(slugOf(filterCategory));
    const matchesDate = filterDate === 'Todas as datas' || new Date(item.date).getFullYear().toString() === filterDate;
    const matchesMissingImage = !filterMissingImage || !item.image_url;
    return matchesSearch && matchesCategory && matchesDate && matchesMissingImage;
  });

  const pageSize = perPage === 0 ? Math.max(filteredNews.length, 1) : perPage;
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleNews = filteredNews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Voltar à primeira página quando os filtros mudam.
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterCategory, filterDate, filterMissingImage, perPage]);

  const pager = (
    <div className="flex flex-col-reverse gap-2 max-md:gap-0 md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-1 text-[13px] text-[#50575e]">
      {/* Telemóvel: por baixo (por página e total). Ecrã grande: à esquerda dos botões, como sempre. */}
      <div className="flex items-center gap-3 max-md:hidden md:contents">
      <label className="md:mr-3 flex items-center gap-1.5">
        Por página:
        <AdminSelect
          value={perPage}
          onChange={(e) => {
            const value = Number(e.target.value);
            setPerPage(value);
            localStorage.setItem('ec-admin-news-perpage', String(value));
          }}
          className="h-9 max-md:h-11 border border-[#ccd0d4] bg-white px-1.5 text-[13px] text-[#2c3338]"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n === 0 ? 'Todas' : n}
            </option>
          ))}
        </AdminSelect>
      </label>
      <span className="md:mr-2">{filteredNews.length} itens</span>
      </div>
      {/* Paginação completa: no telemóvel em cima, a ocupar a largura toda */}
      <div className="flex items-center gap-1 max-md:w-full md:contents">
      {[
        { label: '«', title: 'Primeira página', to: 1, off: currentPage === 1 },
        { label: '‹', title: 'Anterior', to: currentPage - 1, off: currentPage === 1 },
      ].map((b) => (
        <button key={b.title} type="button" title={b.title} disabled={b.off} onClick={() => setPage(b.to)}
          className="h-9 max-md:h-11 max-md:flex-1 min-w-9 border border-[#ccd0d4] bg-white px-2 hover:border-[#00a651] hover:text-[#008f45] disabled:opacity-40 disabled:hover:border-[#ccd0d4] disabled:hover:text-inherit">
          {b.label}
        </button>
      ))}
      <span className="mx-1 whitespace-nowrap max-md:flex-[2] max-md:text-center"><span className="md:hidden">pág. {currentPage}/{totalPages}</span><span className="hidden md:inline">Página {currentPage} de {totalPages}</span></span>
      {[
        { label: '›', title: 'Seguinte', to: currentPage + 1, off: currentPage >= totalPages },
        { label: '»', title: 'Última página', to: totalPages, off: currentPage >= totalPages },
      ].map((b) => (
        <button key={b.title} type="button" title={b.title} disabled={b.off} onClick={() => setPage(b.to)}
          className="h-9 max-md:h-11 max-md:flex-1 min-w-9 border border-[#ccd0d4] bg-white px-2 hover:border-[#00a651] hover:text-[#008f45] disabled:opacity-40 disabled:hover:border-[#ccd0d4] disabled:hover:text-inherit">
          {b.label}
        </button>
      ))}
      </div>
    </div>
  );

  // Em cima só as duas setas; todas as informações da paginação ficam por baixo da lista.
  const topPager = (
    <div className="flex items-center gap-1 text-[13px] text-[#50575e]">
      <button type="button" title="Anterior" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}
        className="h-9 max-md:h-11 min-w-9 border border-[#ccd0d4] bg-white px-2 hover:border-[#00a651] hover:text-[#008f45] disabled:opacity-40 disabled:hover:border-[#ccd0d4] disabled:hover:text-inherit">
        ‹
      </button>
      <span className="mx-1 whitespace-nowrap">{currentPage} de {totalPages}</span>
      <button type="button" title="Seguinte" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}
        className="h-9 max-md:h-11 min-w-9 border border-[#ccd0d4] bg-white px-2 hover:border-[#00a651] hover:text-[#008f45] disabled:opacity-40 disabled:hover:border-[#ccd0d4] disabled:hover:text-inherit">
        ›
      </button>
    </div>
  );

  const deleteNews = async (id: string, title: string) => {
    if (!(await confirmAsync(`Tem a certeza que deseja mover "${title}" para o lixo?`))) return;
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
    if (!(await confirmAsync(`Tem a certeza que deseja arquivar "${title}"?`))) return;
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

  // Acções em massa
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (visibleNews.every((n) => selectedIds.has(n.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleNews.map(n => n.id)));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!(await confirmAsync(`Tem a certeza que deseja mover ${selectedIds.size} notícia(s) para o lixo?`))) return;
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
    if (!(await confirmAsync(`Tem a certeza que deseja arquivar ${selectedIds.size} notícia(s)?`))) return;
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
    setEditForm({ ...item, categories: itemCategories(item) });
  };

  const saveQuickEdit = async () => {
    if (!quickEditId || !editForm) return;
    setLoading(true);
    try {
      // Grava no servidor: com a chave pública do navegador a base recusa a alteração sem dar erro, e a notícia ficava na
      // categoria antiga. Podem ser várias: a primeira é a principal.
      const res = await fetch('/api/admin/news/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEdit: true,
          id: quickEditId,
          title: editForm.title,
          slug: editForm.slug,
          category: editForm.category,
          categories: itemCategories(editForm),
          date: editForm.date,
          summary: editForm.summary, // Usado como meta description
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status}`);
      const before = news.find(n => n.id === quickEditId);
      if (editForm.status && before && editForm.status !== before.status) {
        const st = await fetch('/api/admin/news/status', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: quickEditId, status: editForm.status }),
        });
        if (!st.ok) throw new Error((await st.json().catch(() => ({}))).error || `Erro ${st.status}`);
      }
      setNews(news.map(n => n.id === quickEditId ? { ...n, ...editForm } : n));
      setQuickEditId(null);
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ec-page text-[#2c3338]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-wrap items-center gap-3 md:gap-4 max-sm:grid max-sm:grid-cols-2">
          <h1 className="text-2xl font-normal w-full sm:w-auto max-sm:col-span-2">Notícias</h1>
          <Link
            href="/admin/noticias/reparar"
            className="flex h-9 items-center justify-center gap-1.5 whitespace-nowrap px-4 py-0 bg-amber-500 text-white rounded-md text-sm font-normal hover:bg-amber-600 transition-colors max-sm:px-2 max-sm:h-11 max-sm:py-0 max-sm:text-[12px]"
          >
            <Wrench className="w-4 h-4" />
            Reparar Imagens
          </Link>
          <Link
            href="/admin/noticias/nova"
            className="flex h-9 items-center justify-center gap-1.5 whitespace-nowrap px-4 py-0 bg-white border border-[#00a651] text-[#00a651] rounded-md text-sm font-normal hover:bg-[#f6f7f7] transition-all max-sm:px-2 max-sm:h-11 max-sm:py-0 max-sm:text-[12px]"
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
            className="h-9 pl-3 pr-3 border border-[#ccd0d4] rounded-md text-sm outline-none focus:border-[#00a651] w-full min-w-0 flex-1 md:w-64 md:flex-none max-md:h-11"
          />
          <Link
            href="/admin/noticias/arquivadas"
            className="h-9 w-9 p-0 bg-white border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7] text-[#50575e] inline-flex items-center justify-center max-md:h-11 max-md:w-11 max-md:p-0"
            title="Arquivadas"
          >
            <Archive className="w-4 h-4" />
          </Link>
          <Link
            href="/admin/noticias/lixo"
            className="h-9 w-9 p-0 bg-white border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7] text-[#50575e] inline-flex items-center justify-center max-md:h-11 max-md:w-11 max-md:p-0"
            title="Lixo"
          >
            <Trash2 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Toolbar superior com Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4 max-sm:grid max-sm:grid-cols-2">
        <AdminSelect
          className="h-9 max-sm:h-11 max-sm:w-full border-[#ccd0d4] rounded-md text-sm bg-white px-2 outline-none focus:border-[#00a651]"
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
        >
          <option value="">Acções em massa</option>
          <option value="edit">Editar</option>
          <option value="archive">Arquivar</option>
          <option value="trash">Mover para o lixo</option>
        </AdminSelect>

        {selectedIds.size > 0 && bulkAction === 'trash' && (
          <button
            onClick={deleteSelected}
            className="h-9 px-4 bg-[#d63638] text-white rounded-md text-sm font-semibold hover:bg-[#b32d2e] flex items-center gap-2 max-sm:col-span-2 max-sm:h-11 max-sm:justify-center"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar ({selectedIds.size})
          </button>
        )}

        {selectedIds.size > 0 && bulkAction === 'archive' && (
          <button
            onClick={archiveSelected}
            className="h-9 px-4 bg-[#00a651] text-white rounded-md text-sm font-semibold hover:bg-[#008f45] flex items-center gap-2 max-sm:col-span-2 max-sm:h-11 max-sm:justify-center"
          >
            <Archive className="w-4 h-4" />
            Arquivar ({selectedIds.size})
          </button>
        )}

        {selectedIds.size > 0 && (
          <button
            onClick={() => { setSelectedIds(new Set()); setBulkAction(''); }}
            className="h-9 px-4 border border-[#ccd0d4] bg-white text-[#50575e] rounded-md text-sm font-semibold hover:bg-[#f6f7f7] max-sm:col-span-2 max-sm:h-11 max-sm:justify-center"
          >
            Cancelar
          </button>
        )}
        <AdminSelect
          className="h-9 max-sm:h-11 max-sm:w-full max-sm:ml-0 border-[#ccd0d4] rounded-md text-sm bg-white px-2 outline-none focus:border-[#00a651] ml-2"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        >
          <option value="Todas as datas">Todas as datas</option>
          {years.map(year => (
            <option key={year} value={year.toString()}>{year}</option>
          ))}
        </AdminSelect>
        <AdminSelect
          className="h-9 max-sm:h-11 max-sm:w-full max-sm:col-span-2 border-[#ccd0d4] rounded-md text-sm bg-white px-2 outline-none focus:border-[#00a651]"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option>Todas as categorias</option>
          {categoryOptions.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.label}</option>)}
        </AdminSelect>

        <button
          onClick={() => setFilterMissingImage(!filterMissingImage)}
          className={`h-9 max-sm:h-11 max-sm:w-full max-sm:col-span-2 px-3 border rounded-md text-sm font-normal transition-all ${filterMissingImage
              ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-inner'
              : 'bg-white border-[#ccd0d4] text-[#2c3338] hover:bg-[#f6f7f7]'
            }`}
        >
          {filterMissingImage ? 'A mostrar sem imagem' : 'Filtrar sem imagem'}
        </button>

        {/* Paginação, na mesma linha dos botões de acção */}
        <div className="ml-auto max-sm:ml-0 max-sm:col-span-2">{topPager}</div>
      </div>

      {localCopy && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-[#dba617] bg-[#fcf9e8] px-4 py-3 text-[13px] text-[#50575e]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#dba617]" />
          <span>
            A mostrar a <strong>cópia local</strong> das notícias do site: o Supabase recusou o acesso (verifique as chaves em .env.local).
            Editar, arquivar ou apagar só funciona quando o Supabase responder.
          </span>
        </div>
      )}

      {/* Tabela de Artigos */}
      <div className="bg-white border border-[#ccd0d4] rounded-md overflow-hidden">
        <table className="ec-cards w-full border-collapse text-[13px] max-md:block">
          <thead className="max-md:hidden">
            <tr className="bg-white text-left font-bold border-b border-[#ccd0d4] text-[#2c3338]">
              <th className="p-2 w-10 text-center">
                <input
                  type="checkbox"
                  checked={visibleNews.length > 0 && visibleNews.every((n) => selectedIds.has(n.id))}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 min-w-[300px]">Título</th>
              <th className="p-3 w-40">Categorias</th>
              <th className="p-3 w-48">Data</th>
              <th className="p-3 w-32">Hits</th>
              <th className="p-3 w-24">SEO</th>
            </tr>
          </thead>
          <tbody className="max-md:block">
            {loading && news.length === 0 ? (
              <SkeletonTableRow columns={6} />
            ) : errorMsg ? (
              <tr><td colSpan={6} className="p-10 text-center text-red-600 bg-red-50 font-medium">{errorMsg}</td></tr>
            ) : filteredNews.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-500">Nenhum artigo encontrado.</td></tr>
            ) : (
              visibleNews.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <tr className={`group max-md:block max-md:p-3 border-b border-[#f0f0f1] hover:bg-[#f6f7f7] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'} ${selectedIds.has(item.id) ? 'bg-green-50' : ''}`}>
                    <td className="p-2 text-center align-top pt-4 max-md:block max-md:p-0 max-md:pb-2 max-md:text-left max-md:[&_input]:h-5 max-md:[&_input]:w-5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="p-3 align-top max-md:block max-md:p-0">
                      <div className="flex items-center gap-3 max-md:flex-col max-md:items-stretch max-md:gap-2">
                        {item.image_url ? (
                          <div className="w-14 h-14 flex-shrink-0 border border-[#ccd0d4] bg-gray-50 overflow-hidden shadow-sm max-md:h-44 max-md:w-full">
                            <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 flex-shrink-0 border border-dashed border-amber-300 bg-amber-50 rounded flex items-center justify-center max-md:h-24 max-md:w-full">
                            <AlertTriangle className="w-6 h-6 text-amber-500" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 min-w-0 max-md:w-full">
                          <div className="flex items-center gap-2">
                            {item.status === 'Archived' && <Recycle className="w-4 h-4 text-gray-400" />}
                            <Link href={`/admin/noticias/editar/${item.id}`} title={item.title} className="text-[#2271b1] font-bold text-[12px] min-[1500px]:text-[14px] leading-snug hover:text-[#135e96] line-clamp-2 break-words">
                              {item.title}
                            </Link>
                          </div>
                          <div className="flex flex-nowrap items-center gap-x-1.5 whitespace-nowrap md:invisible md:group-hover:visible [@media(hover:none)]:md:!visible text-[11px] leading-none font-medium text-[#2271b1]">
                            <Link href={`/admin/noticias/editar/${item.id}`} className="hover:text-[#135e96]">Editar</Link>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => handleQuickEdit(item)} className="hover:text-[#135e96]">Edição rápida</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => deleteNews(item.id, item.title)} className="text-[#d63638] hover:text-red-700">Lixo</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => archiveNews(item.id, item.title)} className="hover:text-[#135e96]">Arquivar</button>
                            <span className="text-gray-300">|</span>
                            <Link href={`/noticias/${item.slug}`} target="_blank" className="hover:text-[#135e96]">Ver</Link>
                            {user?.role === 'admin' && item.status !== 'Archived' && item.status !== 'Draft' && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button onClick={() => openSchedule(item)} className="hover:text-[#135e96]">Agendar</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Categoria" className={`p-3 align-top max-md:inline-block max-md:p-0 max-md:pt-2 max-md:pr-1 max-md:text-[11px] ${LBL}`}>
                      <button
                        onClick={() => setFilterCategory(item.category)}
                        className="text-[#2271b1] hover:text-[#135e96] capitalize text-left"
                      >
                        {item.category}
                      </button>
                      {itemCategories(item).filter((c) => c !== slugOf(item.category)).map((c) => (
                        <button key={c} onClick={() => setFilterCategory(c)} className="text-[#2271b1] hover:text-[#135e96] text-left before:content-[',_'] before:text-gray-400">
                          {categoryOptions.find((o) => o.slug === c)?.label ?? c}
                        </button>
                      ))}
                    </td>
                    <td className="p-3 align-top text-[#50575e] max-md:inline-block max-md:p-0 max-md:pt-2 max-md:text-[11px]">
                      <div className="flex flex-col leading-tight max-md:flex-row max-md:gap-1">
                        <span className={SEP}>{item.status === 'Draft' ? 'Rascunho' : item.status === 'Archived' ? 'Arquivado' : String(item.status).toLowerCase() === 'scheduled' ? 'Agendada' : String(item.status).toLowerCase() === 'pending' ? 'Pendente' : 'Publicado'}</span>
                        <span className={SEP}>{new Date(item.date).toLocaleDateString('pt-PT')}<span className="max-md:hidden"> às {new Date(item.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span></span>
                      </div>
                    </td>
                    <td className="p-3 align-top text-[#50575e] max-md:hidden">
                      <div className="flex flex-col items-start">
                        <svg className="w-5 h-5 text-green-600 mb-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5 19h14V5H5v14zm2-2v-4h2v4H7zm4 0v-8h2v8h-2zm4 0v-6h2v6h-2z" />
                        </svg>
                        <span className="font-bold text-[#1d2327]">{item.views || 0} leituras</span>
                      </div>
                    </td>
                    <td className="p-3 align-top text-left max-md:hidden">
                      {(() => {
                        const checks = seoChecks(item);
                        const ok = checks.filter((c) => c.ok).length;
                        const tone = ok >= 3 ? 'border-[#00a651] text-[#008f45]' : ok >= 2 ? 'border-[#dba617] text-[#996800]' : 'border-[#d63638] text-[#d63638]';
                        return (
                          <>
                          <button
                            type="button"
                            onClick={() => setSeoItem(item)}
                            title="Ver os detalhes de SEO"
                            className={`inline-flex h-6 items-center rounded border bg-white px-2 text-[11px] font-bold ${tone}`}
                          >
                            {ok >= 3 ? 'Bom' : ok === 2 ? 'Razoável' : 'Fraco'}
                          </button>
                          {ok < 3 && <button type="button" onClick={() => setSeoItem(item)} className="mt-1 block text-[10px] leading-none text-[#2271b1] hover:underline">Editar</button>}
                          </>
                        );
                      })()}
                    </td>
                  </tr>

                  {quickEditId === item.id && (
                    <tr className="bg-[#f6f7f7] border-b border-[#ccd0d4] max-md:block">
                      <td colSpan={6} className="p-6 max-md:block max-md:p-3">
                        <div className="w-full">
                          <h4 className="text-[13px] min-[1500px]:text-[14px] font-bold uppercase text-[#1d2327] mb-4">Edição Rápida</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[11px] min-[1500px]:text-[12px] font-bold mb-1">Título</label>
                                <input
                                  type="text"
                                  value={editForm.title || ''}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[12px] min-[1500px]:text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] min-[1500px]:text-[12px] font-bold mb-1">Slug</label>
                                <input
                                  type="text"
                                  value={editForm.slug || ''}
                                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                  className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[12px] min-[1500px]:text-sm"
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-[11px] min-[1500px]:text-[12px] font-bold mb-1">Categorias</label>
                                <div className="h-32 min-h-24 max-h-[70vh] resize-y overflow-y-auto p-2 border border-[#ccd0d4] bg-white rounded-[3px]">
                                  {categoryOptions.map((cat) => {
                                    const selected = itemCategories(editForm);
                                    const on = selected.includes(cat.slug);
                                    return (
                                      <label key={cat.slug} className="flex items-center gap-2 text-[12px] min-[1500px]:text-sm py-0.5">
                                        <input
                                          type="checkbox"
                                          checked={on}
                                          onChange={() => {
                                            const next = on ? selected.filter((c) => c !== cat.slug) : [...selected, cat.slug];
                                            if (next.length === 0) return; // a notícia fica sempre com uma categoria
                                            setEditForm({ ...editForm, category: next[0], categories: next });
                                          }}
                                        />
                                        {cat.label}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-[11px] min-[1500px]:text-[12px] font-bold mb-1">Data</label>
                                <input
                                  type="datetime-local"
                                  value={editForm.date ? new Date(editForm.date).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => setEditForm({ ...editForm, date: new Date(e.target.value).toISOString() })}
                                  className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[12px] min-[1500px]:text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] min-[1500px]:text-[12px] font-bold mb-1">Estado</label>
                                <AdminSelect
                                  value={editForm.status || 'Published'}
                                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                  className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[12px] min-[1500px]:text-sm"
                                >
                                  <option value="Published">Publicado</option>
                                  <option value="Draft">Rascunho</option>
                                  <option value="Archived">Arquivado</option>
                                </AdminSelect>
                              </div>
                            </div>

                            <div className="space-y-4 col-span-1 md:col-span-3 border-t border-[#ccd0d4] pt-4 mt-2">
                              <h5 className="text-[11px] min-[1500px]:text-[12px] font-bold uppercase text-gray-500">SEO Settings</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                  <label className="block text-[11px] min-[1500px]:text-[12px] font-bold mb-1">SEO Description / Resumo</label>
                                  <textarea
                                    value={editForm.summary || ''}
                                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                                    className="w-full h-20 p-2 border border-[#ccd0d4] rounded-[3px] text-[12px] min-[1500px]:text-sm resize-none"
                                    placeholder="Descrição para os motores de busca..."
                                  />
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-[11px] min-[1500px]:text-[12px] font-bold mb-1">Palavra-chave Foco</label>
                                    <input
                                      type="text"
                                      className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[12px] min-[1500px]:text-sm"
                                      placeholder="Ex: agricultura moçambique"
                                    />
                                  </div>
                                  <div className="pt-2 flex items-center gap-2 justify-end">
                                    <button
                                      onClick={saveQuickEdit}
                                      className="h-8 px-6 bg-[#00a651] text-white rounded-[3px] text-[12px] min-[1500px]:text-sm font-bold hover:bg-[#008f45] transition-colors"
                                    >
                                      {loading ? 'A guardar...' : 'Actualizar Notícia'}
                                    </button>
                                    <button
                                      onClick={() => setQuickEditId(null)}
                                      className="h-8 px-6 border border-[#ccd0d4] text-[#1d2327] rounded-[3px] text-[12px] min-[1500px]:text-sm font-bold hover:bg-white transition-colors"
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

      {seoItem && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Detalhes de SEO" onClick={() => setSeoItem(null)}>
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-[#1d2327]">SEO desta notícia</h3>
            <p className="mt-1 line-clamp-2 text-[13px] text-[#50575e]">{seoItem.title}</p>
            <ul className="mt-4 divide-y divide-[#e2e4e7] text-[13px]">
              {seoChecks(seoItem).map((c) => (
                <li key={c.id} className="flex items-start gap-3 py-2">
                  <span className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${c.ok ? 'bg-[#00a651]' : 'bg-[#dba617]'}`} aria-hidden="true">{c.ok ? '✓' : '!'}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#2c3338]">{c.label}</p>
                    <p className="break-words text-[#50575e]">{c.detalhe}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSeoItem(null)} className="rounded-[3px] border border-[#ccd0d4] bg-white px-4 py-1.5 text-sm font-semibold text-[#50575e] hover:bg-[#f6f7f7]">Fechar</button>
              <a href={`/noticias/${seoItem.slug}`} target="_blank" rel="noreferrer" className="rounded-[3px] border border-[#00a651] bg-white px-4 py-1.5 text-sm font-semibold text-[#008f45] hover:bg-[#f6f7f7]">Ver</a>
              <Link href={`/admin/noticias/editar/${seoItem.id}`} className="rounded-[3px] bg-[#00a651] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#008f45]">Editar</Link>
            </div>
          </div>
        </div>
      )}

      {/* Paginação (em baixo) */}
      <div className="mt-3">{pager}</div>

      {sched && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Agendar na newsletter" onClick={() => setSched(null)}>
          <div className="w-full max-w-md border border-[#ccd0d4] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-[#ccd0d4] bg-[#f6f7f7] px-4 py-3">
              <div className="text-[13px] text-[#1d2327]">Agendar na newsletter</div>
              <div className="mt-0.5 line-clamp-2 text-[12px] text-[#50575e]">{sched.item.title}</div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {sched.slots === null ? (
                <p className="p-4 text-center text-[13px] text-[#50575e]">A carregar os horários...</p>
              ) : sched.slots.length === 0 ? (
                <p className="p-4 text-center text-[13px] text-[#50575e]">Ainda não há envios agendados. Crie um horário em <Link href="/admin/newsletter" className="text-[#008f45] hover:underline">Newsletter › Agendamento</Link>.</p>
              ) : (
                sched.slots.map((x) => {
                  const joined = x.slugs.includes(sched.item.slug);
                  return (
                    <button key={x.id} type="button" disabled={joined} onClick={() => attachToSchedule(x.id)} className="flex h-11 w-full items-center justify-between gap-3 border-b border-[#f0f0f1] px-4 text-left text-[13px] hover:text-[#00a651] disabled:text-[#008f45]">
                      <span>{new Date(x.at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Maputo' })}</span>
                      <span className="text-[12px] text-[#50575e]">{joined ? 'Já está neste envio' : `${x.slugs.length} ${x.slugs.length === 1 ? 'notícia' : 'notícias'}`}</span>
                    </button>
                  );
                })
              )}
            </div>
            {sched.msg && <p className={`border-t border-[#ccd0d4] px-4 py-2 text-[13px] ${sched.err ? 'text-red-700' : 'text-green-800'}`}>{sched.msg}</p>}
            <div className="flex justify-end border-t border-[#ccd0d4] p-3">
              <button type="button" onClick={() => setSched(null)} className="h-9 border border-[#ccd0d4] bg-white px-4 text-[13px] hover:text-[#00a651]">Fechar</button>
            </div>
          </div>
        </div>
      )}

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
