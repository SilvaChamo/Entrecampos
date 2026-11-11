'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
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
  bandZone,
  blockOfZone,
  isBandId,
  isBandZone,
  pageOrder,
  DUPLICABLE,
  TRASH_ZONE,
  baseId,
  heroSideOf,
  heroStyleOf,
  isCopyId,
  SECTION_LAYOUTS,
  defaultLayoutOf,
  layoutsOf,
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
  type HomeBand,
  type HomeLayout,
  type HomeOptions,
  type HomeZone,
  type SectionLayout,
  type SectionSettings,
} from '@/lib/home-sections';

const LABEL = Object.fromEntries(HOME_SECTIONS.map((s) => [s.id, s.label])) as Record<string, string>;
const newCode = () => (Math.random().toString(36) + '0000000').slice(2, 8);
/** Nome e descrição de uma zona: as de origem, ou as de uma secção nova (numeradas pela ordem em que aparecem na página). */
const zoneOf = (id: HomeZone, bands: HomeBand[]) => {
  const base = HOME_ZONES.find((z) => z.id === id);
  if (base) return base;
  const n = pageOrder(bands).filter(isBandId).indexOf(id.split(':')[0]) + 1;
  return id.endsWith(':side')
    ? { id, label: `Secção nova ${n} · barra lateral`, hint: 'coluna estreita, à direita: se ficar vazia, a coluna principal usa a largura toda' }
    : { id, label: `Secção nova ${n} · coluna principal`, hint: 'coluna larga, à esquerda' };
};
/** Todas as zonas do rascunho, pela ordem da página (as de origem e as das secções novas). */
const zonesIn = (st: State) => [...HOME_ZONES.map((z) => z.id as HomeZone), ...pageOrder(st.options.bands).filter(isBandId).flatMap((b) => [bandZone(b, 'main'), bandZone(b, 'side')])];
const mapLayout = (l: HomeLayout, fn: (list: string[]) => string[]): HomeLayout => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, fn(v)]));
type State = { layout: HomeLayout; categories: HomeCategories; options: HomeOptions };
type CategoryOption = { slug: string; label: string };

