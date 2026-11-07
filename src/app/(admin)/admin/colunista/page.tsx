'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, CheckSquare, Clock, Eye, FileText, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Common/Spinner';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';

interface Item {
  id: string;
  title: string;
  date: string;
  status: string;
  views?: number;
}

/** Dashboard do colunista: só dados da própria conta (os artigos dele), nunca as notícias gerais do site. */
export default function ColunistaDashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>(() => adminCacheGet<Item[]>('meus-artigos') ?? []);
  const [loading, setLoading] = useState(() => adminCacheGet('meus-artigos') === undefined);

  useEffect(() => {
    let alive = true;
    fetch('/api/admin/news/list?meus=1', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        adminCacheSet('meus-artigos', d.items);
        setItems(d.items as Item[]);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const st = (n: Item) => String(n.status).toLowerCase();
    return {
      total: items.length,
      published: items.filter((n) => st(n) === 'published').length,
      pending: items.filter((n) => st(n) === 'pending').length,
      views: items.reduce((s, n) => s + (Number(n.views) || 0), 0),
    };
  }, [items]);

  const card = 'flex h-full flex-col items-center justify-center rounded-md border border-[#ccd0d4] bg-white p-4 text-center shadow-sm transition-all hover:border-[#00a651]';

  return (
    <div className="ec-page min-h-screen font-sans text-[#2c3338]">
      <section className="mb-4 rounded-none border border-[#ccd0d4] bg-white p-4 shadow-sm">
        <h1 className="mb-2 text-[23px] font-[800] text-[#0b5c2e]">Bem-vindo ao painel de administração</h1>
        <p className="mb-3 text-[14px] text-[#50575e]">Olá, {user?.name || 'Colunista'}. Estes são os seus artigos.</p>
        <hr className="mb-4 border-[#f0f0f1]" />
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/noticias/nova" className="inline-flex h-9 items-center gap-2 rounded-md bg-[#00a651] px-4 text-[13px] text-white shadow-sm hover:bg-[#008f45]">
            <Plus className="h-4 w-4" />
            Escrever artigo
          </Link>
          <Link href="/admin/meus-artigos" className="inline-flex h-9 items-center gap-2 rounded-md border border-[#00a651] bg-white px-4 text-[13px] text-[#00a651] hover:bg-[#f6f7f7]">
            <FileText className="h-4 w-4" />
            Meus artigos
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 items-stretch gap-3 md:gap-4 lg:grid-cols-2">
        <div className="h-full overflow-hidden rounded-md border border-[#ccd0d4] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f0f1] bg-white p-3">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#0b5c2e]">
              <Activity className="h-4 w-4 text-gray-400" />
              Os meus últimos artigos
            </h2>
          </div>
          <div className="p-4">
            {loading && items.length === 0 ? (
              <div className="py-4 text-center"><Spinner size={32} className="mx-auto" /></div>
            ) : items.length > 0 ? (
              <ul className="space-y-3">
                {items.slice(0, 4).map((n) => (
                  <li key={n.id} className="border-b border-[#f0f0f1] pb-2 last:border-0 last:pb-0">
                    <p className="mb-0.5 text-[13px] text-[#d63638]">
                      {new Date(n.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <Link href={`/admin/noticias/editar/${n.id}`} className="text-[13px] font-semibold text-[#50575e] hover:underline">
                      {n.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] italic text-gray-500">Ainda não escreveu nenhum artigo.</p>
            )}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 md:gap-4">
          <Link href="/admin/meus-artigos" className="group h-full">
            <div className={card}>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-[#008f45]"><FileText className="h-5 w-5" /></div>
              <span className="mb-0.5 text-[22px] font-bold text-[#1d2327]">{stats.total}</span>
              <span className="text-[12px] font-medium uppercase tracking-wider text-[#50575e]">Meus artigos</span>
            </div>
          </Link>
          <Link href="/admin/meus-artigos" className="group h-full">
            <div className={card}>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-600"><CheckSquare className="h-5 w-5" /></div>
              <span className="mb-0.5 text-[22px] font-bold text-[#1d2327]">{stats.published}</span>
              <span className="text-[12px] font-medium uppercase tracking-wider text-[#50575e]">Publicados</span>
            </div>
          </Link>
          <Link href="/admin/meus-artigos" className="group h-full">
            <div className={card}>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
              <span className="mb-0.5 text-[22px] font-bold text-[#1d2327]">{stats.pending}</span>
              <span className="text-[12px] font-medium uppercase tracking-wider text-[#50575e]">Pendentes</span>
            </div>
          </Link>
          <Link href="/admin/meus-artigos" className="group h-full">
            <div className={card}>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 text-purple-600"><Eye className="h-5 w-5" /></div>
              <span className="mb-0.5 text-[22px] font-bold text-[#1d2327]">{stats.views}</span>
              <span className="text-[12px] font-medium uppercase tracking-wider text-[#50575e]">Leituras</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
