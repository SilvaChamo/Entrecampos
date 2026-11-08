'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

type Noticia = { slug: string; title: string; date: string; category: string; exclusive: boolean };

/** Marcar quais notícias são exclusivas para assinantes. */
export default function ExclusivasPage() {
  const [posts, setPosts] = useState<Noticia[]>([]);
  const [q, setQ] = useState('');
  const [soExclusivas, setSoExclusivas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/exclusivas', { credentials: 'include' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao carregar.');
      setPosts(d.posts);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function alternar(n: Noticia) {
    setBusy(n.slug);
    setErro(null);
    try {
      const res = await fetch('/api/admin/exclusivas', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: n.slug, exclusive: !n.exclusive }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao guardar.');
      setPosts((l) => l.map((x) => (x.slug === n.slug ? { ...x, exclusive: !n.exclusive } : x)));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao guardar.');
    } finally {
      setBusy(null);
    }
  }

  const visiveis = useMemo(() => posts.filter((p) => (!soExclusivas || p.exclusive) && p.title.toLowerCase().includes(q.trim().toLowerCase())), [posts, q, soExclusivas]);
  const total = posts.filter((p) => p.exclusive).length;

  return (
    <div className="p-4 text-[#2c3338] sm:p-6">
      <Link href="/admin/subscricoes" className="mb-3 inline-flex items-center gap-1 text-[13px] text-[#00a651] hover:underline"><ArrowLeft className="h-4 w-4" /> Subscrições</Link>
      <h1 className="text-xl font-bold text-[#1d2327]">Notícias exclusivas</h1>
      <p className="mt-1 max-w-xl text-[13px] text-[#50575e]">As notícias marcadas aqui mostram só o início a quem não é assinante. Tem {total} exclusiva{total === 1 ? '' : 's'}.</p>
      {erro && <p role="alert" className="mt-3 border-l-4 border-[#d63638] bg-[#fcf0f1] px-3 py-2 text-[13px]">{erro}</p>}
      <div className="my-4 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar notícia…" className="h-9 w-full max-w-sm border border-[#8c8f94] bg-white px-2 text-[13px] focus:border-[#00a651] focus:outline-none" />
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px]"><input type="checkbox" checked={soExclusivas} onChange={(e) => setSoExclusivas(e.target.checked)} className="accent-[#00a651]" /> Só as exclusivas</label>
      </div>
      {loading ? (
        <div className="flex justify-center p-10"><Spinner size={26} className="" /></div>
      ) : visiveis.length === 0 ? (
        <p className="border border-[#ccd0d4] bg-white p-6 text-center text-[13px] text-[#50575e]">Nenhuma notícia encontrada.</p>
      ) : (
        <ul className="border border-[#ccd0d4] bg-white">
          {visiveis.map((n) => (
            <li key={n.slug} className="flex items-center justify-between gap-3 border-b border-[#f0f0f1] px-3 py-2.5 text-[13px] last:border-0">
              <div className="min-w-0">
                <Link href={`/noticias/${n.slug}`} target="_blank" className="inline-flex items-center gap-1 font-semibold hover:text-[#00a651]"><span className="truncate">{n.title}</span><ExternalLink className="h-3 w-3 shrink-0" /></Link>
                <div className="text-[11px] text-[#50575e]">{n.category}</div>
              </div>
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px] font-medium">
                <input type="checkbox" checked={n.exclusive} disabled={busy === n.slug} onChange={() => alternar(n)} className="accent-[#00a651]" /> Exclusiva
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