const sameLayout = (a: HomeLayout, b: HomeLayout) => [...new Set([...Object.keys(a), ...Object.keys(b)])].every((z) => (a[z] ?? []).join() === (b[z] ?? []).join());
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
  // Cópias apagadas há pouco (a mais recente por último): «Repor» volta a pô-las onde estavam, com as categorias e opções que tinham.
  const [removed, setRemoved] = useState<{ items: { id: string; zone: HomeZone; index: number; categories: Record<string, string[]>; settings?: SectionSettings; hidden: boolean; ad?: HomeAd }[] }[]>([]);

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
  /** Os cards ou a lista que ficam ao lado de um slide (os que vêm logo a seguir, ligados, numa zona larga): cada um com a sua categoria. */
  const attachedTo = (id: string): string[] => {
    if (!draft || !['cards', 'lista'].includes(heroModeOf(id))) return [];
    const zone = Object.keys(draft.layout).find((z) => draft.layout[z].includes(id));
    if (!zone || !(['top', 'main', 'main2', 'bottom'].includes(zone) || zone.endsWith(':main'))) return [];
    const list = draft.layout[zone].filter((x) => !draft.options.hidden.includes(x));
    const at = list.indexOf(id);
    const next = list[at + 1];
    if (!next) return [];
    if (baseId(next).startsWith('destaque-card')) return [next, ...(list[at + 2] && baseId(list[at + 2]).startsWith('destaque-card') ? [list[at + 2]] : [])];
    return baseId(next) === 'destaque-lista' ? [next] : [];
  };
  /** Estilo de um slide: o do original vem das opções gerais; o de cada cópia é só dela. */
  const heroModeOf = (id: string) => (id === 'destaque' ? heroMode(draft!.options) : heroStyleOf(draft!.options, id));
  const setHeroModeOf = (id: string, mode: string) => (id === 'destaque' ? setHeroMode(mode) : setSetting(id, { heroStyle: mode as HeroStyle }));
  const setHeroSideOf = (id: string, side: HeroSide) => (id === 'destaque' ? setHeroSide(side) : setSetting(id, { heroSide: side }));
  /** Antes de mudar o estilo ou a disposição do original, as cópias antigas (sem escolha própria) ficam com o que tinham: deixam de o seguir. */
  const pinCopies = (cur: State, pin: SectionSettings) => {
    const sections = { ...cur.options.sections };
    for (const id of Object.values(cur.layout).flat()) {
      if (baseId(id) !== 'destaque' || id === 'destaque') continue;
      const mine = sections[id] ?? {};
      sections[id] = { ...pin, ...mine };
    }
    return sections;
  };
  const setHeroMode = (mode: string) =>
    edit((cur) => {
      const without = (ids: string[]) => cur.options.hidden.filter((x) => !ids.includes(x));
      const hidden = mode === 'cards' ? [...without(['destaque-card1', 'destaque-card2']), 'destaque-lista'] : mode === 'lista' ? [...without(['destaque-lista']), 'destaque-card1', 'destaque-card2'] : cur.options.hidden;
      return { ...cur, options: { ...cur.options, sections: pinCopies(cur, { heroStyle: heroMode(cur.options) as HeroStyle }), heroStyle: mode === 'lista' ? 'cards' : (mode as HeroStyle), hidden: [...new Set(hidden)] } };
    });
  /** Passa uma secção para outra zona (para o fim dela); depois as setas ajustam o lugar. */
  const moveTo = (id: string, to: HomeZone) => {
    setMoving(null);
    edit((cur) => {
      const layout = mapLayout(cur.layout, (l) => l.filter((x) => x !== id));
      layout[to] = [...layout[to], id];
      return { ...cur, layout };
    });
  };

  /** Copia uma secção: a cópia fica logo a seguir, com a mesma categoria e as mesmas opções (depois muda-se à vontade). */
  const duplicate = (zone: HomeZone, id: string) =>
    edit((cur) => {
      const copy = `${baseId(id)}~${newCode()}`;
      const list = [...cur.layout[zone]];
      // A cópia de um slide, card ou lista fica depois das peças que acompanham o original (para não lhe roubar os cards nem a lista).
      let at = list.indexOf(id) + 1;
      if (baseId(id).startsWith('destaque')) while (at < list.length && baseId(list[at]).startsWith('destaque-')) at++;
      list.splice(at, 0, copy);
      // Copia as categorias de todos os lugares da secção (os cards têm dois).
      const categories = { ...cur.categories };
      for (const slot of HOME_CATEGORY_SLOTS.filter((x) => x.section === baseId(id))) categories[slotKey(copy, slot.key)] = [...(cur.categories[slotKey(id, slot.key)] ?? slot.defaults)];
      return {
        ...cur,
        layout: { ...cur.layout, [zone]: list },
        categories,
        // A cópia de um slide começa só como slide (sem cards nem lista ao lado), com a disposição do original; depois é toda dela.
        options: {
          ...cur.options,
          sections:
            baseId(id) === 'destaque'
              ? { ...cur.options.sections, [copy]: { ...cur.options.sections[id], heroStyle: 'slide', heroSide: heroSideOf(cur.options, id) } }
              : cur.options.sections[id]
                ? { ...cur.options.sections, [copy]: { ...cur.options.sections[id] } }
                : cur.options.sections,
        },
      };
    });

  /** Repõe a última remoção: cada cópia volta ao seu lugar (pela ordem em que estavam) com as categorias e opções que tinha. */
  const restoreRemoved = () => {
    const batch = removed[removed.length - 1];
    if (!batch) return;
    setRemoved((r) => r.slice(0, -1));
    edit((cur) => {
      const layout = { ...cur.layout };
      layout[TRASH_ZONE] = (layout[TRASH_ZONE] ?? []).filter((x) => !batch.items.some((it) => it.id === x));
      for (const it of [...batch.items].sort((a, b) => a.index - b.index)) {
        if (Object.values(layout).some((l) => l.includes(it.id))) continue;
        if (!layout[it.zone]) continue;
        const list = [...layout[it.zone]];
        list.splice(Math.min(it.index, list.length), 0, it.id);
        layout[it.zone] = list;
      }
      const categories = { ...cur.categories };
      const sections = { ...cur.options.sections };
      let hidden = cur.options.hidden;
      const ads = [...cur.options.ads];
      for (const it of batch.items) {
        if (it.ad && !ads.some((x) => x.id === it.id)) ads.push(it.ad);
        Object.assign(categories, it.categories);
        if (it.settings) sections[it.id] = it.settings;
        if (it.hidden && !hidden.includes(it.id)) hidden = [...hidden, it.id];
      }
      return { layout, categories, options: { ...cur.options, sections, hidden, ads } };
    });
  };

  /** Liga ou desliga (olho) todas as marcadas: se alguma está ligada desliga-as todas, senão liga-as todas. */
  const toggleHiddenMany = () =>
    edit((cur) => {
      const anyShown = picked.some((id) => !cur.options.hidden.includes(id));
      const hidden = anyShown ? [...new Set([...cur.options.hidden, ...picked])] : cur.options.hidden.filter((x) => !picked.includes(x));
      return { ...cur, options: { ...cur.options, hidden } };
    });

  /**
   * Apaga as secções marcadas, só da página inicial (o código fica): as cópias desaparecem; as de origem ficam guardadas
   * e voltam a pôr-se em qualquer zona pelo «Acrescentar à zona…». O «Repor» desfaz logo a seguir.
   */
  const removeMarked = () => {
    const ids = picked.filter((id) => !isAdId(id));
    const ads = picked.filter(isAdId);
    const gone = [...ids, ...ads];
    if (gone.length === 0) return;
    if (!confirm(gone.length === 1 ? 'Apagar a secção marcada da página inicial? O modelo não se perde: pode voltar a pô-lo em «Acrescentar à zona…».' : `Apagar as ${gone.length} secções marcadas da página inicial? Os modelos não se perdem: pode voltar a pô-los em «Acrescentar à zona…».`)) return;
    setPicked((p) => p.filter((x) => !gone.includes(x)));
    // Guarda o que se apaga (posição, categorias e opções) para se poder repor.
    if (draft) {
      const items = gone.flatMap((id) => {
        const zone = Object.keys(draft.layout).find((z) => z !== TRASH_ZONE && draft.layout[z].includes(id));
        if (!zone) return [];
        const cats: Record<string, string[]> = {};
        for (const k of [...slotsFor(id).map((x) => x.key), id]) if (draft.categories[k]) cats[k] = draft.categories[k];
        return [{ id, zone, index: draft.layout[zone].indexOf(id), categories: cats, settings: draft.options.sections[id], hidden: draft.options.hidden.includes(id), ad: draft.options.ads.find((a) => a.id === id) }];
      });
      if (items.length > 0) setRemoved((r) => [...r, { items }]);
    }
    edit((cur) => {
      const categories = { ...cur.categories };
      const sections = { ...cur.options.sections };
      const copies = gone.filter((id) => isCopyId(id) || isAdId(id));
      for (const id of copies) {
        for (const slot of slotsFor(id)) delete categories[slot.key];
        delete categories[id];
        delete sections[id];
      }
      // As de origem vão para as «removidas» (não aparecem na página, mas não voltam a nascer sozinhas).
      const originals = gone.filter((id) => !copies.includes(id));
      const layout = mapLayout(cur.layout, (l) => l.filter((x) => !gone.includes(x)));
      layout[TRASH_ZONE] = [...(layout[TRASH_ZONE] ?? []), ...originals];
      return {
        layout,
        categories,
        options: { ...cur.options, sections, hidden: cur.options.hidden.filter((x) => !gone.includes(x)), ads: cur.options.ads.filter((a) => !gone.includes(a.id)) },
      };
    });
  };
  /** Volta a pôr numa zona uma secção de origem apagada antes (fica no fim da zona, ligada). */
  const putBack = (zone: HomeZone, id: string) =>
    edit((cur) => ({
      ...cur,
      layout: { ...mapLayout(cur.layout, (l) => l.filter((x) => x !== id)), [zone]: [...(cur.layout[zone] ?? []), id] },
      options: { ...cur.options, hidden: cur.options.hidden.filter((x) => x !== id) },
    }));

  /** Muda uma opção da secção (linhas, número de notícias, carrossel). */
  const setSetting = (id: string, patch: SectionSettings) =>
    edit((cur) => ({ ...cur, options: { ...cur.options, sections: { ...cur.options.sections, [id]: { ...cur.options.sections[id], ...patch } } } }));

  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /** O layout que as marcadas têm em comum (vazio se forem diferentes ou nenhuma o aceitar): é o que o selector mostra como escolhido. */
  const pickedLayout = (() => {
    const found = picked.filter((id) => layoutsOf(id).length > 0).map((id) => draft?.options.sections[id]?.layout ?? defaultLayoutOf(id));
    return found.length > 0 && found.every((l) => l === found[0]) ? found[0] : '';
  })();

  /** Os layouts que o selector oferece: só os que todas as marcadas (com escolha de layout) aceitam, para o escolhido aparecer sempre. */
  const pickedLayoutOptions = (() => {
    const sets = picked.map(layoutsOf).filter((l) => l.length > 0);
    return SECTION_LAYOUTS.filter((l) => sets.length === 0 || sets.every((set) => set.includes(l.id)));
  })();

  /** Muda o layout de todas as secções marcadas que o aceitam (as outras ficam como estão). */
  const setLayoutMany = (layout: SectionLayout) =>
    edit((cur) => {
      const sections = { ...cur.options.sections };
      for (const id of picked) if (layoutsOf(id).includes(layout)) sections[id] = { ...sections[id], layout };
      return { ...cur, options: { ...cur.options, sections } };
    });

  /** Passa as secções marcadas, todas juntas e pela mesma ordem em que estão, para o fim de outra zona. */
  const moveMany = (to: HomeZone) =>
    edit((cur) => {
      const order = Object.values(cur.layout).flat().filter((id) => picked.includes(id));
      const layout = mapLayout(cur.layout, (l) => l.filter((x) => !picked.includes(x)));
      layout[to] = [...layout[to], ...order];
      setPicked([]);
      return { ...cur, layout };
    });

  const setHeroSide = (heroSide: HeroSide) => edit((cur) => ({ ...cur, options: { ...cur.options, sections: pinCopies(cur, { heroSide: cur.options.heroSide }), heroSide } }));

  /** Acrescenta ao fim de uma zona uma secção nova do tipo escolhido: é uma peça só dela (categorias e opções à parte), como uma cópia. */
  const addSection = (zone: HomeZone, base: string) => {
    const id = `${base}~${newCode()}`;
    setOpenRows((r) => [...r, id]);
    edit((cur) => {
      const categories = { ...cur.categories };
      for (const slot of HOME_CATEGORY_SLOTS.filter((x) => x.section === base)) categories[slotKey(id, slot.key)] = [...slot.defaults];
      return {
        ...cur,
        layout: { ...cur.layout, [zone]: [...cur.layout[zone], id] },
        categories,
        // Um slide novo começa só como slide, sem cards nem lista ao lado.
        options: base === 'destaque' ? { ...cur.options, sections: { ...cur.options.sections, [id]: { heroStyle: 'slide', heroSide: cur.options.heroSide } } } : cur.options,
      };
    });
  };
  /** Cria uma secção nova (coluna principal + barra lateral) logo a seguir ao bloco onde se carregou. As que já vinham a seguir a esse bloco passam a seguir a esta. */
  const addBand = (zone: HomeZone) =>
    edit((cur) => {
      const id = `sec${newCode().slice(0, 4)}`;
      const after = blockOfZone(zone);
      const bands = [...cur.options.bands.map((b) => (b.after === after ? { ...b, after: id } : b)), { id, after }];
      return { ...cur, layout: { ...cur.layout, [bandZone(id, 'main')]: [], [bandZone(id, 'side')]: [] }, options: { ...cur.options, bands } };
    });
  /** Apaga uma secção nova (só quando as duas colunas estão vazias: as secções de origem nunca se perdem). */
  const removeBand = (band: string) =>
    edit((cur) => {
      const gone = cur.options.bands.find((b) => b.id === band);
      if (!gone) return cur;
      const layout = { ...cur.layout };
      delete layout[bandZone(band, 'main')];
      delete layout[bandZone(band, 'side')];
      const bands = cur.options.bands.filter((b) => b.id !== band).map((b) => (b.after === band ? { ...b, after: gone.after } : b));
      return { ...cur, layout, options: { ...cur.options, bands } };
    });
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
      layout: mapLayout(cur.layout, (l) => l.filter((x) => x !== id)),
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
      const payload = toSend === null ? { layout: null, categories: null, options: null } : { ...toSend, options: { ...toSend.options, ads: toSend.options.ads.filter((a) => Object.values(toSend.layout).some((l) => l.includes(a.id))) } };
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
    (['top', 'main', 'main2', 'bottom'].includes(zone) || zone.endsWith(':main')) && baseId(id) !== 'destaque' && slotsFor(id).length === 1 && !slotsFor(id)[0].multi;

  // Linhas compactas: as categorias e as opções de cada secção ficam escondidas e abrem a deslizar com a seta da linha.
  const toggleRow = (id: string) => setOpenRows((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  const hasDetail = (id: string) => isAdId(id) || baseId(id) === 'destaque' || slotsFor(id).length > 0 || layoutsOf(id).length > 0 || ['ultimas', 'oportunidades'].includes(baseId(id));
  // Só tem detalhe no computador quando a categoria não está já na própria linha.
  const detailOnlyMobile = (zone: HomeZone, id: string) => inlineSlot(zone, id) && !isAdId(id) && baseId(id) !== 'destaque' && !['ultimas', 'oportunidades'].includes(baseId(id));

  // Chamada como função (e não como componente) para os campos não perderem o foco a cada letra escrita.
  function zoneBox(zone: HomeZone) {
    if (!draft) return null;
    const z = zoneOf(zone, draft.options.bands);
    const list = (draft.layout[zone] ?? []).filter((x) => x !== 'destaque-lista');
    return (
      <section className="min-w-0 border border-[#ccd0d4] bg-white">
        <header className="flex items-start justify-between gap-3 border-b border-[#e5e5e5] px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[14px] text-[#1d2327]">{z.label}</h2>
            <p className="text-[12px] text-gray-500">{z.hint}</p>
          </div>
          {isBandZone(zone) && zone.endsWith(':main') && (
            <button
              type="button"
              aria-label="Apagar esta secção nova"
              title={(draft.layout[zone] ?? []).length + (draft.layout[bandZone(zone.split(':')[0], 'side')] ?? []).length > 0 ? 'Só se apaga com as duas colunas vazias: mova ou apague primeiro o que lá está' : 'Apagar esta secção nova (não afecta as secções de origem)'}
              disabled={(draft.layout[zone] ?? []).length + (draft.layout[bandZone(zone.split(':')[0], 'side')] ?? []).length > 0}
              onClick={() => confirm('Apagar esta secção nova?') && removeBand(zone.split(':')[0])}
              className={`${arrow} hover:text-[#d63638]`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
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
                    {draft.options.hidden.includes(id) && <EyeOff aria-label="Desligada: não aparece no site" className="h-3.5 w-3.5 shrink-0 text-[#d63638]" />}
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
                    <AdminSelect aria-label="Mover as marcadas para a zona" value="" onChange={(e) => e.target.value && moveMany(e.target.value as HomeZone)} className={`${field} sm:w-[240px]`}>
                      <option value="">Mover {picked.length === 1 ? 'para' : 'juntas para'}…</option>
                      {zonesIn(draft).map((zid) => (
                        <option key={zid} value={zid}>{zoneOf(zid, draft.options.bands).label}</option>
                      ))}
                    </AdminSelect>
                    <AdminSelect aria-label="Layout das marcadas" value={pickedLayout} onChange={(e) => e.target.value && setLayoutMany(e.target.value as SectionLayout)} className={`${field} sm:w-[280px]`}>
                      <option value="">Layout…</option>
                      {pickedLayoutOptions.map((l) => (
                        <option key={l.id} value={l.id}>{l.label}</option>
                      ))}
                    </AdminSelect>
                    {/* Ligar/desligar no site e apagar a cópia: valem para todas as marcadas */}
                    <button
                      type="button"
                      aria-label={picked.some((x) => !draft.options.hidden.includes(x)) ? 'Desligar as marcadas da página inicial' : 'Ligar as marcadas na página inicial'}
                      title={picked.some((x) => !draft.options.hidden.includes(x)) ? 'Ligada: aparece no site (clicar para desligar)' : 'Desligada: não aparece no site (clicar para ligar)'}
                      onClick={toggleHiddenMany}
                      className={`${arrow}${picked.every((x) => draft.options.hidden.includes(x)) ? ' text-[#d63638]' : ''}`}
                    >
                      {picked.every((x) => draft.options.hidden.includes(x)) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button type="button" aria-label="Apagar as secções marcadas" title="Apagar da página inicial (só retira o modelo da página: o código fica e pode voltar a pô-lo)" onClick={removeMarked} className={`${arrow} hover:text-[#d63638]`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Slide>
                {!isAdId(id) && (
                  <Slide open={moving === id}>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="w-[100px] shrink-0 text-[13px] text-gray-500">Mover para</span>
                      <AdminSelect aria-label="Mover para a zona" value="" onChange={(e) => e.target.value && moveTo(id, e.target.value as HomeZone)} className={fieldSide}>
                        <option value="">Escolher a zona…</option>
                        {zonesIn(draft).filter((zid) => zid !== zone).map((zid) => (
                          <option key={zid} value={zid}>{zoneOf(zid, draft.options.bands).label}</option>
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
                        {/* Cada peça tem a sua categoria: o slide e, se os houver ao lado, cada card (ou a lista) */}
                        <CategoryControl section={id} categories={draft.categories} options={options} onChange={setCategory} label={attachedTo(id).length > 0 ? 'Slide' : undefined} />
                        {attachedTo(id).map((aid) => (
                          <CategoryControl key={aid} section={aid} categories={draft.categories} options={options} onChange={setCategory} label={baseId(aid) === 'destaque-lista' ? 'Lista' : baseId(aid) === 'destaque-card1' ? 'Card de cima' : 'Card de baixo'} />
                        ))}
                        <div className="flex items-center gap-3">
                          <span className="w-[100px] shrink-0 text-[13px] text-gray-500">Estilo</span>
                          <AdminSelect aria-label="Estilo do slide" value={heroModeOf(id)} onChange={(e) => setHeroModeOf(id, e.target.value)} className={fieldHalf}>
                            <option value="slide">Só o slide (sem cards nem lista ao lado)</option>
                            <option value="cards">Slide e dois cards ao lado</option>
                            <option value="lista">Slide e lista ao lado (com slide para cima)</option>
                            <option value="carrossel">Carrossel na largura da página</option>
                            <option value="carrossel-conteudo">Carrossel na largura do conteúdo</option>
                          </AdminSelect>
                        </div>
                        {['cards', 'lista'].includes(heroModeOf(id)) && (
                          <div className="flex items-center gap-3">
                            <span className="w-[100px] shrink-0 text-[13px] text-gray-500">Disposição</span>
                            <AdminSelect aria-label="Disposição do slide" value={heroSideOf(draft.options, id)} onChange={(e) => setHeroSideOf(id, e.target.value as HeroSide)} className={fieldHalf}>
                              <option value="banner-esquerda">Slide à esquerda</option>
                              <option value="cards-esquerda">Slide à direita</option>
                            </AdminSelect>
                          </div>
                        )}
                        <p className="text-[12px] text-gray-500">Cada slide, e cada cópia, tem o seu estilo, a sua disposição e a sua categoria. Com cards ou lista, o slide junta-se aos que vêm logo a seguir; «Só o slide» fica sozinho onde o puser.</p>
                      </div>
                    )}
                    {baseId(id) !== 'destaque' && (
                      <div className={`${baseId(id).startsWith('destaque-') ? 'w-full space-y-2' : 'flex flex-wrap items-end gap-3'}${inlineSlot(zone, id) ? ' lg:hidden' : ''}`}>
                        <CategoryControl section={id} categories={draft.categories} options={options} onChange={setCategory} />
                      </div>
                    )}
                    <SectionOptions id={id} settings={draft.options.sections[id] ?? {}} onChange={(patch) => setSetting(id, patch)} />
                  </div>
                )}
                </Slide>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#e5e5e5] px-4 py-3">
          <button type="button" onClick={() => addAd(zone)} className={`${btn} justify-center border border-dashed border-[#00a651] bg-white text-[#00a651] hover:bg-[#f0f7f4]`}>
            <Plus className="h-4 w-4" /> Adicionar publicidade
          </button>
          <button type="button" title="Cria, logo a seguir a este bloco, uma secção nova com coluna principal e barra lateral" onClick={() => addBand(zone)} className={`${btn} justify-center border border-dashed border-[#00a651] bg-white text-[#00a651] hover:bg-[#f0f7f4]`}>
            <Plus className="h-4 w-4" /> Adicionar secção
          </button>
          <AdminSelect aria-label="Acrescentar um tipo de secção a esta zona" value="" onChange={(e) => e.target.value && (e.target.value.startsWith('repor:') ? putBack(zone, e.target.value.slice(6)) : addSection(zone, e.target.value))} className={`${field} sm:w-[260px]`}>
            <option value="">Acrescentar à zona…</option>
            {DUPLICABLE.map((b) => (
              <option key={b} value={b}>{HOME_SECTIONS.find((x) => x.id === b)?.label ?? b}</option>
            ))}
            {(draft.layout[TRASH_ZONE] ?? []).map((rid) => (
              <option key={rid} value={`repor:${rid}`}>Repor: {sectionLabel(rid)}</option>
            ))}
          </AdminSelect>
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
      {/* Aviso fixo no ecrã (por baixo da vista, onde se clicou em apagar): permite voltar atrás */}
      {removed.length > 0 && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 border border-[#1d2327] bg-[#1d2327] px-4 py-2.5 text-[13px] text-white shadow-lg">
          <span>
            {removed[removed.length - 1].items.length === 1 ? 'Secção apagada da página inicial.' : `${removed[removed.length - 1].items.length} secções apagadas da página inicial.`}
            {removed.length > 1 ? ` (${removed.length} remoções por repor)` : ''}
          </span>
          <button type="button" onClick={restoreRemoved} className="flex h-8 items-center gap-1.5 border border-white/60 px-3 font-semibold hover:bg-white hover:text-[#1d2327]">
            <RotateCcw className="h-4 w-4" /> Repor
          </button>
          <button type="button" aria-label="Fechar o aviso" onClick={() => setRemoved([])} className="flex h-8 w-8 items-center justify-center text-white/70 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading && !draft ? (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center"><Spinner size={40} /></div>
      ) : draft ? (
        <div className="space-y-3">
          {/* Os blocos pela ordem da página: os de origem e, onde se criaram, as secções novas (coluna principal + barra lateral) */}
          {pageOrder(draft.options.bands).map((key) => {
            const pair = (main: HomeZone, side: HomeZone) => (
              <div key={key} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
                {zoneBox(main)}
                {zoneBox(side)}
              </div>
            );
            return key === 'top' ? <Fragment key={key}>{zoneBox('top')}</Fragment>
              : key === 'cols1' ? pair('main', 'side')
              : key === 'cols2' ? pair('main2', 'side2')
              : key === 'bottom' ? <Fragment key={key}>{zoneBox('bottom')}</Fragment>
              : pair(bandZone(key, 'main'), bandZone(key, 'side'));
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Imagem e ligação de um espaço de publicidade. A imagem tem de ter a medida exacta do espaço (a da página dos espaços de publicidade do site). */
function AdFields({ zone, ad, onChange }: { zone: HomeZone; ad: HomeAd; onChange: (patch: Partial<HomeAd>) => void }) {
  const size = HOME_AD_SIZES[(zone in HOME_AD_SIZES ? zone : zone.endsWith(':side') ? 'side' : 'main') as keyof typeof HOME_AD_SIZES];
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

/** Opções de uma secção: o layout e, conforme o layout, as linhas e o carrossel da grelha ou a vista da lista; as Oportunidades têm ainda o número de notícias. */
function SectionOptions({ id, settings, onChange }: { id: string; settings: SectionSettings; onChange: (patch: SectionSettings) => void }) {
  const base = baseId(id);
  const layouts = layoutsOf(id);
  if (layouts.length === 0) return null;
  const layout = settings.layout ?? defaultLayoutOf(id);
  // Uma opção por linha, na vertical: etiqueta com largura fixa à esquerda e o selector ao lado (metade da largura), como no painel do slide.
  const row = 'flex w-full items-center gap-3';
  const label = 'w-[100px] shrink-0 text-[13px] text-gray-500';
  const hint = 'text-[12px] text-gray-500';
  const listMode = settings.listCarousel ? 'carrossel' : settings.listScroll ? 'rolagem' : 'todas';
  return (
    <div className="w-full space-y-2">
      <div className={row}>
        <span className={label}>Layout</span>
        <AdminSelect aria-label="Layout da secção" value={layout} onChange={(e) => onChange({ layout: e.target.value as SectionLayout })} className={fieldHalf}>
          {SECTION_LAYOUTS.filter((l) => layouts.includes(l.id)).map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </AdminSelect>
      </div>
      {layout === 'grelha' && (
        <>
          <div className={row}>
            <span className={label}>Linhas</span>
            <AdminSelect aria-label="Linhas de cards" value={String(settings.rows ?? 2)} onChange={(e) => onChange({ rows: Number(e.target.value) })} className={fieldHalf}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={String(n)}>{n} {n === 1 ? 'linha de 3 cards' : 'linhas'} ({n * 3} notícias)</option>
              ))}
            </AdminSelect>
          </div>
          <div className={row}>
            <span className={label}>Carrossel</span>
            <AdminSelect aria-label="Carrossel" value={settings.carousel ? 'on' : 'off'} onChange={(e) => onChange({ carousel: e.target.value === 'on' })} className={fieldHalf}>
              <option value="off">Desligado (cards em grelha)</option>
              <option value="on">Ligado (cards a deslizar)</option>
            </AdminSelect>
          </div>
          {settings.carousel && (
            <p className={hint}>
              {(settings.rows ?? 2) === 1
                ? 'Com 1 linha: entram todas as notícias da categoria, numa só linha de 3 colunas, a passar um card de cada vez, sem fim.'
                : `Com ${settings.rows ?? 2} linhas: passam as ${(settings.rows ?? 2) * 3} notícias da grelha. Para passarem todas as notícias da categoria, escolha 1 linha.`}
            </p>
          )}
        </>
      )}
      {layout === 'lista' && (
        <>
          <div className={row}>
            <span className={label}>Vista da lista</span>
            <AdminSelect
              aria-label="Vista da lista"
              value={listMode}
              onChange={(e) => onChange({ listScroll: e.target.value === 'rolagem', listCarousel: e.target.value === 'carrossel' })}
              className={fieldHalf}
            >
              <option value="todas">Todas as notícias visíveis</option>
              <option value="rolagem">Algumas à vista, resto com rolagem</option>
              <option value="carrossel">Carrossel vertical (todas as notícias, sem fim)</option>
            </AdminSelect>
          </div>
          {listMode !== 'todas' && (
            <div className={row}>
              <span className={label}>Notícias à vista</span>
              <AdminSelect aria-label="Quantas notícias ficam à vista" value={String(settings.visible ?? 3)} onChange={(e) => onChange({ visible: Number(e.target.value) })} className={fieldHalf}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={String(n)}>{n} {n === 1 ? 'notícia' : 'notícias'}</option>
                ))}
              </AdminSelect>
            </div>
          )}
          {listMode === 'carrossel' && <p className={hint}>Mostra {settings.visible ?? 3} de cada vez e passa uma de cada vez para cima; leva todas as notícias da categoria e volta ao princípio no fim.</p>}
          {base === 'oportunidades' && listMode === 'todas' && (
            <div className={row}>
              <span className={label}>Notícias</span>
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
              <span className={hint}>de 1 a 60, 6 por página</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Selector(es) de categoria de uma secção. Secções com várias categorias mostram-nas em etiquetas que se podem retirar, e o selector junta outra. */
function CategoryControl({ section, categories, options, onChange, bare = false, label }: { section: string; categories: HomeCategories; options: CategoryOption[]; onChange: (key: string, list: string[]) => void; bare?: boolean; label?: string }) {
    // O destaque mostra os selectores do estilo escolhido: dois cards ou a lista.
  const activeSlots = HOME_CATEGORY_SLOTS.filter((s) => !s.key.startsWith('hero') && s.key !== 'slide'); // as do destaque podem repetir categorias
  const slots = slotsFor(section);
  const stack = baseId(section).startsWith('destaque'); // cards e lista: uma linha por selector, na largura toda
  if (slots.length === 0) return null;
  const labelOf = (slug: string, slotKey_ = '') => slug === 'todas' ? (slotKey_.startsWith('slide') ? 'Em destaque (as escolhidas no site)' : 'Todas as categorias') : options.find((o) => o.slug === slug)?.label ?? slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  return (
    <>
      {slots.map((slot) => {
        const list = categories[slot.key] ?? slot.defaults;
        // Uma categoria só pode estar num selector: as que já estão noutro não se oferecem (a que este já tem fica).
        // As «Últimas notícias» e as cópias escolhem à vontade: podem repetir categorias de outras secções.
        const free_ = slot.key === 'ultimas' || slot.key === 'slide' || slot.key.includes('~') || slot.key.startsWith('hero');
        const usedElsewhere = free_ ? new Set<string>() : new Set(activeSlots.filter((x) => x.key !== slot.key && x.key !== 'ultimas').flatMap((x) => categories[x.key] ?? []));
        const free = [...(slot.key === 'ultimas' ? [{ slug: 'todas', label: 'Todas as categorias' }] : slot.key.startsWith('slide') ? [{ slug: 'todas', label: labelOf('todas', 'slide') }] : []), ...options.filter((o) => o.slug === list[0] || !usedElsewhere.has(o.slug))];
        const all = free.some((o) => o.slug === list[0]) || options.length === 0 ? free : [{ slug: list[0], label: labelOf(list[0], slot.key) }, ...free];
        return (
          <div key={slot.key} className={stack ? 'flex w-full items-center gap-3' : slot.multi ? 'flex w-full flex-col gap-1' : 'flex items-center gap-2'}>
            {!bare && <span className={stack ? 'w-[100px] shrink-0 text-[13px] text-gray-500' : slot.multi ? 'text-[12px] text-gray-500' : fieldLabel}>{label ?? slot.label}</span>}
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
