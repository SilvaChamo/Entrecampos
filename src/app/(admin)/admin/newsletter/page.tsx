'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Eye, FileUp, Save, Send, Trash2, UserPlus, X } from 'lucide-react';
import { SkeletonContent, SkeletonHeader } from '@/components/Admin/Skeleton';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';
import AdminSelect from '@/components/Admin/AdminSelect';
import NewsletterAgenda, { EmailPreview, NewsletterPreviews, type AgendaItem } from '@/components/Admin/NewsletterAgenda';
import NewsletterAds from '@/components/Admin/NewsletterAds';

type Subscriber = { id: string; email: string; created_at: string };
type QueueItem = { slug: string; title: string; category: string; date: string; image: string | null; excerpt: string };
type SendRecord = { at: string; recipients: number; sent: number; failed: number; news: number; posts?: AgendaItem['posts']; ads?: string[] };
type Summary = { subscribers: Subscriber[]; queue: QueueItem[]; schedules: AgendaItem[]; lastSentAt: string | null; history: SendRecord[]; smtp: boolean };

const PAGE_SIZE = 50;
const fmt = (iso: string) => new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Maputo' });
// Botões e campos desta página: 36px de altura e letra de 13px.
/** Dia da semana + data e hora (ex.: Sexta-feira, 06/11/2026, 15:51). */
const fmtDay = (iso: string) => {
  const w = new Date(iso).toLocaleDateString('pt-PT', { weekday: 'long', timeZone: 'Africa/Maputo' });
  return `${w.charAt(0).toUpperCase()}${w.slice(1)}, ${fmt(iso)}`;
};
const btn = 'flex h-9 items-center gap-2 px-4 rounded-md whitespace-nowrap text-[13px]';
const field = 'h-9 px-3 border border-[#ccd0d4] rounded-md bg-white text-[13px]';
const btnLow = btn;
const fieldLow = field;

