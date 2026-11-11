/**
 * Secções da página inicial e as zonas onde podem estar (código partilhado pelo painel e pela home: sem nada de servidor).
 */
/** Zonas de origem da página. As secções novas (faixas) trazem as suas: «código:main» e «código:side». */
export type BaseZone = 'top' | 'main' | 'side' | 'main2' | 'side2' | 'bottom';
export type HomeZone = string;
export const HOME_ZONES: { id: BaseZone; label: string; hint: string }[] = [
  { id: 'top', label: 'Topo', hint: 'largura total, por cima das colunas' },
  { id: 'main', label: 'Coluna principal', hint: 'coluna larga, à esquerda' },
  { id: 'side', label: 'Barra lateral', hint: 'coluna estreita, à direita' },
  { id: 'main2', label: 'Coluna principal (2.ª secção)', hint: 'coluna larga, na secção de baixo' },
  { id: 'side2', label: 'Barra lateral (2.ª secção)', hint: 'coluna estreita, na secção de baixo' },
  { id: 'bottom', label: 'Fim', hint: 'largura total, por baixo das colunas' },
];

/** Todas as secções da home. `zone` é a zona de origem (a ordem em que estão aqui é a ordem de origem). */
export const HOME_SECTIONS: { id: string; label: string; zone: BaseZone }[] = [
  { id: 'destaque', label: 'Slide principal', zone: 'top' },
  { id: 'destaque-card1', label: 'Card de cima ao lado do slide', zone: 'top' },
  { id: 'destaque-card2', label: 'Card de baixo ao lado do slide', zone: 'top' },
  { id: 'destaque-lista', label: 'Lista ao lado do slide', zone: 'top' },
  { id: 'comunidade', label: 'Comunidade e família (com selector)', zone: 'main' },
  { id: 'ultimas', label: 'Últimas notícias', zone: 'main' },
  { id: 'agro', label: 'Agricultura e família (grelha)', zone: 'main' },
  { id: 'ver-agora', label: 'Ver agora', zone: 'main2' },
  { id: 'agro-negocio', label: 'Agro-negócio', zone: 'main2' },
  { id: 'oportunidades', label: 'Oportunidades', zone: 'main2' },
  { id: 'clima', label: 'Clima local', zone: 'side' },
  { id: 'sabores', label: 'Sabores e curiosidades', zone: 'side' },
  { id: 'recentes', label: 'Publicações recentes', zone: 'side' },
  { id: 'internacional', label: 'Internacional', zone: 'side2' },
  { id: 'mais-lidas', label: 'Mais lidas', zone: 'side2' },
  { id: 'newsletter', label: 'Newsletter', zone: 'side2' },
  { id: 'sugestoes', label: 'Sugestões de leitura', zone: 'bottom' },
];

/** Secções que se podem duplicar (cada cópia tem a sua categoria e as suas opções). O `id` da cópia é «secção~código». */
export const DUPLICABLE = ['destaque', 'destaque-card1', 'destaque-card2', 'destaque-lista', 'comunidade', 'ultimas', 'agro', 'agro-negocio', 'oportunidades'];
export const baseId = (id: string) => id.split('~')[0];
export const isCopyId = (id: string) => /^[a-z0-9-]+~[a-z0-9]{4,8}$/.test(id) && DUPLICABLE.includes(baseId(id));
/** Nome da secção no painel (a cópia leva «(cópia)»). */
export const sectionLabel = (id: string) => {
  const base = HOME_SECTIONS.find((x) => x.id === baseId(id));
  return base ? (id.includes('~') ? `${base.label} (cópia)` : base.label) : id;
};

/** Espaço de publicidade posto numa zona (como um bloco do Gutenberg): o `id` entra na lista de secções da zona. */
export const isAdId = (id: string) => /^pub-[a-z0-9]{4,12}$/.test(id);

/** Medida exacta (e peso de referência) do anúncio em cada zona: a mesma tabela da página dos espaços de publicidade do site. */
export const HOME_AD_SIZES: Record<BaseZone, { name: string; w: number; h: number; kb: number }> = {
  top: { name: 'Topo do site', w: 728, h: 90, kb: 100 },
  main: { name: 'Entre as notícias', w: 680, h: 150, kb: 100 },
  side: { name: 'Barra lateral', w: 120, h: 200, kb: 120 },
  main2: { name: 'Entre as notícias', w: 680, h: 150, kb: 100 },
  side2: { name: 'Barra lateral', w: 120, h: 200, kb: 120 },
  bottom: { name: 'Em cima do rodapé', w: 728, h: 90, kb: 100 },
};

