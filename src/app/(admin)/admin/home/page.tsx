'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRightLeft, ArrowUp, ChevronDown, Copy, Eye, EyeOff, LayoutTemplate, Megaphone, Plus, RotateCcw, Save, Trash2, Upload, X } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import AdminSelect from '@/components/Admin/AdminSelect';
import Slide from '@/components/Admin/Slide';
import { uploadToLibrary } from '@/components/Admin/ImageChooser';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';
import {
  HOME_AD_SIZES,
  HOME_CATEGORY_SLOTS,
  HOME_SECTIONS,
  HOME_ZONES,
  DUPLICABLE,
  baseId,
  isCopyId,
  sectionLabel,
  slotKey,
  slotsFor,
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
  type SectionSettings,
} from '@/lib/home-sections';

const LABEL = Object.fromEntries(HOME_SECTIONS.map((s) => [s.id, s.label])) as Record<string, string>;
const newCode = () => (Math.random().toString(36) + '0000000').slice(2, 8);
const zoneOf = (id: HomeZone) => HOME_ZONES.find((z) => z.id === id)!;
type State = { layout: HomeLayout; categories: HomeCategories; options: HomeOptions };
type CategoryOption = { slug: string; label: string };

const sameLayout = (a: HomeLayout, b: HomeLayout) => HOME_ZONES.every((z) => a[z.id].join() === b[z.id].join());
const sameCats = (a: HomeCategories, b: HomeCategories) => [...new Set([...Object.keys(a), ...Object.keys(b)])].every((k) => (a[k] ?? []).join() === (b[k] ?? []).join());
const sameOptions = (a: HomeOptions, b: HomeOptions) => JSON.stringify(a) === JSON.stringify(b);
const isDefault = (s: State) => sameLayout(s.layout, defaultHomeLayout()) && sameCats(s.categories, defaultHomeCategories()) && sameOptions(s.options, defaultHomeOptions());
const parse = (data: any): State => ({ layout: normalizeHomeLayout(data.layout), categories: normalizeHomeCategories(data.categories), options: normalizeHomeOptions(data.options) });

const field = 'h-9 w-full border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none';
const fieldWide = field.replace('w-full', 'w-full sm:w-[170px]'); // selector dos detalhes: largura certa, vários na mesma linha
const fieldRow = field.replace('h-9', 'h-8'); // selector dentro da linha: mesma altura dos botões da linha
const fieldHalf = field.replace('w-full', 'w-full sm:w-1/2'); // selector em linha própria: metade da largura da linha
const fieldLabel = 'shrink-0 text-[13px] text-gray-500'; // etiqueta à esquerda do selector
const fieldSide = field.replace('w-full', 'min-w-0 flex-1'); // ao lado de um título: ocupa o que sobra da linha
const arrow = 'flex h-8 w-8 shrink-0 items-center justify-center border border-[#ccd0d4] bg-white text-[#2c3338] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40';
const btn = 'flex h-9 items-center gap-1.5 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60';

