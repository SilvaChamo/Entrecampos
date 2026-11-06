'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import AdminSelect from '@/components/Admin/AdminSelect';
import { uploadToLibrary } from '@/components/Admin/ImageChooser';
import { AD_LETTER, AD_POSITIONS, AD_SLOTS, adMeasure, formatPrice, slotLabel } from '@/lib/newsletter-brand';

type Ad = { id: string; slot: string; advertiser: string; image: string; link: string; active: boolean; createdAt: string };
type Stat = { sent: number; clicks: number; people: number };
type Data = { prices: Record<string, number>; ads: Ad[]; stats: Record<string, Stat> };

const btn = 'flex h-9 items-center justify-center gap-2 px-4 rounded-md whitespace-nowrap text-[13px]';
const field = 'h-9 w-full border border-[#ccd0d4] bg-white px-3 text-[13px] focus:border-[#00a651] focus:outline-none';

/** Publicidade da newsletter: o custo de cada espaço e os anúncios que estão (ou não) a seguir nos envios. */
export default function NewsletterAds({ setNotice, setError }: { setNotice: (v: string | null) => void; setError: (v: string | null) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [slot, setSlot] = useState(AD_SLOTS[0].key);
  const [advertiser, setAdvertiser] = useState('');
  const [link, setLink] = useState('');
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/newsletter/ads', { credentials: 'include', cache: 'no-store' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao carregar a publicidade.');
      setData(d);
      setPrices(Object.fromEntries(AD_SLOTS.map((s) => [s.key, d.prices[s.key] ? String(d.prices[s.key]) : ''])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar a publicidade.');
    }
  }, [setError]);
  useEffect(() => { load(); }, [load]);

  async function call(method: string, body: Record<string, unknown>, ok: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/newsletter/ads', { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Não foi possível guardar.');
      setNotice(ok);
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível guardar.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function pickImage(f: File | undefined) {
    if (!f) return;
    const max = AD_SLOTS.find((x) => x.key === slot)!.kb;
    if (f.size > max * 1024) {
      setError(`A imagem pesa ${Math.ceil(f.size / 1024)} KB; o Tamanho deste espaço é de ${max} KB.`);
      if (file.current) file.current.value = '';
      return;
    }
    setUploading(true);
    setError(null);
    try {
      setImage(await uploadToLibrary(f, advertiser || 'anuncio'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar a imagem.');
    } finally {
      setUploading(false);
      if (file.current) file.current.value = '';
    }
  }

  const cur = AD_SLOTS.find((s) => s.key === slot)!;
  const size = (k: string) => adMeasure(AD_SLOTS.find((y) => y.key === k)!);
  const stats = data?.stats ?? {};

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-1 text-[#1d2327]">Custo de cada espaço</h3>
        <p className="mb-3 text-[13px] text-[#50575e]">Em meticais (MT). Quem abre «Ver espaços de publicidade» vê estes valores; sem valor, aparece «Sob consulta».</p>
        <div className="overflow-hidden border border-[#ccd0d4]">
          {AD_SLOTS.map((s) => (
            <div key={s.key} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f0f1] px-3 py-2 last:border-0 max-sm:flex-col max-sm:items-stretch">
              <div className="text-[13px]">
                <span className="block font-bold text-[#1d2327]">{AD_LETTER[s.position]} · {AD_POSITIONS[s.position]}</span>
                <span className="block text-[#50575e]">{adMeasure(s)}</span>
              </div>
              <input type="number" min={0} inputMode="numeric" value={prices[s.key] ?? ''} onChange={(e) => setPrices({ ...prices, [s.key]: e.target.value })} placeholder="Sob consulta" className={`${field} w-40 max-sm:w-full`} aria-label={`Custo: ${slotLabel(s.key)}`} />
            </div>
          ))}
        </div>
        <button disabled={busy} onClick={() => call('PATCH', { prices }, 'Custos guardados.')} className={`${btn} mt-3 bg-[#00a651] text-white disabled:opacity-60 max-sm:w-full`}><Save className="h-4 w-4" /> Guardar custos</button>
      </section>

      <section>
        <h3 className="mb-1 text-[#1d2327]">Novo anúncio</h3>
        <p className="mb-3 text-[13px] text-[#50575e]">O anúncio aparece nos próximos envios, no espaço escolhido, sem qualquer legenda. Use uma imagem de {adMeasure(cur)}.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminSelect value={slot} onChange={(e) => setSlot(e.target.value as typeof slot)} className="h-10 w-full border border-[#ccd0d4] bg-white px-3 text-[13px]">
            {AD_SLOTS.map((s) => <option key={s.key} value={s.key}>{slotLabel(s.key)} · {formatPrice(data?.prices[s.key])}</option>)}
          </AdminSelect>
          <input value={advertiser} onChange={(e) => setAdvertiser(e.target.value)} placeholder="Anunciante" className={field} />
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Ligação do anúncio (https://…)" className={`${field} sm:col-span-2`} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
          <button onClick={() => file.current?.click()} disabled={uploading} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651] disabled:opacity-60 max-sm:w-full`}><ImagePlus className="h-4 w-4" /> {uploading ? 'A enviar…' : image ? 'Trocar imagem' : 'Escolher imagem'}</button>
          {image && <img src={image} alt="" className="max-h-16 max-w-full border border-[#ccd0d4]" />}
        </div>
        <button
          disabled={busy || uploading || !image || !link}
          onClick={async () => { if (await call('POST', { slot, advertiser, image, link }, 'Anúncio adicionado.')) { setAdvertiser(''); setLink(''); setImage(''); } }}
          className={`${btn} mt-3 bg-[#00a651] text-white disabled:opacity-50 max-sm:w-full`}
        ><Plus className="h-4 w-4" /> Adicionar anúncio</button>
      </section>

      <section>
        <h3 className="mb-2 text-[#1d2327]">Anúncios ({data?.ads.length ?? 0})</h3>
        {!data || data.ads.length === 0 ? (
          <div className="border border-[#ccd0d4] p-6 text-center text-[13px] text-[#50575e]">Ainda não há anúncios.</div>
        ) : (
          <ul className="space-y-2">
            {data.ads.map((ad) => {
              const st = stats[ad.id];
              return (
                <li key={ad.id} className="flex flex-wrap items-center gap-3 border border-[#ccd0d4] bg-white p-3 text-[13px]">
                  <img src={ad.image} alt="" className="h-12 w-20 shrink-0 border border-[#ccd0d4] object-cover" />
                  <div className="min-w-0 flex-1 max-sm:basis-full">
                    <div className="truncate text-[#1d2327]">{ad.advertiser}</div>
                    <div className="text-[12px] text-[#50575e]">{AD_SLOTS.some((x) => x.key === ad.slot) ? <><span className="font-bold text-[#1d2327]">{AD_POSITIONS[ad.slot as keyof typeof AD_POSITIONS]}</span> — {size(ad.slot)}</> : 'Espaço antigo (já não existe)'}</div>
                    <div className="text-[12px] text-[#50575e]">Alcançados: {st?.sent ?? 0} · Cliques: {st?.clicks ?? 0} · Pessoas que clicaram: {st?.people ?? 0}</div>
                  </div>
                  <button disabled={busy} onClick={() => call('PATCH', { id: ad.id, active: !ad.active }, ad.active ? 'Anúncio desligado.' : 'Anúncio ligado.')} className={`${btn} border border-[#ccd0d4] bg-white hover:text-[#00a651] max-sm:flex-1 ${ad.active ? 'text-[#00a651]' : 'text-[#50575e]'}`}>{ad.active ? 'Ligado' : 'Desligado'}</button>
                  <button disabled={busy} onClick={() => { if (confirm('Eliminar este anúncio?')) call('DELETE', { id: ad.id }, 'Anúncio eliminado.'); }} aria-label="Eliminar anúncio" className="flex h-9 w-9 items-center justify-center text-red-600 hover:text-[#00a651]"><Trash2 className="h-4 w-4" /></button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