export default function NewsletterPage() {
  const [data, setData] = useState<Summary | null>(() => adminCacheGet<Summary>('newsletter') ?? null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState<'import' | 'send' | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'news' | 'agenda' | 'sent' | 'ads' | 'subscribers'>('news');
  const [viewAt, setViewAt] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/newsletter', { credentials: 'include', cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao carregar a newsletter.`);
      adminCacheSet('newsletter', body);
      setData(body);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar a newsletter.');
    }
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.subscribers ?? []).filter((s) => !q || s.email.includes(q));
  }, [data, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  useEffect(() => setPage(1), [search]);

  /** E-mails de um texto qualquer (lista colada ou ficheiro CSV/TXT): apanha tudo o que parece um endereço. */
  const emailsIn = (text: string) => text.split(/[\s,;"'<>()[\]]+/).filter((t) => t.includes('@'));

  const importEmails = async (emails: string[]) => {
    if (emails.length === 0) {
      setError('Não encontrei nenhum e-mail no texto ou no ficheiro.');
      return;
    }
    setBusy('import');
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/newsletter/import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao importar.`);
      setNotice(`Gravados ${body.added} contactos novos na lista. ${body.duplicates} já estavam na lista${body.invalid ? ` e ${body.invalid} não eram e-mails válidos` : ''}.`);
      setPaste('');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível importar.');
    } finally {
      setBusy(null);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    await importEmails(emailsIn(await file.text()));
    if (fileInput.current) fileInput.current.value = '';
  };

  const remove = async (id: string) => {
    setConfirmDelete(null);
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao remover.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível remover.');
    }
  };

  const removeSend = async (at: string) => {
    setConfirmDelete(null);
    try {
      const res = await fetch('/api/admin/newsletter', { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ at }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao eliminar.`);
      setNotice('Newsletter eliminada da lista.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível eliminar.');
    }
  };

  const sendNow = async () => {
    setConfirmSend(false);
    setBusy('send');
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/newsletter/send', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao enviar.`);
      setNotice(body.status === 'sent' ? `Newsletter enviada a ${body.sent} subscritores${body.failed ? ` (${body.failed} falharam)` : ''}.` : body.reason || 'Nada para enviar.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar.');
    } finally {
      setBusy(null);
    }
  };

  if (!data && !error) {
    return (
      <div className="ec-page">
        <SkeletonHeader />
        <SkeletonContent />
      </div>
    );
  }

  const pending = (data?.schedules ?? []).filter((x) => x.status === 'pending' || x.status === 'sending');
  const tabList = [
    ['news', `Notícias em fila (${data?.queue.length ?? 0})`],
    ['agenda', `Agendamento (${pending.length})`],
    ['sent', `Newsletters enviados (${data?.history.length ?? 0})`],
    ['ads', 'Publicidade'],
    ['subscribers', `Lista de subscritores (${data?.subscribers.length ?? 0})`],
  ] as const;
  return (
    <div className="ec-page text-[#2c3338]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1d2327]">Newsletter</h1>
        <p className="mt-1 text-[13px] text-[#50575e]">Subscritores do site, fila de notícias e envio diário às 20h (hora de Maputo)</p>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700">{error}</div>}
      {notice && <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-[13px] text-green-800">{notice}</div>}
      {data && !data.smtp && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-[13px] text-amber-800">
          O e-mail (SMTP) não está configurado neste servidor: a lista e a fila funcionam, mas o envio não.
        </div>
      )}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ['Subscritores', String(data.subscribers.length)],
              ['Notícias na fila', String(data.queue.length)],
              ['Último envio', data.history[0] ? fmt(data.history[0].at) : data.lastSentAt ? fmt(data.lastSentAt) : 'Ainda nenhum'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#ccd0d4] bg-white px-4 py-3">
                <div className="text-[12px] text-[#50575e]">{label}</div>
                <div className="mt-1 text-xl text-[#1d2327]">{value}</div>
              </div>
            ))}
          </div>

          {viewAt && data.history.find((h) => h.at === viewAt) ? (() => {
            const rec = data.history.find((h) => h.at === viewAt)!;
            const posts = rec.posts ?? [];
            return (
              <div className="rounded-lg border border-[#ccd0d4] bg-white p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[18px] text-[#1d2327]">Newsletter enviada</h2>
                    <p className="mt-1 text-[13px] text-[#50575e]">{fmtDay(rec.at)} · {rec.news} {rec.news === 1 ? 'notícia' : 'notícias'} · Enviados: {rec.sent} de {rec.recipients} · Falhas: {rec.failed}</p>
                  </div>
                  <button onClick={() => setViewAt(null)} className={`${btn} border border-[#ccd0d4] bg-white text-[#50575e] hover:text-[#00a651] max-sm:w-full max-sm:justify-center`}><ArrowLeft className="h-4 w-4" /> Voltar</button>
                </div>
                {posts.length === 0 ? (
                  <p className="rounded-lg border border-[#ccd0d4] p-6 text-center text-[13px] text-[#50575e]">O conteúdo deste envio não ficou guardado.</p>
                ) : (
                  <EmailPreview item={{ id: rec.at, at: rec.at, slugs: posts.map((p) => p.slug), status: 'sent', posts }} editable={false} onRemove={() => {}} onMove={() => {}} onlyAds={rec.ads ?? []} />
                )}
              </div>
            );
          })() : (
            <>
          {/* Separadores */}
          <div className="flex flex-wrap items-end justify-between gap-2">
          <AdminSelect value={tab} onChange={(e) => setTab(e.target.value as 'news' | 'agenda' | 'sent' | 'ads' | 'subscribers')} className="h-11 w-full border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none md:hidden">
            {tabList.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </AdminSelect>
          <div role="tablist" className="hidden gap-1 md:flex">
            {tabList.map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`relative -mb-px h-10 rounded-t-md border border-b-0 px-4 text-[14px] ${tab === key ? 'z-10 border-[#ccd0d4] bg-white text-[#1d2327]' : 'border-transparent text-[#50575e] hover:text-[#00a651]'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === 'subscribers' && (
            <button onClick={() => setAddOpen((v) => !v)} aria-expanded={addOpen} className={`${btn} mb-1 bg-[#00a651] text-white`}>
              {addOpen ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {addOpen ? 'Fechar' : 'Adicionar contactos'}
            </button>
          )}
          </div>

          <div className="rounded-b-lg rounded-tr-lg border border-[#ccd0d4] bg-white p-4">
          {tab === 'news' && (
            <>
          {/* Fila: notícias novas que seguem na próxima newsletter */}
          <div className={data.queue.length === 0 && data.schedules.some((x) => x.status === 'pending' && x.posts.length > 0) ? 'hidden' : 'mb-6'}>
            <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
              {confirmSend ? (
                <div className="flex items-center gap-2 text-[13px]">
                  <span>Enviar já a {data.subscribers.length} subscritores?</span>
                  <button onClick={sendNow} className={`${btn} bg-[#00a651] text-white`}>Sim, enviar</button>
                  <button onClick={() => setConfirmSend(false)} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651]`}>Cancelar</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmSend(true)}
                  disabled={busy !== null || data.queue.length === 0 || data.subscribers.length === 0 || !data.smtp}
                  className={`${btn} justify-center border border-[#ccd0d4] bg-white hover:text-[#00a651] disabled:opacity-50 max-sm:w-full max-sm:border-[#d6101c] max-sm:bg-[#d6101c] max-sm:text-white max-sm:hover:text-white`}
                >
                  <Send className="h-4 w-4" /> {busy === 'send' ? 'A enviar...' : 'Enviar agora'}
                </button>
              )}
            </div>
            {data.queue.length === 0 ? (
              data.schedules.some((x) => x.status === 'pending' && x.posts.length > 0) ? null : <div className="rounded-lg border border-[#ccd0d4] bg-white p-6 text-center text-[13px] text-[#50575e]">Sem notícias novas desde o último envio.</div>
            ) : (
              <ul className="grid grid-flow-dense gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
                {data.queue.map((n, idx) => (
                  <li key={n.slug} className={idx === 0 && data.queue.length > 2 ? 'sm:col-span-2 sm:row-span-2' : ''}>
                    <a
                      href={`/noticias/${n.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#ccd0d4] bg-white hover:border-[#00a651] hover:shadow-md"
                    >
                      <div className={`relative w-full overflow-hidden bg-[#e5e7e9] ${idx === 0 && data.queue.length > 2 ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
                        {n.image && <img src={n.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                      </div>
                      <div className="flex flex-1 flex-col p-3">
                        <span className="text-[11px] uppercase tracking-wide text-[#00a651]">{n.category}</span>
                        <span className={`mt-1 line-clamp-3 leading-snug text-[#1d2327] group-hover:text-[#00a651] ${idx === 0 && data.queue.length > 2 ? 'text-[19px]' : 'text-[15px]'}`}>{n.title}</span>
                        {idx === 0 && data.queue.length > 2 && n.excerpt && <span className="mt-2 line-clamp-3 text-[13px] text-[#50575e]">{n.excerpt}</span>}
                        <span className="mt-auto pt-2 text-[12px] text-[#50575e]">{fmt(n.date)}</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <NewsletterPreviews schedules={data.schedules} subscribers={data.subscribers.length} smtp={data.smtp} onChange={load} setNotice={setNotice} setError={setError} />

            </>
          )}

          {tab === 'sent' && (
            data.history.length === 0 ? (
              <div className="rounded-lg border border-[#ccd0d4] bg-white p-6 text-center text-[13px] text-[#50575e]">Ainda não foi enviada nenhuma newsletter.</div>
            ) : (
              <ul className="space-y-3">
                {data.history.map((h) => (
                  <li key={h.at} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-[#ccd0d4] bg-white p-4 text-[13px]">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="text-[15px] text-[#1d2327]">{fmtDay(h.at)}</span>
                      <span className="text-[#50575e]">{h.news} {h.news === 1 ? 'notícia' : 'notícias'}</span>
                      <span className="text-[#50575e]">Enviados: {h.sent} de {h.recipients}</span>
                      <span className={h.failed > 0 ? 'text-[#d63638]' : 'text-[#50575e]'}>Falhas: {h.failed}</span>
                    </div>
                    <div className="flex items-center gap-2 max-sm:w-full max-sm:flex-wrap">
                      <button onClick={() => setViewAt(h.at)} className={`${btn} border border-[#ccd0d4] bg-white text-[#50575e] hover:text-[#00a651] max-sm:flex-1 max-sm:justify-center`}>
                        <Eye className="h-4 w-4" /> Ver
                      </button>
                      {confirmDelete === `send:${h.at}` ? (
                        <>
                          <button onClick={() => removeSend(h.at)} className={`${btn} bg-[#d63638] text-white max-sm:flex-1 max-sm:justify-center`}>Sim, eliminar</button>
                          <button onClick={() => setConfirmDelete(null)} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651] max-sm:flex-1 max-sm:justify-center`}>Cancelar</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(`send:${h.at}`)} className={`${btn} border border-[#ccd0d4] bg-white text-red-600 hover:text-[#00a651] max-sm:flex-1 max-sm:justify-center`}>
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === 'agenda' && (
            <NewsletterAgenda schedules={data.schedules} subscribers={data.subscribers.length} smtp={data.smtp} onChange={load} setNotice={setNotice} setError={setError} />
          )}

          {tab === 'ads' && <NewsletterAds setNotice={setNotice} setError={setError} />}

          {tab === 'subscribers' && (
            <>
          {/* Adicionar contactos: abre ao carregar no botão, em cima à direita */}
          {addOpen && (
            <div className="mb-4 rounded-lg border border-[#ccd0d4] bg-[#f6f7f7] p-4">
              <label className="mb-1 block text-[13px] font-medium text-[#1d2327]">Cole os e-mails ou escolha um ficheiro CSV ou TXT</label>
              <textarea
                rows={3}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="nome@exemplo.com, outro@exemplo.com..."
                className="w-full min-h-9 resize-y rounded-md border border-[#ccd0d4] bg-white px-3 py-2 text-[13px] leading-5"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button onClick={() => importEmails(emailsIn(paste))} disabled={busy !== null || !paste.trim()} className={`${btn} bg-[#00a651] text-white disabled:opacity-50`}>
                  <Save className="h-4 w-4" /> {busy === 'import' ? 'A gravar...' : 'Gravar'}
                </button>
                <input ref={fileInput} type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                <button onClick={() => fileInput.current?.click()} disabled={busy !== null} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651] disabled:opacity-50`}>
                  <FileUp className="h-4 w-4" /> Escolher ficheiro
                </button>
                <button onClick={() => setAddOpen(false)} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651]`}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Subscritores */}
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar e-mail..." className={`${fieldLow} w-full sm:w-80`} />
              <div className="flex flex-wrap items-center gap-2">
                {[
                  ['csv', 'CSV (Excel)'],
                  ['txt', 'TXT'],
                  ['json', 'JSON'],
                ].map(([format, label]) => (
                  <a key={format} href={`/api/admin/newsletter/export?format=${format}`} className={`${btnLow} border border-[#ccd0d4] bg-white hover:text-[#00a651]`}>
                    <Download className="h-4 w-4" /> {label}
                  </a>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-[#ccd0d4] bg-white">
              <table className="ec-cards w-full border-collapse text-[13px] max-md:block">
                <thead className="max-md:hidden">
                  <tr className="border-b border-[#ccd0d4] bg-[#f6f7f7] text-left font-bold">
                    <th className="p-4">E-mail</th>
                    <th className="p-4">Subscrito em</th>
                    <th className="p-4 text-right">Acções</th>
                  </tr>
                </thead>
                <tbody className="max-md:block">
                  {visible.length === 0 ? (
                    <tr className="max-md:block">
                      <td colSpan={3} className="p-4 text-center text-[#50575e] max-md:block">Ainda não há subscritores.</td>
                    </tr>
                  ) : (
                    visible.map((s, idx) => (
                      <tr key={s.id} className={`group border-b border-[#f0f0f1] max-md:relative max-md:block max-md:px-3 max-md:py-0.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <td className="px-4 py-1.5 text-[#1d2327] group-hover:text-[#00a651] max-md:block max-md:px-0 max-md:pb-2 max-md:pt-0 max-md:text-[12px] max-md:[overflow-wrap:anywhere] max-md:before:block max-md:before:font-bold max-md:before:leading-7 max-md:before:text-[#646970] max-md:before:content-['E-mail:']">{s.email}</td>
                        <td className="px-4 py-1.5 text-[#50575e] group-hover:text-[#00a651] max-md:hidden">{fmt(s.created_at)}</td>
                        <td className="px-4 py-1.5 text-right max-md:absolute max-md:right-3 max-md:top-0.5 max-md:p-0">
                          {confirmDelete === s.id ? (
                            <span className="inline-flex items-center gap-2 text-[12px]">
                              Remover?
                              <button onClick={() => remove(s.id)} className="rounded px-2 py-1 text-red-600 hover:text-[#00a651]">Sim</button>
                              <button onClick={() => setConfirmDelete(null)} className="rounded px-2 py-1 text-[#50575e] hover:text-[#00a651]">Não</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDelete(s.id)} aria-label={`Remover ${s.email}`} className="inline-flex h-9 w-9 items-center justify-center rounded text-red-600 hover:text-[#00a651] max-md:h-7 max-md:w-7">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="mt-3 flex items-center justify-end gap-2 text-[13px] text-[#50575e]">
                <button onClick={() => setPage(current - 1)} disabled={current <= 1} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651] disabled:opacity-50`}>‹ Anterior</button>
                <span>{current} / {pages}</span>
                <button onClick={() => setPage(current + 1)} disabled={current >= pages} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651] disabled:opacity-50`}>Seguinte ›</button>
              </div>
            )}
          </div>

            </>
          )}
          </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