export type HomeLayout = Record<HomeZone, string[]>;
/** Onde ficam as secções de origem que se apagaram da página (não se perdem: voltam a pôr-se pelo «Acrescentar à zona…»). Não é uma zona da página. */
export const TRASH_ZONE = 'removidas';

/**
 * Secção nova (faixa): um par «coluna principal + barra lateral» posto no meio da página, à parte dos dois pares de origem.
 * `after` = o bloco (ou a faixa) a seguir ao qual fica. Sem nada na barra lateral, a coluna principal ocupa a largura toda e não parte os blocos que já existem.
 */
export type HomeBand = { id: string; after: string };
/** Blocos de origem da página, de cima para baixo. */
export const PAGE_BLOCKS = ['top', 'cols1', 'cols2', 'bottom'] as const;
export const isBandId = (id: string) => /^sec[a-z0-9]{3,6}$/.test(id);
export const bandZone = (band: string, side: 'main' | 'side'): HomeZone => `${band}:${side}`;
/** Zona larga (a principal de uma faixa) ou de origem larga: cabem cards lado a lado. */
export const isBandZone = (zone: string) => /^sec[a-z0-9]{3,6}:(main|side)$/.test(zone);
/** O bloco da página onde está uma zona: as de origem pertencem ao seu bloco; as de uma faixa, à faixa. */
export const blockOfZone = (zone: string): string =>
  zone === 'top' ? 'top' : zone === 'main' || zone === 'side' ? 'cols1' : zone === 'main2' || zone === 'side2' ? 'cols2' : zone === 'bottom' ? 'bottom' : zone.split(':')[0];
/** Ordem dos blocos na página: os de origem e, a seguir a cada um, as faixas que lhe seguem (e as que seguem essas). */
export function pageOrder(bands: HomeBand[]): string[] {
  const out: string[] = [];
  const after = (key: string, depth: number) => {
    if (depth > bands.length) return;
    for (const b of bands) if (b.after === key) { out.push(b.id); after(b.id, depth + 1); }
  };
  for (const k of PAGE_BLOCKS) { out.push(k); after(k, 0); }
  return out;
}

/** A ordem de origem da página (a de antes de haver esta configuração). */
export function defaultHomeLayout(): HomeLayout {
  const out: HomeLayout = { top: [], main: [], side: [], main2: [], side2: [], bottom: [], [TRASH_ZONE]: [] };
  for (const s of HOME_SECTIONS) out[s.zone].push(s.id);
  return out;
}

/**
 * Valida o que está guardado: só secções que existem, cada uma uma só vez; as que faltarem (secção nova no código)
 * ficam no fim da sua zona de origem. Assim a home nunca perde uma secção nem repete outra.
 */
export function normalizeHomeLayout(raw: unknown): HomeLayout {
  const known = new Set(HOME_SECTIONS.map((s) => s.id));
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const seen = new Set<string>();
  const out: HomeLayout = { top: [], main: [], side: [], main2: [], side2: [], bottom: [], [TRASH_ZONE]: [] };
  // Zonas das secções novas («código:main» / «código:side»): as que não estiverem nas opções ficam sem efeito (o painel limpa-as).
  for (const key of Object.keys(r)) if (isBandZone(key)) out[key] = [];
  for (const zone of Object.keys(out)) {
    const list = (Array.isArray(r[zone]) ? (r[zone] as unknown[]) : []).flatMap((x) => (x === 'destaque-cards' ? ['destaque-card1', 'destaque-card2'] : [x]));
    for (const id of list) {
      if (typeof id === 'string' && (zone === TRASH_ZONE ? known.has(id) : known.has(id) || isAdId(id) || isCopyId(id)) && !seen.has(id)) {
        seen.add(id);
        out[zone].push(id);
      }
    }
  }
  for (const s of HOME_SECTIONS) if (!seen.has(s.id)) out[s.zone].push(s.id);
  return out;
}


/**
 * Categorias que cada secção mostra, escolhidas no painel. `key` identifica o lugar (o destaque tem dois cards ao lado do banner);
 * `multi` = a secção junta várias categorias (selector, ou preferência por ordem); `defaults` = as de origem.
 */
