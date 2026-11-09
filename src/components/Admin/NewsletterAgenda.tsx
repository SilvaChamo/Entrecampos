'use client';

import React, { useEffect, useState } from 'react';
import { Apple, ArrowDown, ArrowUp, Briefcase, CalendarClock, Facebook, Flower2, Instagram, Leaf, Lightbulb, Linkedin, Palmtree, Pencil, Plus, Save, Send, Sprout, Tag, Tractor, Trash2, Users, Utensils, X, type LucideIcon } from 'lucide-react';
import AdminSelect from '@/components/Admin/AdminSelect';
import { AD_SLOTS, BRAND, EMAIL_WIDTH, LEAD_IMAGE_HEIGHT, RED, categoryColor, categoryIcon, longDate } from '@/lib/newsletter-brand';
import AdSpacesPopup from '@/components/Newsletter/AdSpacesPopup';

/** Logótipo oficial do WhatsApp (os outros vêm do lucide). */
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
);
const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = { whatsapp: WhatsAppIcon, facebook: Facebook, instagram: Instagram, linkedin: Linkedin };
const ICONS: Record<string, LucideIcon> = { sprout: Sprout, tractor: Tractor, users: Users, briefcase: Briefcase, lightbulb: Lightbulb, apple: Apple, leaf: Leaf, palmtree: Palmtree, 'flower-2': Flower2, utensils: Utensils, tag: Tag };

type Card = { slug: string; title: string; category: string; categorySlug: string; color: string; date: string; image: string | null; excerpt: string };
export type AgendaItem = { id: string; name?: string; at: string; slugs: string[]; status: 'pending' | 'sending' | 'sent' | 'failed'; result?: string; posts: Card[] };

const fmt = (iso: string) => new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Maputo' });
const btn = 'flex h-9 items-center justify-center gap-2 px-4 rounded-md whitespace-nowrap text-[13px]';
const pick = 'h-10 border border-[#ccd0d4] bg-white px-3 text-[13px]';
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const STATUS = { pending: 'Agendado', sending: 'A enviar', sent: 'Enviado', failed: 'Falhou' } as const;

/** Hora de Maputo (UTC+2, sem hora de verão) de um momento ISO: AAAA-MM-DD, HH, MM. */
const maputo = (iso: string) => {
  const t = new Date(new Date(iso).getTime() + 2 * 3600 * 1000).toISOString();
  return { day: t.slice(0, 10), hour: t.slice(11, 13), minute: t.slice(14, 16) };
};
const dayLabel = (iso: string) => iso.split('-').reverse().join('/');
const toIso = (day: string, hour: string, minute: string) => `${day}T${hour}:${minute}:00+02:00`;

/** Hoje e os 6 dias seguintes; se o envio já está marcado para outro dia, esse dia também aparece. */
function dayOptions(extra?: string) {
  const base = new Date(Date.now() + 2 * 3600 * 1000);
  const list = Array.from({ length: 7 }, (_, i) => {
    const iso = new Date(base.getTime() + i * 86400000).toISOString().slice(0, 10);
    const d = new Date(`${iso}T12:00:00Z`);
    const name = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-PT', { weekday: 'long', timeZone: 'UTC' });
    return { value: iso, label: `${name} (${dayLabel(iso)})` };
  });
  if (extra && !list.some((o) => o.value === extra)) list.unshift({ value: extra, label: dayLabel(extra) });
  return list;
}

