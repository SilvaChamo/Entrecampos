'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, LayoutTemplate, Megaphone, Plus, RotateCcw, Save, Upload, X } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import AdminSelect from '@/components/Admin/AdminSelect';
import { uploadToLibrary } from '@/components/Admin/ImageChooser';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';
import {
  HOME_AD_SIZES,
  HOME_CATEGORY_SLOTS,
  HOME_SECTIONS,
  HOME_ZONES,
  defaultHomeCategories,
  defaultHomeLayout,
  defaultHomeOptions,
  isAdId,
  normalizeHomeCategories,
  normalizeHomeLayout,
  normalizeHomeOptions,
  type HeroSide,
  type HeroStyle,
  type HomeAd,
  type HomeCategories,
  type HomeLayout,
  type HomeOptions,
  type HomeZone,
} from '@/lib/home-sections';

const LABEL = Object.fromEntries(HOME_SECTIONS.map((s) => [s.id, s.label])) as Record<string, string>;
const zoneOf = (id: HomeZone) => HOME_ZONES.find((z) => z.id === id)!;
type State = { layout: HomeLayout; categories: HomeCategories; options: HomeOptions };
type CategoryOption = { slug: string; label: string };

const sameLayout = (a: HomeLayout, b: HomeLayout) => HOME_ZONES.every((z) => a[z.id].join() === b[z.id].join());
const sameCats = (a: HomeCategories, b: HomeCategories) => HOME_CATEGORY_SLOTS.every((s) => a[s.key].join() === b[s.key].join());
const sameOptions = (a: HomeOptions, b: HomeOptions) => JSON.stringify(a) === JSON.stringify(b);
const isDefault = (s: State) => sameLayout(s.layout, defaultHomeLayout()) && sameCats(s.categories, defaultHomeCategories()) && sameOptions(s.options, defaultHomeOptions());
const parse = (data: any): State => ({ layout: normalizeHomeLayout(data.layout), categories: normalizeHomeCategories(data.categories), options: normalizeHomeOptions(data.options) });

/** Copia para `base` só o que pertence a uma zona (a posição, as categorias das suas secções, a disposição do destaque e os seus anúncios), com o que está em `from`. */
function mergeZone(base: State, from: State, zone: HomeZone): State {
  const ids = from.layout[zone];
  const categories = { ...base.categories };
  for (const slot of HOME_CATEGORY_SLOTS) if (ids.includes(slot.section)) categories[slot.key] = from.categories[slot.key];
  const hasHero = ids.includes('destaque');
  const own = new Set([...base.layout[zone], ...ids]);
  return {
    layout: { ...base.layout, [zone]: [...ids] },
    categories,
    options: {
      heroSide: hasHero ? from.options.heroSide : base.options.heroSide,
      heroStyle: hasHero ? from.options.heroStyle : base.options.heroStyle,
      ads: [...base.options.ads.filter((a) => !own.has(a.id)), ...from.options.ads.filter((a) => ids.includes(a.id))],
    },
  };
}
const zoneState = (st: State, zone: HomeZone) => JSON.stringify({ l: st.layout[zone], c: HOME_CATEGORY_SLOTS.filter((x) => st.layout[zone].includes(x.section)).map((x) => st.categories[x.key]), h: st.layout[zone].includes('destaque') ? [st.options.heroSide, st.options.heroStyle] : null, a: st.options.ads.filter((a) => st.layout[zone].includes(a.id)) });

const field = 'h-9 w-full border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none';
const fieldSide = field.replace('w-full', 'min-w-0 flex-1'); // ao lado de um título: ocupa o que sobra da linha
const arrow = 'flex h-9 w-9 shrink-0 items-center justify-center border border-[#ccd0d4] bg-white text-[#2c3338] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40';
const btn = 'flex h-9 items-center gap-1.5 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60';