export const HOME_CATEGORY_SLOTS: { key: string; section: string; label: string; multi: boolean; defaults: string[] }[] = [
  // «todas» = os slides em destaque do site (origem); uma categoria = as notícias mais recentes dessa categoria.
  { key: 'slide', section: 'destaque', label: 'Categoria', multi: false, defaults: ['todas'] },
  { key: 'hero1', section: 'destaque-card1', label: 'Categoria', multi: false, defaults: ['comunidade'] },
  { key: 'hero2', section: 'destaque-card2', label: 'Categoria', multi: false, defaults: ['oportunidades'] },
  { key: 'herolista', section: 'destaque-lista', label: 'Categoria', multi: false, defaults: ['comunidade'] },
  { key: 'ultimas', section: 'ultimas', label: 'Categoria', multi: false, defaults: ['todas'] },
  { key: 'comunidade', section: 'comunidade', label: 'Categorias', multi: true, defaults: ['comunidade', 'ambiente', 'desenvolvimento-local', 'apoio-comunitario', 'turismo-rural', 'meios-de-vida'] },
  { key: 'agro', section: 'agro', label: 'Categorias', multi: true, defaults: ['agricultura', 'fruticultura', 'mulher-agrario', 'sector-publico', 'entrevista'] },
  { key: 'agro-negocio', section: 'agro-negocio', label: 'Categoria', multi: false, defaults: ['agro-negocio'] },
  { key: 'oportunidades', section: 'oportunidades', label: 'Categoria', multi: false, defaults: ['oportunidades'] },
  { key: 'internacional', section: 'internacional', label: 'Categoria', multi: false, defaults: ['internacional'] },
  { key: 'sabores', section: 'sabores', label: 'Categorias', multi: true, defaults: ['receitas', 'curiosidade'] },
  { key: 'recentes', section: 'recentes', label: 'Categoria', multi: false, defaults: ['entrevista'] },
];

export type HomeCategories = Record<string, string[]>;

/** Lugares de categoria de uma secção: os dela ou, numa cópia, os da secção de origem com a chave da cópia. */
export function slotsFor(id: string) {
  if (!id.includes('~')) return HOME_CATEGORY_SLOTS.filter((s) => s.section === id);
  return HOME_CATEGORY_SLOTS.filter((s) => s.section === baseId(id)).map((s) => ({ ...s, key: slotKey(id, s.key), section: id }));
}

/** Chave onde ficam as categorias de um lugar numa secção: a de origem, ou («lugar~código») a da cópia. */
export const slotKey = (id: string, baseKey: string) => (!id.includes('~') ? baseKey : baseKey === baseId(id) ? id : `${baseKey}~${id.split('~')[1]}`);

export function defaultHomeCategories(): HomeCategories {
  return Object.fromEntries(HOME_CATEGORY_SLOTS.map((s) => [s.key, [...s.defaults]]));
}

/** Valida o que está guardado: só lugares que existem, categorias em forma de endereço, sem repetir; o que faltar volta ao de origem. */
export function normalizeHomeCategories(raw: unknown): HomeCategories {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out = defaultHomeCategories();
  for (const slot of HOME_CATEGORY_SLOTS) {
    const list = Array.isArray(r[slot.key]) ? (r[slot.key] as unknown[]) : [];
    const clean = list.filter((c, i): c is string => typeof c === 'string' && /^[a-z0-9-]{1,60}$/.test(c) && list.indexOf(c) === i).slice(0, slot.multi ? 12 : 1);
    if (clean.length > 0) out[slot.key] = clean;
  }
  // Cópias de secções: a chave é a da cópia («oportunidades~ab12»); as regras são as do lugar de origem.
  for (const key of Object.keys(r)) {
    if (!/^[a-z0-9-]+~[a-z0-9]{4,8}$/.test(key)) continue;
    const slot = HOME_CATEGORY_SLOTS.find((x) => x.key === baseId(key) && DUPLICABLE.includes(x.section));
    const list = Array.isArray(r[key]) ? (r[key] as unknown[]) : [];
    const clean = list.filter((c, i): c is string => typeof c === 'string' && /^[a-z0-9-]{1,60}$/.test(c) && list.indexOf(c) === i).slice(0, slot?.multi ? 12 : 1);
    if (slot && clean.length > 0) out[key] = clean;
  }
  return out;
}