function WhenPicker({ day, hour, minute, onChange, extraDay }: { day: string; hour: string; minute: string; onChange: (v: { day: string; hour: string; minute: string }) => void; extraDay?: string }) {
  return (
    <>
      <AdminSelect value={day} onChange={(e) => onChange({ day: e.target.value, hour, minute })} className={`${pick} w-full sm:w-64`}>
        {dayOptions(extraDay).map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
      </AdminSelect>
      <div className="flex items-center gap-2 max-sm:w-full">
        <AdminSelect value={hour} onChange={(e) => onChange({ day, hour: e.target.value, minute })} className={`${pick} w-20 max-sm:flex-1`}>
          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </AdminSelect>
        <span className="text-[13px] text-[#50575e]">:</span>
        <AdminSelect value={minute} onChange={(e) => onChange({ day, hour, minute: e.target.value })} className={`${pick} w-20 max-sm:flex-1`}>
          {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
        </AdminSelect>
      </div>
    </>
  );
}


type AdView = { id: string; slot: string; advertiser: string; image: string; link: string; active: boolean };
type AdsInfo = { prices: Record<string, number>; ads: AdView[] };
let adsCache: AdsInfo | null = null;
/** Anúncios e preços (uma vez por visita ao painel), para os mostrar na pré-visualização do e-mail. */
function useAds(only?: string[]) {
  const [info, setInfo] = useState<AdsInfo | null>(adsCache);
  useEffect(() => {
    let live = true;
    fetch('/api/admin/newsletter/ads', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AdsInfo | null) => { if (d) { adsCache = d; if (live) setInfo(d); } })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  const bySlot: Record<string, AdView> = {};
  for (const ad of info?.ads ?? []) if ((only ? only.includes(ad.id) : ad.active) && !bySlot[ad.slot]) bySlot[ad.slot] = ad;
  return { bySlot, prices: info?.prices ?? {} };
}

/** O e-mail como o subscritor o recebe (o mesmo desenho do e-mail real), com os botões para tirar ou mudar de lugar cada notícia. */
export function EmailPreview({ item, editable, onRemove, onMove, onlyAds }: { item: AgendaItem; editable: boolean; onRemove: (slug: string) => void; onMove: (slug: string, dir: -1 | 1) => void; onlyAds?: string[] }) {
  const [lead, ...rest] = item.posts;
  const { bySlot, prices } = useAds(onlyAds);
  const [spaces, setSpaces] = useState(false);
  // Publicidade: só aparece onde há anúncio (nada marca os espaços vazios).
  const adRow = (position: string) => {
    const slot = AD_SLOTS.find((x) => x.position === position && bySlot[x.key]);
    const ad = slot && bySlot[slot.key];
    return ad && slot ? <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block"><img src={ad.image} alt={ad.advertiser} className="block h-auto w-full" style={{ maxHeight: slot.h }} /></a> : null;
  };
  const headerAd = bySlot['cabecalho'];
  const mid = Math.ceil(rest.length / 2); // «no meio das notícias»: depois da notícia em destaque e de metade dos cartões
  const tools = (slug: string, i: number) =>
    editable && (
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 bg-white/95 p-1 shadow-sm">
        <button onClick={() => onMove(slug, -1)} disabled={i === 0} aria-label="Subir" className="flex h-9 w-9 items-center justify-center text-[#50575e] hover:text-[#00a651] disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
        <button onClick={() => onMove(slug, 1)} disabled={i === item.posts.length - 1} aria-label="Descer" className="flex h-9 w-9 items-center justify-center text-[#50575e] hover:text-[#00a651] disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
        <button onClick={() => onRemove(slug)} aria-label="Tirar deste envio" className="flex h-9 w-9 items-center justify-center text-red-600 hover:text-[#00a651]"><X className="h-4 w-4" /></button>
      </div>
    );
  // Etiqueta como a do site: caixa do ícone (a cor escurecida) + nome da categoria; abre a página da categoria.
  const tag = (p: Card) => {
    const Icon = ICONS[categoryIcon(p.categorySlug)] ?? Tag;
    return (
      <a href={`/categoria/${p.categorySlug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-stretch overflow-hidden align-middle text-white transition hover:brightness-110" style={{ backgroundColor: p.color || categoryColor(p.categorySlug) }}>
        <span className="flex items-center justify-center bg-black/25 px-2"><Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} /></span>
        <span className="px-2.5 py-2 text-[9px] font-bold uppercase leading-none tracking-wide sm:text-[11px]">{p.category}</span>
      </a>
    );
  };
  // A foto, o título e o botão levam à página da notícia no site (como no e-mail).
  const open = (slug: string) => ({ href: `/noticias/${slug}`, target: '_blank', rel: 'noopener noreferrer' });
  const more = (slug: string) => <a {...open(slug)} className="mt-3 inline-block bg-[#3e6611] px-3 py-1.5 text-[11px] text-white transition-colors hover:bg-[#d6101c] sm:px-5 sm:py-2.5 sm:text-[13px]">Ler mais</a>;

  return (
    <div className="bg-[#f0f0f1]">
      <div className="mx-auto w-full px-3 sm:px-5" style={{ maxWidth: EMAIL_WIDTH + 40 }}>
      <div className="space-y-3 pb-3 pt-3 sm:pt-5">
      {adRow('topo')}
      <div className="flex flex-col items-stretch overflow-hidden border-b-4 bg-white sm:flex-row" style={{ borderBottomColor: RED }}>
        {/* O símbolo tem 10px de espaço em cima, à esquerda e em baixo (à direita não). */}
        <div className="shrink-0 py-[10px] pl-[10px] sm:self-center">
          <img src="/images/entrecampos-simbolo.png" alt={BRAND.name} className="block h-[108px] w-[108px] object-cover" />
        </div>
        {/* Linha vertical que separa o símbolo da morada; não toca em cima nem em baixo (só no computador). */}
        <div className="my-4 hidden w-px shrink-0 bg-[#d5d8db] sm:block" />
        <div className="flex min-w-0 flex-1 items-center px-[10px] pb-3 pt-0 text-left text-[9px] leading-relaxed text-[#50575e] sm:px-6 sm:py-2 sm:text-[12px]">
          <div><div className="mb-1 text-[12px] font-bold leading-tight text-[#1d2327] sm:text-[16px]">{BRAND.headline}</div>{BRAND.address}<br />{BRAND.phones.join(' · ')}<br />{BRAND.emails.join(' · ')}</div>
        </div>
        {/* Sem anúncio, o espaço do cabeçalho mostra um cartão cinzento «Publicite aqui» */}
        {headerAd ? (
          <a href={headerAd.link} target="_blank" rel="noopener noreferrer" className="shrink-0 self-center px-[10px] pb-3 sm:py-[10px] sm:pl-0"><img src={headerAd.image} alt={headerAd.advertiser} className="block h-[120px] w-[230px] max-w-full object-cover" /></a>
        ) : (
          <a href="/espacos-de-publicidade" target="_blank" rel="noopener noreferrer" className="shrink-0 self-center px-[10px] pb-3 sm:py-[10px] sm:pl-0"><span className="flex h-[120px] w-[230px] max-w-full items-center justify-center bg-[#e4e6e8] text-[11px] text-[#50575e] sm:text-[13px]">Publicite aqui</span></a>
        )}
      </div>

      {adRow('depois')}

      {!lead ? (
        <div className="border border-[#e3e3e3] bg-white px-7 py-8 text-center text-[13px] text-[#50575e]">Ainda sem notícias. Na lista de notícias, use «Agendar» e escolha este horário.</div>
      ) : (
        <div className="relative border border-[#e3e3e3] bg-white">
          {tools(lead.slug, 0)}
          {lead.image && <a {...open(lead.slug)} className="block"><img src={lead.image} alt="" loading="lazy" className="block w-full object-cover" style={{ aspectRatio: `${EMAIL_WIDTH} / ${LEAD_IMAGE_HEIGHT}` }} /></a>}
          <div className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
            {tag(lead)}
            <a {...open(lead.slug)} className="mb-1.5 mt-2 block text-[14px] font-bold leading-snug text-[#1d2327] transition-colors hover:text-[#d6101c] sm:mt-2.5 sm:text-[23px] sm:leading-tight">{lead.title}</a>
            <div className="text-[10px] sm:text-[12px]" style={{ color: RED }}>{longDate(lead.date)}</div>
            {lead.excerpt && <div className="mt-2 text-[11px] leading-[1.45] text-[#50575e] sm:mt-2.5 sm:text-[14px] sm:leading-6">{lead.excerpt.slice(0, 280)}</div>}
            {more(lead.slug)}
          </div>
        </div>
      )}

      {mid === 0 && adRow('meio')}
      {rest.map((p, k) => (
        <React.Fragment key={p.slug}>
        {k === mid && adRow('meio')}
        <div className="relative grid overflow-hidden border border-[#e3e3e3] bg-white sm:grid-cols-[220px_1fr]">
          {tools(p.slug, k + 1)}
          {/* A foto estica até à altura do card e encosta às margens, sem espaços à volta. */}
          <a {...open(p.slug)} className="relative block h-44 bg-[#e5e7e9] sm:h-auto sm:min-h-[150px]">
            {p.image && <img src={p.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
          </a>
          <div className="p-3 sm:p-4">
            {tag(p)}
            <a {...open(p.slug)} className="mb-1 mt-2 block text-[13px] font-bold leading-snug text-[#1d2327] transition-colors hover:text-[#d6101c] sm:text-[18px]">{p.title}</a>
            <div className="text-[9px] sm:text-[11px]" style={{ color: RED }}>{longDate(p.date)}</div>
            {more(p.slug)}
          </div>
        </div>
        </React.Fragment>
      ))}
      {mid > 0 && mid === rest.length && adRow('meio')}

      {adRow('rodape')}

      </div>
      </div>

      {/* Rodapé: a faixa escura ocupa a largura toda e encosta em baixo; o conteúdo mantém a largura do conteúdo */}
      <div className="bg-[#1d2327]">
        <div className="mx-auto w-full px-3 sm:px-5" style={{ maxWidth: EMAIL_WIDTH + 40 }}>
<div className="py-4 text-left text-[9px] leading-relaxed text-[#a7aaad] sm:py-5 sm:text-[11px]">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
          <div>
            <div className="text-[10px] font-bold text-white sm:text-[12px]">{BRAND.name} · {BRAND.tagline}</div>
            <div>{BRAND.address}</div>
            <div>{BRAND.phones.join(' · ')}</div>
          </div>
          <button onClick={() => setSpaces(true)} className="border border-[#a7aaad] px-3 py-2 text-[10px] text-white max-sm:w-full hover:border-[#7fd35a] hover:text-[#7fd35a] sm:text-[11px]">Ver espaços de publicidade</button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#6b7278] pt-3">
          <span>Recebe este e-mail porque subscreveu a newsletter. <span className="text-[#7fd35a] underline">Cancelar subscrição</span></span>
          <span className="flex shrink-0 items-center gap-2.5 text-white">
            {BRAND.social.map((n) => { const Icon = SOCIAL_ICONS[n.key]; return <a key={n.key} href={n.url} target="_blank" rel="noopener noreferrer" aria-label={n.label} className="hover:text-[#7fd35a]"><Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></a>; })}
          </span>
        </div>
      </div>
        </div>
      </div>

      {spaces && (
        <div role="dialog" aria-modal="true" aria-label="Espaços de publicidade" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-8" onClick={() => setSpaces(false)}>
          <div className="relative w-full max-w-[760px]" onClick={(e) => e.stopPropagation()}>
            <AdSpacesPopup
              prices={prices}
              headerAction={<button onClick={() => setSpaces(false)} aria-label="Fechar" className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center border border-[#ccd0d4] bg-white text-[#50575e] hover:text-[#00a651]"><X className="h-4 w-4" /></button>}
              footerAction={<button onClick={() => setSpaces(false)} className="flex h-9 w-full items-center justify-center gap-2 border border-[#ccd0d4] bg-white text-[13px] text-[#1d2327] hover:text-[#00a651]"><X className="h-4 w-4" /> Fechar</button>}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleBox({ item, subscribers, smtp, busy, act }: { item: AgendaItem; subscribers: number; smtp: boolean; busy: boolean; act: (body: Record<string, unknown>, ok?: string) => Promise<boolean> }) {
  const pending = item.status === 'pending';
  const now = maputo(item.at);
  const [editing, setEditing] = useState(false);
  const [when, setWhen] = useState(now);
  const [nameEdit, setNameEdit] = useState(item.name ?? '');
  const [confirmSend, setConfirmSend] = useState(false);

  return (
    <section className="border border-[#ccd0d4] bg-white">
      <div className="flex flex-wrap items-center gap-2 bg-[#f6f7f7] p-3">
        <CalendarClock className="h-4 w-4 shrink-0 text-[#50575e]" />
        {item.name && <span className="text-[14px] font-bold text-[#1d2327] max-sm:text-[17px]">{item.name} ·</span>}
        <span className="text-[14px] text-[#1d2327] max-sm:text-[17px]">{fmt(item.at)}</span>
        <span className="text-[13px] text-[#50575e] max-sm:basis-full" title={item.result}>
          {STATUS[item.status]} · {item.posts.length} {item.posts.length === 1 ? 'notícia' : 'notícias'}{item.result && !pending ? ` · ${item.result}` : ''}
        </span>
        {pending && (
          <div className="ml-auto flex flex-wrap items-center gap-2 max-sm:ml-0 max-sm:w-full max-sm:flex-nowrap">
            {!editing && <button onClick={() => { setWhen(now); setNameEdit(item.name ?? ''); setEditing(true); }} className={`${btn} justify-center border border-[#ccd0d4] bg-white hover:text-[#00a651] max-sm:min-w-0 max-sm:flex-1 max-sm:px-2`}><Pencil className="h-4 w-4 max-sm:hidden" /> Alterar hora</button>}
            <div className={`flex items-center gap-2 ${confirmSend ? 'flex-wrap max-sm:w-full' : 'max-sm:min-w-0 max-sm:flex-[2] max-sm:flex-nowrap'}`}>
              {confirmSend ? (
                <>
                  <span className="text-[13px]">Enviar já a {subscribers} subscritores?</span>
                  <button onClick={async () => { setConfirmSend(false); await act({ id: item.id, send: true }, 'Newsletter enviada.'); }} className={`${btn} bg-[#00a651] text-white`}>Sim, enviar</button>
                  <button onClick={() => setConfirmSend(false)} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651]`}>Cancelar</button>
                </>
              ) : (
                <button onClick={() => setConfirmSend(true)} disabled={busy || item.posts.length === 0 || subscribers === 0 || !smtp} className={`${btn} justify-center border border-[#ccd0d4] bg-white hover:text-[#00a651] disabled:opacity-50 max-sm:min-w-0 max-sm:flex-1 max-sm:px-2`}><Send className="h-4 w-4 max-sm:hidden" /> Enviar agora</button>
              )}
              <button onClick={() => act({ id: item.id, cancel: true }, 'Agendamento cancelado.')} aria-label="Cancelar agendamento" className={`${btn} w-9 shrink-0 justify-center border border-[#ccd0d4] bg-white !px-0 text-red-600 hover:text-[#00a651]`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
      {pending && editing && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[#ccd0d4] p-3">
          <input value={nameEdit} onChange={(e) => setNameEdit(e.target.value)} maxLength={40} placeholder="Nome (opcional)" className="h-9 w-48 border border-[#8c8f94] bg-white px-3 text-[13px] focus:border-[#047857] focus:outline-none max-sm:w-full" />
          <WhenPicker day={when.day} hour={when.hour} minute={when.minute} onChange={setWhen} extraDay={now.day} />
          <button onClick={async () => { if (await act({ id: item.id, at: toIso(when.day, when.hour, when.minute), name: nameEdit }, 'Horário alterado.')) setEditing(false); }} disabled={busy} className={`${btn} bg-[#00a651] text-white disabled:opacity-50`}><Save className="h-4 w-4" /> Gravar hora</button>
          <button onClick={() => setEditing(false)} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651]`}>Cancelar</button>
        </div>
      )}
    </section>
  );
}

/** Chamadas ao servidor para os agendamentos (partilhadas pelo separador Agendamento e pelas pré-visualizações). */
function useAgenda(onChange: () => Promise<void>, setNotice: (v: string | null) => void, setError: (v: string | null) => void) {
  const [busy, setBusy] = useState(false);
  const call = async (method: 'POST' | 'PATCH' | 'DELETE', body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/newsletter/agenda', { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}.`);
    return data;
  };
  const run = async (fn: () => Promise<string | void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const msg = await fn();
      if (msg) setNotice(msg);
      await onChange();
      return true;
    } catch (err: any) {
      setError(err?.message || 'Não foi possível fazer a alteração.');
      return false;
    } finally {
      setBusy(false);
    }
  };
  const act = (body: Record<string, unknown>, ok?: string) =>
    run(async () => {
      const { cancel, ...rest } = body;
      const data = await call(cancel ? 'DELETE' : 'PATCH', rest);
      return data.result ? String(data.result) : ok;
    });
  const create = (at: string, name = '') =>
    run(async () => {
      const data = await call('POST', { at, name });
      return `Horário gravado: ${data.schedule.name ? `${data.schedule.name} · ` : ''}${fmt(data.schedule.at)}. Na lista de notícias, use «Agendar» para juntar notícias a este envio.`;
    });
  return { busy, act, create };
}

type Props = {
  schedules: AgendaItem[];
  subscribers: number;
  smtp: boolean;
  onChange: () => Promise<void>;
  setNotice: (v: string | null) => void;
  setError: (v: string | null) => void;
};

/** Separador "Agendamento": só os momentos de envio (criar, alterar a hora, enviar já, cancelar). */
export default function NewsletterAgenda({ schedules, subscribers, smtp, onChange, setNotice, setError }: Props) {
  const { busy, act, create } = useAgenda(onChange, setNotice, setError);
  const [when, setWhen] = useState({ day: dayOptions()[0].value, hour: '18', minute: '30' });
  const [adding, setAdding] = useState(false);
  const [nameNew, setNameNew] = useState('');
  const open = schedules.filter((s) => s.status === 'pending' || s.status === 'sending');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="mb-1 font-bold text-[#1d2327]">Novo horário de envio</h3>
            <p className="text-[13px] text-[#50575e] max-sm:hidden">Defina o novo horário de envio da newsletter.</p>
          </div>
          <button onClick={() => setAdding((v) => !v)} className={`${btn} shrink-0 bg-[#00a651] text-white`}>{adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {adding ? 'Fechar' : 'Novo horário'}</button>
        </div>
        {adding && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input value={nameNew} onChange={(e) => setNameNew(e.target.value)} maxLength={40} placeholder="Nome (opcional), ex.: Hora matinal" className="h-9 w-56 border border-[#8c8f94] bg-white px-3 text-[13px] focus:border-[#047857] focus:outline-none max-sm:w-full" />
            <WhenPicker day={when.day} hour={when.hour} minute={when.minute} onChange={setWhen} />
            <button onClick={async () => { if (await create(toIso(when.day, when.hour, when.minute), nameNew)) { setAdding(false); setNameNew(''); } }} disabled={busy} className={`${btn} bg-[#00a651] text-white disabled:opacity-50 max-sm:w-full`}><Save className="h-4 w-4" /> Gravar horário</button>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-[#1d2327]">Horários agendados</h3>
        {open.length === 0 ? (
          <div className="border border-[#ccd0d4] bg-white p-6 text-center text-[13px] text-[#50575e]">Ainda não há envios agendados.</div>
        ) : (
          <div className="space-y-3">{open.map((s) => <ScheduleBox key={s.id} item={s} subscribers={subscribers} smtp={smtp} busy={busy} act={act} />)}</div>
        )}
      </div>
    </div>
  );
}

/** Como o subscritor recebe cada envio agendado; aqui tiram-se e mudam-se de lugar as notícias, ou envia-se já. */
export function NewsletterPreviews({ schedules, subscribers, smtp, onChange, setNotice, setError }: Props) {
  const { busy, act } = useAgenda(onChange, setNotice, setError);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const open = schedules.filter((s) => s.status === 'pending');
  if (open.length === 0) return null;
  return (
    <div className="space-y-6">
      {open.map((s) => (
        <section key={s.id}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
            <h3 className="font-normal text-[#1d2327]"><span className="font-bold max-sm:block">Envio agendado:</span> <span className="max-sm:block">{s.name ? `${s.name} · ` : ''}{fmt(s.at)} · {s.posts.length} {s.posts.length === 1 ? 'notícia' : 'notícias'}</span></h3>
            {confirmId === s.id ? (
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <span>Enviar já a {subscribers} subscritores?</span>
                <button onClick={async () => { setConfirmId(null); await act({ id: s.id, send: true }, 'Newsletter enviada.'); }} className={`${btn} bg-[#00a651] text-white`}>Sim, enviar</button>
                <button onClick={() => setConfirmId(null)} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651]`}>Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setConfirmId(s.id)} disabled={busy || s.posts.length === 0 || subscribers === 0 || !smtp} className={`${btn} justify-center border border-[#ccd0d4] bg-white hover:text-[#00a651] disabled:opacity-50 max-sm:w-full max-sm:border-[#d6101c] max-sm:bg-[#d6101c] max-sm:text-white max-sm:hover:text-white`}>
                <Send className="h-4 w-4" /> Enviar agora
              </button>
            )}
          </div>
          <EmailPreview item={s} editable onRemove={(slug) => act({ id: s.id, remove: slug })} onMove={(slug, dir) => act({ id: s.id, move: { slug, dir } })} />
        </section>
      ))}
    </div>
  );
}