/** Secções da página inicial, dispostas como no site: topo, coluna principal e barra lateral (duas vezes) e fim. As setas mudam a posição, o selector a categoria e cada zona aceita espaços de publicidade. */
export default function HomeSeccoesPage() {
  const first = adminCacheGet<State>('home-sections-v3');
  const [saved, setSaved] = useState<State | null>(first ?? null);
  const [draft, setDraft] = useState<State | null>(first ?? null);
  const [options, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(!first);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/home-sections', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar as secções.');
        const st = parse(data);
        adminCacheSet('home-sections-v3', st);
        setSaved(st);
        setDraft((cur) => cur ?? st);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar as secções.'))
      .finally(() => setLoading(false));
    fetch('/api/admin/categories', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCategoryOptions(Array.isArray(data?.options) ? data.options : []))
      .catch(() => {});
  }, []);

  const changed = useMemo(
    () => !!draft && !!saved && (!sameLayout(draft.layout, saved.layout) || !sameCats(draft.categories, saved.categories) || !sameOptions(draft.options, saved.options)),
    [draft, saved],
  );

  const zoneChanged = (zone: HomeZone) => !!draft && !!saved && zoneState(draft, zone) !== zoneState(saved, zone);

  const edit = (fn: (cur: State) => State) => {
    setDone(null);
    setDraft((cur) => (cur ? fn(cur) : cur));
  };

  /** Sobe ou desce uma secção dentro da sua zona. */
  const shift = (zone: HomeZone, index: number, by: -1 | 1) =>
    edit((cur) => {
      const list = [...cur.layout[zone]];
      const to = index + by;
      if (to < 0 || to >= list.length) return cur;
      [list[index], list[to]] = [list[to], list[index]];
      return { ...cur, layout: { ...cur.layout, [zone]: list } };
    });

  const setCategory = (key: string, list: string[]) => edit((cur) => ({ ...cur, categories: { ...cur.categories, [key]: list } }));
  const setHeroStyle = (heroStyle: HeroStyle) => edit((cur) => ({ ...cur, options: { ...cur.options, heroStyle } }));
  const setHeroSide = (heroSide: HeroSide) => edit((cur) => ({ ...cur, options: { ...cur.options, heroSide } }));

  const addAd = (zone: HomeZone) =>
    edit((cur) => {
      const id = `pub-${(Math.random().toString(36) + '0000000').slice(2, 8)}`;
      return {
        ...cur,
        layout: { ...cur.layout, [zone]: [...cur.layout[zone], id] },
        options: { ...cur.options, ads: [...cur.options.ads, { id, image: '', link: '' }] },
      };
    });
  const removeAd = (id: string) =>
    edit((cur) => ({
      ...cur,
      layout: Object.fromEntries(HOME_ZONES.map((z) => [z.id, cur.layout[z.id].filter((x) => x !== id)])) as HomeLayout,
      options: { ...cur.options, ads: cur.options.ads.filter((a) => a.id !== id) },
    }));
  const setAd = (id: string, patch: Partial<HomeAd>) =>
    edit((cur) => ({ ...cur, options: { ...cur.options, ads: cur.options.ads.map((a) => (a.id === id ? { ...a, ...patch } : a)) } }));

  async function save(body: State | null, zone?: HomeZone) {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      // Com `zone`, guarda só o que mudou nesse cartão; o resto fica como está guardado.
      const toSend = body && zone && saved ? mergeZone(saved, body, zone) : body;
      const payload = toSend === null ? { layout: null, categories: null, options: null } : { ...toSend, options: { ...toSend.options, ads: toSend.options.ads.filter((a) => HOME_ZONES.some((z) => toSend.layout[z.id].includes(a.id))) } };
      const res = await fetch('/api/admin/home-sections', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível guardar.');
      const st = parse(data);
      adminCacheSet('home-sections-v3', st);
      setSaved(st);
      setDraft((cur) => (zone && cur ? mergeZone(cur, st, zone) : st));
      setDone(body === null ? 'Posição, categorias e publicidade de origem repostas' : zone ? `Guardado: ${zoneOf(zone).label}` : 'Guardado: a página inicial já mostra as alterações');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar.');
    } finally {
      setBusy(false);
    }
  }

  // O título de uma secção com uma só categoria acompanha a categoria escolhida (como no site); «Publicações recentes» mantém o nome de origem enquanto tem a categoria de origem.
  const rowLabel = (id: string) => {
    const slots = HOME_CATEGORY_SLOTS.filter((x) => x.section === id);
    if (!draft || slots.length !== 1 || slots[0].multi || id === 'destaque') return LABEL[id];
    const slug = draft.categories[slots[0].key][0];
    if (id === 'recentes' && slug === slots[0].defaults[0]) return LABEL[id];
    return options.find((o) => o.slug === slug)?.label ?? slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  };

  // Secções com uma só categoria, nas zonas largas: o selector fica na mesma linha do título e das setas (a partir do computador).
  const inlineSlot = (zone: HomeZone, id: string) =>
    ['top', 'main', 'main2', 'bottom'].includes(zone) && HOME_CATEGORY_SLOTS.filter((x) => x.section === id).length === 1 && !HOME_CATEGORY_SLOTS.find((x) => x.section === id)!.multi;

  // Chamada como função (e não como componente) para os campos não perderem o foco a cada letra escrita.
  function zoneBox(zone: HomeZone) {
    if (!draft) return null;
    const z = zoneOf(zone);
    const list = draft.layout[zone];
    return (
      <section className="min-w-0 border border-[#ccd0d4] bg-white">
        <header className="border-b border-[#e5e5e5] px-4 py-3">
          <h2 className="text-[14px] text-[#1d2327]">{z.label}</h2>
          <p className="text-[12px] text-gray-500">{z.hint}</p>
        </header>
        {list.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-gray-500">Nenhuma secção nesta zona.</p>
        ) : (
          <ul className="divide-y divide-[#e5e5e5]">
            {list.map((id, i) => (
              <li key={id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-[13px] text-gray-400">{i + 1}</span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-[#1d2327]">
                    {isAdId(id) && <Megaphone className="h-4 w-4 shrink-0 text-[#d6101c]" />}
                    <span className="truncate">{isAdId(id) ? 'Espaço de publicidade' : rowLabel(id)}</span>
                  </span>
                  {inlineSlot(zone, id) && (
                    <div className="w-[260px] shrink-0 max-lg:hidden">
                      <CategoryControl section={id} categories={draft.categories} options={options} onChange={setCategory} bare heroStyle={draft.options.heroStyle} />
                    </div>
                  )}
                  {list.length > 1 && (
                    <>
                      <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => shift(zone, i, -1)} className={arrow}>
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="Descer" disabled={i === list.length - 1} onClick={() => shift(zone, i, 1)} className={arrow}>
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {isAdId(id) && (
                    <button type="button" aria-label="Retirar o espaço de publicidade" onClick={() => removeAd(id)} className={`${arrow} hover:text-[#d63638]`}>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {isAdId(id) ? (
                  <AdFields zone={zone} ad={draft.options.ads.find((a) => a.id === id) ?? { id, image: '', link: '' }} onChange={(patch) => setAd(id, patch)} canSave={zoneChanged(zone) && !busy} busy={busy} onSave={() => draft && save(draft, zone)} />
                ) : (
                  <div className={`mt-3 space-y-2${inlineSlot(zone, id) ? ' lg:hidden' : ''}`}>
                    {id === 'destaque' && (
                      <div className="flex items-center gap-3">
                        <span className="w-[100px] shrink-0 text-[13px] text-gray-500">Estilo</span>
                        <AdminSelect aria-label="Estilo do destaque" value={draft.options.heroStyle} onChange={(e) => setHeroStyle(e.target.value as HeroStyle)} className={fieldSide}>
                          <option value="cards">Banner e dois cards</option>
                          <option value="lista">Banner e lista com slide para cima</option>
                          <option value="carrossel">Carrossel de largura total</option>
                        </AdminSelect>
                      </div>
                    )}
                    {id === 'destaque' && draft.options.heroStyle !== 'carrossel' && (
                      <div className="flex items-center gap-3">
                        <span className="w-[100px] shrink-0 text-[13px] text-gray-500">Disposição</span>
                        <AdminSelect aria-label="Disposição do destaque" value={draft.options.heroSide} onChange={(e) => setHeroSide(e.target.value as HeroSide)} className={fieldSide}>
                          <option value="banner-esquerda">{draft.options.heroStyle === 'lista' ? 'Banner à esquerda e lista à direita' : 'Banner à esquerda e cards à direita'}</option>
                          <option value="cards-esquerda">{draft.options.heroStyle === 'lista' ? 'Lista à esquerda e banner à direita' : 'Cards à esquerda e banner à direita'}</option>
                        </AdminSelect>
                      </div>
                    )}
                    <CategoryControl section={id} categories={draft.categories} options={options} onChange={setCategory} heroStyle={draft.options.heroStyle} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e5e5e5] px-4 py-3">
          <button type="button" onClick={() => addAd(zone)} className={`${btn} justify-center border border-dashed border-[#00a651] bg-white text-[#00a651] hover:bg-[#f0f7f4]`}>
            <Plus className="h-4 w-4" /> Adicionar publicidade
          </button>
          <button type="button" disabled={busy || !zoneChanged(zone)} onClick={() => draft && save(draft, zone)} className={`${btn} ml-auto justify-center bg-[#00a651] text-white hover:bg-[#008f46]`}>
            {busy ? <Spinner size={16} /> : <Save className="h-4 w-4" />} Guardar
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="ec-page text-[#2c3338]">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-[23px] font-normal text-[#1d2327]">
          <LayoutTemplate className="h-5 w-5 text-gray-500" /> Secções da página inicial
        </h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !draft || isDefault(draft)}
            onClick={() => confirm('Voltar à posição, às categorias e à publicidade de origem da página inicial?') && save(null)}
            className={`${btn} border border-[#ccd0d4] bg-white text-[#2c3338] hover:bg-gray-50`}
          >
            <RotateCcw className="h-4 w-4" /> Repor origem
          </button>
          <button type="button" disabled={busy || !changed} onClick={() => draft && save(draft)} className={`${btn} bg-[#00a651] text-white hover:bg-[#008f46]`}>
            {busy ? <Spinner size={16} /> : <Save className="h-4 w-4" />} Guardar
          </button>
        </div>
      </div>

      <p className="mb-4 text-[13px] text-gray-600">
        Está organizada como a página do site. Use as setas para mudar a posição, o selector para escolher a categoria de cada secção e adicione espaços de publicidade onde quiser. Só muda no site depois de guardar.
      </p>

      {error && <p className="mb-4 border-l-4 border-[#d63638] bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</p>}
      {done && <p className="mb-4 border-l-4 border-[#00a651] bg-green-50 px-3 py-2 text-[13px] text-green-800">{done}</p>}

      {loading && !draft ? (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center"><Spinner size={40} /></div>
      ) : draft ? (
        <div className="space-y-3">
          {zoneBox('top')}
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
            {zoneBox('main')}
            {zoneBox('side')}
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
            {zoneBox('main2')}
            {zoneBox('side2')}
          </div>
          {zoneBox('bottom')}
        </div>
      ) : null}
    </div>
  );
}

/** Imagem e ligação de um espaço de publicidade. A imagem tem de ter a medida exacta do espaço (a da página dos espaços de publicidade do site). */
function AdFields({ zone, ad, onChange, canSave, busy, onSave }: { zone: HomeZone; ad: HomeAd; onChange: (patch: Partial<HomeAd>) => void; canSave: boolean; busy: boolean; onSave: () => void }) {
  const size = HOME_AD_SIZES[zone];
  const fileRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = async (file: File) => {
    setSending(true);
    setErr(null);
    try {
      const bmp = await createImageBitmap(file).catch(() => null);
      if (!bmp) throw new Error('Escolha um ficheiro de imagem.');
      const { width, height } = bmp;
      bmp.close();
      if (width !== size.w || height !== size.h) throw new Error(`A imagem tem ${width}x${height}px e este espaço pede exactamente ${size.w}x${size.h}px.`);
      onChange({ image: await uploadToLibrary(file) });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não foi possível enviar a imagem.');
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="mt-3 space-y-3">
      <p className="text-[12px] text-gray-500">{size.name}: imagem de {size.w}x{size.h}px, até {size.kb}kb. Sem imagem, o espaço não aparece no site.</p>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] text-gray-500">Imagem</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={ad.image} onChange={(e) => onChange({ image: e.target.value })} placeholder="https://… (ou carregue um ficheiro)" className={field} aria-label="Endereço da imagem do anúncio" />
          <button type="button" disabled={sending} onClick={() => fileRef.current?.click()} className={`${btn} shrink-0 justify-center border border-[#00a651] bg-white text-[#00a651] hover:bg-[#f0f7f4]`}>
            {sending ? <Spinner size={16} /> : <Upload className="h-4 w-4" />} Carregar
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) send(f); }} />
        {err && <p className="text-[12px] text-[#d63638]">{err}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] text-gray-500">Ligação</span>
        <input value={ad.link} onChange={(e) => onChange({ link: e.target.value })} placeholder="https://… (para onde o anúncio leva)" className={field} aria-label="Ligação do anúncio" />
      </div>
      <button type="button" disabled={!canSave} onClick={onSave} className={`${btn} w-full justify-center bg-[#00a651] text-white hover:bg-[#008f46] sm:w-auto`}>
        {busy ? <Spinner size={16} /> : <Save className="h-4 w-4" />} Guardar
      </button>
    </div>
  );
}

/** Selector(es) de categoria de uma secção. Secções com várias categorias mostram-nas em etiquetas que se podem retirar, e o selector junta outra. */
function CategoryControl({ section, categories, options, onChange, bare = false, heroStyle }: { section: string; categories: HomeCategories; options: CategoryOption[]; onChange: (key: string, list: string[]) => void; bare?: boolean; heroStyle?: HeroStyle }) {
  const side = section === 'destaque'; // no destaque o título fica ao lado do selector
  // O destaque mostra os selectores do estilo escolhido: dois cards ou a lista.
  const activeSlots = HOME_CATEGORY_SLOTS.filter((s) => s.section !== 'destaque' || (heroStyle === 'carrossel' ? false : (heroStyle === 'lista') === (s.key === 'herolista')));
  const slots = activeSlots.filter((s) => s.section === section);
  if (slots.length === 0) return null;
  const labelOf = (slug: string) => options.find((o) => o.slug === slug)?.label ?? slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  return (
    <>
      {slots.map((slot) => {
        const list = categories[slot.key];
        // Uma categoria só pode estar num selector: as que já estão noutro não se oferecem (a que este já tem fica).
        const usedElsewhere = new Set(activeSlots.filter((x) => x.key !== slot.key).flatMap((x) => categories[x.key]));
        const free = options.filter((o) => o.slug === list[0] || !usedElsewhere.has(o.slug));
        const all = free.some((o) => o.slug === list[0]) || options.length === 0 ? free : [{ slug: list[0], label: labelOf(list[0]) }, ...free];
        return (
          <div key={slot.key} className={side ? 'flex items-center gap-3' : 'flex flex-col gap-1'}>
            {!bare && <span className={`text-[13px] text-gray-500${side ? ' w-[100px] shrink-0' : ''}`}>{slot.label}</span>}
            {slot.multi ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {list.map((slug) => (
                  <span key={slug} className="flex h-9 items-center gap-1.5 border border-[#ccd0d4] bg-[#f6f7f7] pl-3 pr-1 text-[13px] text-[#1d2327]">
                    {labelOf(slug)}
                    <button type="button" aria-label={`Retirar ${labelOf(slug)}`} disabled={list.length === 1} onClick={() => onChange(slot.key, list.filter((x) => x !== slug))} className="flex h-7 w-7 items-center justify-center text-gray-500 hover:text-[#d63638] disabled:cursor-not-allowed disabled:opacity-40">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
                <AdminSelect aria-label="Juntar categoria" value="" onChange={(e) => e.target.value && onChange(slot.key, [...list, e.target.value])} className={`${field} sm:w-[210px]`}>
                  <option value="">Juntar categoria…</option>
                  {options.filter((o) => !list.includes(o.slug) && !usedElsewhere.has(o.slug)).map((o) => (
                    <option key={o.slug} value={o.slug}>{o.label}</option>
                  ))}
                </AdminSelect>
              </div>
            ) : (
              <AdminSelect aria-label={slot.label} value={list[0]} onChange={(e) => onChange(slot.key, [e.target.value])} className={side ? fieldSide : field}>
                {all.map((o) => (
                  <option key={o.slug} value={o.slug}>{o.label}</option>
                ))}
              </AdminSelect>
            )}
          </div>
        );
      })}
    </>
  );
}