/** Disposição do destaque (banner e os dois cards) e dados dos espaços de publicidade. */
export type HeroSide = 'banner-esquerda' | 'cards-esquerda';
export type HomeAd = { id: string; image: string; link: string };
/** Estilo do destaque: banner e dois cards (de origem), ou banner e uma lista que desliza para cima. */
export type HeroStyle = 'cards' | 'lista' | 'slide' | 'carrossel' | 'carrossel-conteudo';
/** `hidden`: secções desligadas (olho no painel): continuam na lista mas não aparecem no site. */
/** `heroStyle` e `heroSide`: estilo e disposição de uma cópia do slide (cada slide tem os seus; o original usa os de `HomeOptions`). */
/** `listScroll`: no layout em lista, mostra só 3 notícias e as outras ficam numa barra de rolagem (em vez de todas visíveis). */
/** Opções de cada secção: `rows` = linhas de cards (Últimas notícias), `count` = quantas notícias mostra (Oportunidades), `carousel` = passa em carrossel. */
/** `listCarousel`: no layout em lista, carrossel vertical com todas as notícias da categoria, em ciclo. `visible`: quantas notícias da lista ficam à vista (rolagem ou carrossel). */
export type SectionSettings = { rows?: number; count?: number; carousel?: boolean; layout?: SectionLayout; listScroll?: boolean; listCarousel?: boolean; visible?: number; heroStyle?: HeroStyle; heroSide?: HeroSide };

/** Layout de uma secção de cards: lista numa coluna; um card com a lista à direita / à esquerda / em baixo; dois cards com duas notícias em baixo de cada um; ou grelha de cards iguais. */
export type SectionLayout = 'lista' | 'principal-baixo' | 'principal-direita' | 'principal-esquerda' | 'dois-cards' | 'grelha';
export const SECTION_LAYOUTS: { id: SectionLayout; label: string }[] = [
  { id: 'principal-direita', label: 'Um card e lista vertical à direita (2 colunas)' },
  { id: 'principal-esquerda', label: 'Um card e lista vertical à esquerda (2 colunas)' },
  { id: 'principal-baixo', label: 'Um card e lista em baixo' },
  { id: 'dois-cards', label: 'Dois cards e lista em baixo (2 colunas)' },
  { id: 'lista', label: 'Lista vertical numa coluna' },
  { id: 'grelha', label: 'Grelha de notícias (3 por linha)' },
];
const ALL_LAYOUTS = SECTION_LAYOUTS.map((l) => l.id);
/** Todas as secções de notícias aceitam qualquer layout (as cópias herdam da secção de origem). */
export const LAYOUT_SUPPORT: Record<string, SectionLayout[]> = { comunidade: ALL_LAYOUTS, agro: ALL_LAYOUTS, 'agro-negocio': ALL_LAYOUTS, ultimas: ALL_LAYOUTS, oportunidades: ALL_LAYOUTS };
export const layoutsOf = (id: string): SectionLayout[] => LAYOUT_SUPPORT[baseId(id)] ?? [];
/** O layout de origem de cada secção (o que tinha antes de haver escolha). */
export const defaultLayoutOf = (id: string): SectionLayout => (['agro', 'ultimas'].includes(baseId(id)) ? 'grelha' : baseId(id) === 'oportunidades' ? 'lista' : 'principal-direita');
/** `v`: versão da forma guardada (2 = o destaque dividido em slide, cards e lista). */
export type HomeOptions = { v: number; heroSide: HeroSide; heroStyle: HeroStyle; ads: HomeAd[]; hidden: string[]; sections: Record<string, SectionSettings>; bands: HomeBand[] };

/** Estilo e disposição de um slide: o original usa os das opções gerais; cada cópia tem os seus (as cópias antigas, sem escolha própria, seguem as gerais até se mexer nelas). */
export const heroStyleOf = (o: HomeOptions, id: string): HeroStyle => (id === 'destaque' ? o.heroStyle : o.sections[id]?.heroStyle ?? o.heroStyle);
export const heroSideOf = (o: HomeOptions, id: string): HeroSide => (id === 'destaque' ? o.heroSide : o.sections[id]?.heroSide ?? o.heroSide);

export const defaultHomeOptions = (): HomeOptions => ({ v: 2, heroSide: 'banner-esquerda', heroStyle: 'cards', ads: [], hidden: ['destaque-lista'], sections: {}, bands: [] });

const okUrl = (u: string) => u === '' || (u.length <= 500 && (/^https?:\/\/\S+$/i.test(u) || /^\/[^\s/]\S*$/.test(u)));

