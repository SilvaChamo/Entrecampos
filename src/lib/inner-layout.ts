import { SECTION_LAYOUTS, type SectionLayout } from '@/lib/home-sections';

/**
 * Modelo das páginas interiores, escolhido no painel (Layout): que blocos leva a barra lateral, pela ordem em que
 * aparecem, e se entra uma secção de notícias no meio da página. Três modelos: páginas interiores (planos, conta,
 * pagamento), categorias (e arquivo de notícias) e leitura de notícias.
 */
export type InnerPageKey = 'interior' | 'categoria' | 'leitura';

export const INNER_PAGES: { key: InnerPageKey; label: string; href: string; hint: string; extra: boolean; extraUnit: string }[] = [
  { key: 'interior', label: 'Páginas interiores', href: '/admin/layout/interiores', hint: 'Planos, assinatura, pagamento e outras páginas de serviço.', extra: false, extraUnit: '' },
  { key: 'categoria', label: 'Categorias', href: '/admin/layout/categorias', hint: 'Cada categoria e o arquivo de notícias: lista de cards à esquerda e barra lateral à direita.', extra: true, extraUnit: 'notícias' },
  { key: 'leitura', label: 'Leitura de notícias', href: '/admin/layout/leitura', hint: 'A página de uma notícia: texto à esquerda e barra lateral à direita.', extra: true, extraUnit: 'parágrafos' },
];

export const SIDEBAR_BLOCKS = [
  { id: 'tempo', label: 'Tempo (previsão)', hint: 'O cartão do clima.' },
  { id: 'cambio', label: 'Câmbio', hint: 'O cartão de câmbio das moedas.' },
  { id: 'destaque', label: 'Notícia em destaque', hint: 'A receita mais recente, ou a notícia mais recente com imagem.' },
  { id: 'facebook', label: 'Facebook', hint: 'A ligação à página do jornal.' },
  { id: 'publicidade', label: 'Publicidade', hint: 'O espaço de publicidade da barra lateral.' },
] as const;
export type SidebarBlock = (typeof SIDEBAR_BLOCKS)[number]['id'];
const BLOCK_IDS: string[] = SIDEBAR_BLOCKS.map((b) => b.id);

/** Secção de notícias que entra no meio da página: de que categoria, em que layout e depois de quantas notícias (ou parágrafos). */
export type InnerExtra = {
  enabled: boolean;
  /** 'ultimas' = as mais recentes de todas as categorias; senão, o endereço de uma categoria. */
  category: string;
  layout: SectionLayout;
  /** Depois de quantas notícias (categorias) ou parágrafos do texto (leitura). */
  after: number;
  rows: number;
  carousel: boolean;
  listCarousel: boolean;
  visible: number;
};
export type InnerPageConfig = { sidebar: SidebarBlock[]; extra: InnerExtra };
export type InnerLayout = Record<InnerPageKey, InnerPageConfig>;

export const defaultExtra = (): InnerExtra => ({ enabled: false, category: 'ultimas', layout: 'grelha', after: 6, rows: 1, carousel: false, listCarousel: false, visible: 3 });

/** O que as páginas mostravam antes de haver escolha: a leitura leva o câmbio; as outras não; nenhuma leva o Facebook. */
export function defaultInnerLayout(): InnerLayout {
  const base = (cambio: boolean): InnerPageConfig => ({ sidebar: cambio ? ['tempo', 'cambio', 'destaque', 'publicidade'] : ['tempo', 'destaque', 'publicidade'], extra: defaultExtra() });
  return { interior: base(false), categoria: base(false), leitura: { ...base(true), extra: { ...defaultExtra(), after: 4 } } };
}

const KEYS: InnerPageKey[] = ['interior', 'categoria', 'leitura'];

export function normalizeInnerLayout(raw: unknown): InnerLayout {
  const out = defaultInnerLayout();
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  for (const key of KEYS) {
    const c = r[key];
    if (!c || typeof c !== 'object') continue;
    const o = c as Record<string, unknown>;
    if (Array.isArray(o.sidebar)) out[key].sidebar = o.sidebar.filter((id, i, all): id is SidebarBlock => typeof id === 'string' && BLOCK_IDS.includes(id) && all.indexOf(id) === i);
    const e = (o.extra && typeof o.extra === 'object' ? o.extra : {}) as Record<string, unknown>;
    const int = (x: unknown, min: number, max: number, d: number) => (typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max ? x : d);
    const d = out[key].extra;
    out[key].extra = {
      enabled: e.enabled === true,
      category: typeof e.category === 'string' && /^[a-z0-9-]{1,80}$/.test(e.category) ? e.category : d.category,
      layout: SECTION_LAYOUTS.some((l) => l.id === e.layout) ? (e.layout as SectionLayout) : d.layout,
      after: int(e.after, 0, 60, d.after),
      rows: int(e.rows, 1, 6, d.rows),
      carousel: e.carousel === true,
      listCarousel: e.listCarousel === true,
      visible: int(e.visible, 1, 6, d.visible),
    };
  }
  return out;
}

export const sameInnerLayout = (a: InnerLayout, b: InnerLayout) => JSON.stringify(a) === JSON.stringify(b);

/** Parte o texto (HTML) a seguir ao parágrafo `n`; com `n` 0, ou menos parágrafos do que `n`, o texto fica todo na primeira parte. */
export function splitAfterParagraph(html: string, n: number): [string, string] {
  if (n <= 0) return [html, ''];
  const closing = /<\/p>/gi;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = closing.exec(html))) {
    if (++count === n) {
      const at = m.index + m[0].length;
      return [html.slice(0, at), html.slice(at)];
    }
  }
  return [html, ''];
}