/** Secções da página inicial, dispostas como no site: topo, coluna principal e barra lateral (duas vezes) e fim. As setas mudam a posição, o selector a categoria e cada zona aceita espaços de publicidade. */
export default function HomeSeccoesPage() {
  const first = adminCacheGet<State>('home-sections-v6');
  const [saved, setSaved] = useState<State | null>(first ?? null);
  const [draft, setDraft] = useState<State | null>(first ?? null);
  const [options, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(!first);
  const [saving, setSaving] = useState<'save' | 'reset' | null>(null);
  const busy = saving !== null;
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [openRows, setOpenRows] = useState<string[]>([]); // secções com os detalhes (categorias e opções) abertos
  const [moving, setMoving] = useState<string | null>(null); // secção com o selector «Mover para» aberto
  const [picked, setPicked] = useState<string[]>([]); // secções marcadas para mover juntas

  useEffect(() => {
    fetch('/api/admin/home-sections', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar as secções.');
        const st = parse(data);
        adminCacheSet('home-sections-v6', st);
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

  const edit = (fn: (cur: State) => State) => {
    setDone(null);
    setDraft((cur) => (cur ? fn(cur) : cur));
  };

  /** Sobe ou desce uma secção dentro da sua zona (a «lista ao lado do slide» não aparece na lista: troca-se pelo Estilo do slide). */
  const shift = (zone: HomeZone, id: string, by: -1 | 1) =>
    edit((cur) => {
      const list = [...cur.layout[zone]];
      const shown = list.filter((x) => x !== 'destaque-lista');
      const target = shown[shown.indexOf(id) + by];
      if (!target) return cur;
      const [from, to] = [list.indexOf(id), list.indexOf(target)];
      [list[from], list[to]] = [list[to], list[from]];
      return { ...cur, layout: { ...cur.layout, [zone]: list } };
    });

  const setCategory = (key: string, list: string[]) => edit((cur) => ({ ...cur, categories: { ...cur.categories, [key]: list } }));
  // «Que destaque mostrar»: slide com dois cards, slide com lista, ou um dos carrosséis. Slide com cards/lista liga uma peça e desliga a outra.
  const heroMode = (o: HomeOptions): 'cards' | 'lista' | HeroStyle =>
    o.heroStyle !== 'cards' ? o.heroStyle : o.hidden.includes('destaque-card1') && o.hidden.includes('destaque-card2') && !o.hidden.includes('destaque-lista') ? 'lista' : 'cards';
  const setHeroMode = (mode: string) =>
    edit((cur) => {
      const without = (ids: string[]) => cur.options.hidden.filter((x) => !ids.includes(x));
      const hidden = mode === 'cards' ? [...without(['destaque-card1', 'destaque-card2']), 'destaque-lista'] : mode === 'lista' ? [...without(['destaque-lista']), 'destaque-card1', 'destaque-card2'] : cur.options.hidden;
      return { ...cur, options: { ...cur.options, heroStyle: mode === 'lista' ? 'cards' : (mode as HeroStyle), hidden: [...new Set(hidden)] } };
    });
  /** Passa uma secção para outra zona (para o fim dela); depois as setas ajustam o lugar. */
  const moveTo = (id: string, to: HomeZone) => {
    setMoving(null);
    edit((cur) => {
      const layout = Object.fromEntries(HOME_ZONES.map((z) => [z.id, cur.layout[z.id].filter((x) => x !== id)])) as HomeLayout;
      layout[to] = [...layout[to], id];
      return { ...cur, layout };
    });
  };

  /** Copia uma secção: a cópia fica logo a seguir, com a mesma categoria e as mesmas opções (depois muda-se à vontade). */
  const duplicate = (zone: HomeZone, id: string) =>
    edit((cur) => {
      const copy = `${baseId(id)}~${newCode()}`;
      const list = [...cur.layout[zone]];
      list.splice(list.indexOf(id) + 1, 0, copy);
      // Copia as categorias de todos os lugares da secção (os cards têm dois).
      const categories = { ...cur.categories };
      for (const slot of HOME_CATEGORY_SLOTS.filter((x) => x.section === baseId(id))) categories[slotKey(copy, slot.key)] = [...(cur.categories[slotKey(id, slot.key)] ?? slot.defaults)];
      return {
        ...cur,
        layout: { ...cur.layout, [zone]: list },
        categories,
        options: { ...cur.options, sections: cur.options.sections[id] ? { ...cur.options.sections, [copy]: { ...cur.options.sections[id] } } : cur.options.sections },
      };
    });

  /** Apaga uma cópia (as secções de origem não se apagam: desliga-se com o olho). */
  const removeCopy = (id: string) => {
    if (!confirm('Apagar esta cópia da secção?')) return;
    setPicked((p) => p.filter((x) => x !== id));
    edit((cur) => {
      const categories = { ...cur.categories };
      for (const slot of slotsFor(id)) delete categories[slot.key];
      delete categories[id];
      const { [id]: _s, ...sections } = cur.options.sections;
      return {
        layout: Object.fromEntries(HOME_ZONES.map((z) => [z.id, cur.layout[z.id].filter((x) => x !== id)])) as HomeLayout,
        categories,
        options: { ...cur.options, sections, hidden: cur.options.hidden.filter((x) => x !== id) },
      };
    });
  };

  /** Muda uma opção da secção (linhas, número de notícias, carrossel). */
  const setSetting = (id: string, patch: SectionSettings) =>
    edit((cur) => ({ ...cur, options: { ...cur.options, sections: { ...cur.options.sections, [id]: { ...cur.options.sections[id], ...patch } } } }));

  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /** Passa as secções marcadas, todas juntas e pela mesma ordem em que estão, para o fim de outra zona. */
  const moveMany = (to: HomeZone) =>
    edit((cur) => {
      const order = HOME_ZONES.flatMap((z) => cur.layout[z.id]).filter((id) => picked.includes(id));
      const layout = Object.fromEntries(HOME_ZONES.map((z) => [z.id, cur.layout[z.id].filter((x) => !picked.includes(x))])) as HomeLayout;
      layout[to] = [...layout[to], ...order];
      setPicked([]);
      return { ...cur, layout };
    });

  /** Olho: desliga a secção da home (fica na lista, mas não aparece no site) ou volta a ligá-la. */
  const toggleHidden = (id: string) =>
    edit((cur) => ({ ...cur, options: { ...cur.options, hidden: cur.options.hidden.includes(id) ? cur.options.hidden.filter((x) => x !== id) : [...cur.options.hidden, id] } }));
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
      options: { ...cur.options, ads: cur.options.ads.filter((a) => a.id !== id), hidden: cur.options.hidden.filter((x) => x !== id) },
    }));
  const setAd = (id: string, patch: Partial<HomeAd>) =>
    edit((cur) => ({ ...cur, options: { ...cur.options, ads: cur.options.ads.map((a) => (a.id === id ? { ...a, ...patch } : a)) } }));

  async function save(body: State | null) {
    setSaving(body === null ? 'reset' : 'save');
    setError(null);
    setDone(null);
    try {
      const toSend = body;
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
      adminCacheSet('home-sections-v6', st);
      setSaved(st);
      setDraft(st);
      setDone(body === null ? 'Posição, categorias e publicidade de origem repostas' : 'Guardado: a página inicial já mostra as alterações');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar.');
    } finally {
      setSaving(null);
    }
  }

  // O título de uma secção com uma só categoria acompanha a categoria escolhida (como no site); «Publicações recentes» mantém o nome de origem enquanto tem a categoria de origem.
  const rowLabel = (id: string) => {
    const slots = slotsFor(id);
    if (!draft || slots.length !== 1 || slots[0].multi || baseId(id).startsWith('destaque')) return sectionLabel(id);
    const slug = (draft.categories[slots[0].key] ?? slots[0].defaults)[0];
    if (slug === 'todas' || (id === 'recentes' && slug === slots[0].defaults[0])) return sectionLabel(id);
    const name = options.find((o) => o.slug === slug)?.label ?? slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
    return isCopyId(id) ? `${name} (cópia)` : name;
  };

  // Secções com uma só categoria, nas zonas largas: o selector fica na mesma linha do título e das setas (a partir do computador).
  const inlineSlot = (zone: HomeZone, id: string) =>
    ['top', 'main', 'main2', 'bottom'].includes(zone) && slotsFor(id).length === 1 && !slotsFor(id)[0].multi;

  // Linhas compactas: as categorias e as opções de cada secção ficam escondidas e abrem a deslizar com a seta da linha.
  const toggleRow = (id: string) => setOpenRows((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  const hasDetail = (id: string) => isAdId(id) || baseId(id) === 'destaque' || slotsFor(id).length > 0 || ['ultimas', 'oportunidades'].includes(baseId(id));
  // Só tem detalhe no computador quando a categoria não está já na própria linha.
  const detailOnlyMobile = (zone: HomeZone, id: string) => inlineSlot(zone, id) && !isAdId(id) && baseId(id) !== 'destaque' && !['ultimas', 'oportunidades'].includes(baseId(id));

  // Chamada como função (e não como componente) para os campos não perderem o foco a cada letra escrita.
  function zoneBox(zone: HomeZone) {
    if (!draft) return null;
    const z = zoneOf(zone);
    const list = draft.layout[zone].filter((x) => x !== 'destaque-lista');
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
              <li key={id} className="px-4 py-2">
                <div className="flex flex-wrap items-center gap-1.5 md:flex-nowrap">
                  <input type="checkbox" aria-label="Marcar para mover com outras" checked={picked.includes(id)} onChange={() => togglePick(id)} className="h-[18px] w-[18px] shrink-0 accent-[#00a651]" />
                  <span className="w-5 shrink-0 text-[13px] text-gray-400">{i + 1}</span>
                  <span className={`flex min-w-0 flex-1 basis-[140px] items-center md:basis-0 gap-1.5 text-[13px] text-[#1d2327]${draft.options.hidden.includes(id) ? ' opacity-50' : ''}`}>
                    {isAdId(id) && <Megaphone className="h-4 w-4 shrink-0 text-[#d6101c]" />}
                    <span className="truncate">{isAdId(id) ? 'Espaço de publicidade' : rowLabel(id)}</span>
                  </span>
                  {inlineSlot(zone, id) && (
                    <div className="w-[170px] shrink-0 max-lg:hidden">
                      <CategoryControl section={id} categories={draft.categories} options={options} onChange={setCategory} bare />
                    </div>
                  )}
                  {/* Botões: no computador ao lado do título; no telemóvel numa só linha por baixo do título */}
                  <div className="flex items-center gap-1.5 max-md:basis-full md:shrink-0">
                  {hasDetail(id) && (
                    <button
                      type="button"
                      aria-label={openRows.includes(id) ? 'Esconder as categorias e opções' : 'Ver as categorias e opções'}
                      title={openRows.includes(id) ? 'Esconder as categorias e opções' : 'Ver as categorias e opções'}
                      aria-expanded={openRows.includes(id)}
                      onClick={() => toggleRow(id)}
                      className={`${arrow}${openRows.includes(id) ? ' border-[#00a651] text-[#00a651]' : ''}${detailOnlyMobile(zone, id) ? ' lg:hidden' : ''}`}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform duration-500 ${openRows.includes(id) ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={draft.options.hidden.includes(id) ? 'Ligar na página inicial' : 'Desligar da página inicial'}
                    title={draft.options.hidden.includes(id) ? 'Desligada: não aparece no site' : 'Ligada: aparece no site'}
                    aria-pressed={draft.options.hidden.includes(id)}
                    onClick={() => toggleHidden(id)}
                    className={`${arrow}${draft.options.hidden.includes(id) ? ' text-[#d63638]' : ''}`}
                  >
                    {draft.options.hidden.includes(id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {!isAdId(id) && (
                    <button type="button" aria-label="Mover para outra zona" title="Mover para outra zona" aria-pressed={moving === id} onClick={() => setMoving(moving === id ? null : id)} className={`${arrow}${moving === id ? ' border-[#00a651] text-[#00a651]' : ''}`}>
                      <ArrowRightLeft className="h-4 w-4" />
                    </button>
                  )}
                  {DUPLICABLE.includes(baseId(id)) && (
                    <button type="button" aria-label="Duplicar a secção" title="Duplicar a secção" onClick={() => duplicate(zone, id)} className={arrow}>
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  {isCopyId(id) && (
                    <button type="button" aria-label="Apagar a cópia" title="Apagar a cópia" onClick={() => removeCopy(id)} className={`${arrow} hover:text-[#d63638]`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {list.length > 1 && (
                    <>
                      <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => shift(zone, id, -1)} className={arrow}>
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="Descer" disabled={i === list.length - 1} onClick={() => shift(zone, id, 1)} className={arrow}>
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
                </div>
                {/* Opções da marcação: deslizam para baixo por baixo do título da secção marcada (a última que se marcou) e empurram o que vem a seguir */}
                <Slide open={picked.length > 0 && picked[picked.length - 1] === id}>
                  <div className="mt-3 flex flex-wrap items-center gap-3 border border-[#00a651] bg-[#f0f7f4] px-3 py-3">
                    <span className="text-[13px] text-[#1d2327]">{picked.length} {picked.length === 1 ? 'secção marcada' : 'secções marcadas'}</span>
                    <AdminSelect aria-label="Mover as marcadas para a zona" value="" onChange={(e) => e.target.value && moveMany(e.target.value as HomeZone)} className={`${field} sm:w-[240px]`}>
                      <option value="">Mover {picked.length === 1 ? 'para' : 'juntas para'}…</option>
                      {HOME_ZONES.map((x) => (
                        <option key={x.id} value={x.id}>{x.label}</option>
                      ))}
                    </AdminSelect>
                    <button type="button" onClick={() => setPicked([])} className={`${btn} border border-[#ccd0d4] bg-white text-[#2c3338] hover:bg-gray-50`}>
                      Limpar marcação
                    </button>
                  </div>
                </Slide>
                {!isAdId(id) && (
                  <Slide open={moving === id}>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="w-[100px] shrink-0 text-[13px] text-gray-500">Mover para</span>
                      <AdminSelect aria-label="Mover para a zona" value="" onChange={(e) => e.target.value && moveTo(id, e.target.value as HomeZone)} className={fieldSide}>
                        <option value="">Escolher a zona…</option>
                        {HOME_ZONES.filter((x) => x.id !== zone).map((x) => (
                          <option key={x.id} value={x.id}>{x.label}</option>
                        ))}
                      </AdminSelect>
                    </div>
                  </Slide>
                )}
                <Slide open={openRows.includes(id)}>
                {isAdId(id) ? (
                  <AdFields zone={zone} ad={draft.options.ads.find((a) => a.id === id) ?? { id, image: '', link: '' }} onChange={(patch) => setAd(id, patch)} />
                ) : (
                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    {baseId(id) === 'destaque' && (
                      <div className="w-full space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="w-[100px] shrink-0 text-[13px] text-gray-500">Estilo</span>
                          <AdminSelect aria-label="Estilo do slide" value={heroMode(draft.options)} onChange={(e) => setHeroMode(e.target.value)} className={fieldHalf}>
                            <option value="cards">Slide e dois cards ao lado</option>
                            <option value="lista">Slide e lista ao lado (com slide para cima)</option>
                            <option value="carrossel">Carrossel na largura da página</option>
                            <option value="carrossel-conteudo">Carrossel na largura do conteúdo</option>
                          </AdminSelect>
                        </div>
                        {!draft.options.heroStyle.startsWith('carrossel') && (
                          <div className="flex items-center gap-3">
                            <span className="w-[100px] shrink-0 text-[13px] text-gray-500">Disposição</span>
                            <AdminSelect aria-label="Disposição do slide" value={draft.options.heroSide} onChange={(e) => setHeroSide(e.target.value as HeroSide)} className={fieldHalf}>
                              <option value="banner-esquerda">Slide à esquerda</option>
                              <option value="cards-esquerda">Slide à direita</option>
                            </AdminSelect>
                          </div>
                        )}
                        {heroMode(draft.options) === 'lista' && id === 'destaque' && (
                          <div className="w-full space-y-2">
                            <CategoryControl section="destaque-lista" categories={draft.categories} options={options} onChange={setCategory} />
                          </div>
                        )}
                        <p className="text-[12px] text-gray-500">O estilo e a disposição valem para todos os slides. A disposição só se nota quando o slide está logo antes de uns cards ou de uma lista.</p>
                      </div>
                    )}
                    <div className={`${baseId(id).startsWith('destaque-') ? 'w-full space-y-2' : 'flex flex-wrap items-end gap-3'}${inlineSlot(zone, id) ? ' lg:hidden' : ''}`}>
                      <CategoryControl section={id} categories={draft.categories} options={options} onChange={setCategory} />
                    </div>
                    <SectionOptions id={id} settings={draft.options.sections[id] ?? {}} onChange={(patch) => setSetting(id, patch)} />
                  </div>
                )}
                </Slide>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-[#e5e5e5] px-4 py-3">
          <button type="button" onClick={() => addAd(zone)} className={`${btn} justify-center border border-dashed border-[#00a651] bg-white text-[#00a651] hover:bg-[#f0f7f4]`}>
            <Plus className="h-4 w-4" /> Adicionar publicidade
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="ec-page ec-slide-popups text-[#2c3338]">
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
            {saving === 'save' ? <Spinner size={16} /> : <Save className="h-4 w-4" />} Guardar
          </button>
        </div>
      </div>


      {error && <p className="mb-4 border-l-4 border-[#d63638] bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</p>}
      {done && <p className="mb-4 border-l-4 border-[#00a651] bg-green-50 px-3 py-2 text-[13px] text-green-800">{done}</p>}

      {loading && !draft ? (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center"><Spinner size={40} /></div>
      ) : draft ? (
        <div className="space-y-3">
          {zoneBox('top')}
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
            {zoneBox('main')}
            {zoneBox('side')}
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
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
function AdFields({ zone, ad, onChange }: { zone: HomeZone; ad: HomeAd; onChange: (patch: Partial<HomeAd>) => void }) {
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
    </div>
  );
}

/** Opções de uma secção: linhas de cards e carrossel (Últimas notícias) ou número de notícias (Oportunidades). */
function SectionOptions({ id, settings, onChange }: { id: string; settings: SectionSettings; onChange: (patch: SectionSettings) => void }) {
  const base = baseId(id);
  if (base !== 'ultimas' && base !== 'oportunidades') return null;
  const row = 'flex items-center gap-2';
  const label = fieldLabel;
  if (base === 'oportunidades') {
    return (
      <div className={row}>
        <span className={label}>Notícias (1 a 60, 6 por página)</span>
        <input
          type="number"
          min={1}
          max={60}
          aria-label="Quantas notícias mostra (1 a 60)"
          value={settings.count ?? 60}
          onChange={(e) => {
            const n = Math.round(Number(e.target.value));
            if (n >= 1 && n <= 60) onChange({ count: n });
          }}
          className={`${field} sm:w-[110px]`}
        />
      </div>
    );
  }
  return (
    <>
      <div className={row}>
        <span className={label}>Linhas</span>
        <AdminSelect aria-label="Linhas de cards" value={String(settings.rows ?? 2)} onChange={(e) => onChange({ rows: Number(e.target.value) })} className={fieldWide}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={String(n)}>{n} {n === 1 ? 'linha' : 'linhas'} ({n * 3} notícias)</option>
          ))}
        </AdminSelect>
      </div>
      <div className={row}>
        <span className={label}>Carrossel</span>
        <AdminSelect aria-label="Carrossel" value={settings.carousel ? 'on' : 'off'} onChange={(e) => onChange({ carousel: e.target.value === 'on' })} className={fieldWide}>
          <option value="off">Desligado (cards em grelha)</option>
          <option value="on">Ligado (cards a deslizar)</option>
        </AdminSelect>
      </div>
    </>
  );
}

/** Selector(es) de categoria de uma secção. Secções com várias categorias mostram-nas em etiquetas que se podem retirar, e o selector junta outra. */
function CategoryControl({ section, categories, options, onChange, bare = false }: { section: string; categories: HomeCategories; options: CategoryOption[]; onChange: (key: string, list: string[]) => void; bare?: boolean }) {
    // O destaque mostra os selectores do estilo escolhido: dois cards ou a lista.
  const activeSlots = HOME_CATEGORY_SLOTS.filter((s) => !s.key.startsWith('hero')); // as do destaque podem repetir categorias
  const slots = slotsFor(section);
  const stack = baseId(section).startsWith('destaque-'); // cards e lista: uma linha por selector, na largura toda
  if (slots.length === 0) return null;
  const labelOf = (slug: string) => slug === 'todas' ? 'Todas as categorias' : options.find((o) => o.slug === slug)?.label ?? slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  return (
    <>
      {slots.map((slot) => {
        const list = categories[slot.key] ?? slot.defaults;
        // Uma categoria só pode estar num selector: as que já estão noutro não se oferecem (a que este já tem fica).
        // As «Últimas notícias» e as cópias escolhem à vontade: podem repetir categorias de outras secções.
        const free_ = slot.key === 'ultimas' || slot.key.includes('~') || slot.key.startsWith('hero');
        const usedElsewhere = free_ ? new Set<string>() : new Set(activeSlots.filter((x) => x.key !== slot.key && x.key !== 'ultimas').flatMap((x) => categories[x.key] ?? []));
        const free = [...(slot.key === 'ultimas' ? [{ slug: 'todas', label: 'Todas as categorias' }] : []), ...options.filter((o) => o.slug === list[0] || !usedElsewhere.has(o.slug))];
        const all = free.some((o) => o.slug === list[0]) || options.length === 0 ? free : [{ slug: list[0], label: labelOf(list[0]) }, ...free];
        return (
          <div key={slot.key} className={stack ? 'flex w-full items-center gap-3' : slot.multi ? 'flex w-full flex-col gap-1' : 'flex items-center gap-2'}>
            {!bare && <span className={stack ? 'w-[100px] shrink-0 text-[13px] text-gray-500' : slot.multi ? 'text-[12px] text-gray-500' : fieldLabel}>{slot.label}</span>}
            {slot.multi ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {list.map((slug) => (
                  <span key={slug} className="flex h-7 items-center gap-1 border border-[#ccd0d4] bg-[#f6f7f7] pl-2.5 pr-0.5 text-[12px] text-[#1d2327]">
                    {labelOf(slug)}
                    <button type="button" aria-label={`Retirar ${labelOf(slug)}`} disabled={list.length === 1} onClick={() => onChange(slot.key, list.filter((x) => x !== slug))} className="flex h-6 w-6 items-center justify-center text-gray-500 hover:text-[#d63638] disabled:cursor-not-allowed disabled:opacity-40">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <AdminSelect aria-label="Juntar categoria" value="" onChange={(e) => e.target.value && onChange(slot.key, [...list, e.target.value])} className="h-7 w-full border border-[#ccd0d4] bg-white px-2 text-[12px] text-[#1d2327] focus:border-[#00a651] focus:outline-none sm:w-[150px]">
                  <option value="">Juntar categoria…</option>
                  {options.filter((o) => !list.includes(o.slug) && !usedElsewhere.has(o.slug)).map((o) => (
                    <option key={o.slug} value={o.slug}>{o.label}</option>
                  ))}
                </AdminSelect>
              </div>
            ) : (
              <AdminSelect aria-label={slot.label} value={list[0]} onChange={(e) => onChange(slot.key, [e.target.value])} className={bare ? fieldRow : stack ? fieldHalf : fieldWide}>
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