export function normalizeHomeOptions(raw: unknown): HomeOptions {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const ads: HomeAd[] = [];
  for (const a of Array.isArray(r.ads) ? (r.ads as unknown[]) : []) {
    const o = (a && typeof a === 'object' ? a : {}) as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : '';
    const image = typeof o.image === 'string' ? o.image.trim() : '';
    const link = typeof o.link === 'string' ? o.link.trim() : '';
    if (isAdId(id) && !ads.some((x) => x.id === id) && okUrl(image) && okUrl(link) && ads.length < 20) ads.push({ id, image, link });
  }
  const known = new Set(HOME_SECTIONS.map((s) => s.id));
  let hidden = (Array.isArray(r.hidden) ? (r.hidden as unknown[]) : []).flatMap((x) => (x === 'destaque-cards' ? ['destaque-card1', 'destaque-card2'] : [x])).filter((id, i, all): id is string => typeof id === 'string' && (known.has(id) || isAdId(id) || isCopyId(id)) && all.indexOf(id) === i);
  const sections: Record<string, SectionSettings> = {};
  for (const [id, v] of Object.entries((r.sections && typeof r.sections === 'object' ? r.sections : {}) as Record<string, unknown>)) {
    if (!known.has(id) && !isCopyId(id)) continue;
    const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
    const int = (x: unknown, max: number) => (typeof x === 'number' && Number.isInteger(x) && x >= 1 && x <= max ? x : undefined);
    const st: SectionSettings = {};
    if (int(o.rows, 6)) st.rows = int(o.rows, 6);
    if (int(o.count, 60)) st.count = int(o.count, 60);
    if (o.carousel === true) st.carousel = true;
    if (o.listScroll === true) st.listScroll = true;
    if (o.listCarousel === true) st.listCarousel = true;
    if (int(o.visible, 6)) st.visible = int(o.visible, 6);
    if (baseId(id) === 'destaque' && id !== 'destaque') {
      if (['cards', 'lista', 'slide', 'carrossel', 'carrossel-conteudo'].includes(o.heroStyle as string)) st.heroStyle = o.heroStyle as HeroStyle;
      if (o.heroSide === 'banner-esquerda' || o.heroSide === 'cards-esquerda') st.heroSide = o.heroSide;
    }
    if (typeof o.layout === 'string' && layoutsOf(id).includes(o.layout as SectionLayout)) st.layout = o.layout as SectionLayout;
    if (Object.keys(st).length) sections[id] = st;
  }
  // Forma antiga (antes do destaque se dividir): a lista só aparecia com o estilo «lista», e então os cards ficavam de fora.
  let heroStyle: HeroStyle = r.heroStyle === 'slide' ? 'slide' : r.heroStyle === 'carrossel' ? 'carrossel' : r.heroStyle === 'carrossel-conteudo' ? 'carrossel-conteudo' : 'cards';
  if (r.v !== 2) {
    const wasList = r.heroStyle === 'lista';
    hidden = [...hidden, ...(wasList ? ['destaque-card1', 'destaque-card2'] : ['destaque-lista'])].filter((id, i, all) => all.indexOf(id) === i);
    heroStyle = wasList ? 'cards' : heroStyle;
  }
  // Secções novas (faixas): cada uma fica a seguir a um bloco de origem ou a outra faixa; o que não chega à página (ciclos) vai para o fim.
  const rawBands = (Array.isArray(r.bands) ? r.bands : []).filter((b): b is HomeBand => !!b && typeof (b as HomeBand).id === 'string' && isBandId((b as HomeBand).id) && typeof (b as HomeBand).after === 'string');
  const ids = new Set<string>();
  const bands: HomeBand[] = rawBands.filter((b) => !ids.has(b.id) && ids.add(b.id)).map((b) => ({ id: b.id, after: b.after }));
  for (const b of bands) {
    let at = b.after;
    for (let i = 0; i <= bands.length && !(PAGE_BLOCKS as readonly string[]).includes(at); i++) at = bands.find((x) => x.id === at)?.after ?? '';
    if (!(PAGE_BLOCKS as readonly string[]).includes(at)) b.after = 'bottom';
  }
  return { v: 2, hidden, sections, heroStyle, heroSide: r.heroSide === 'cards-esquerda' ? 'cards-esquerda' : 'banner-esquerda', ads, bands };
}
