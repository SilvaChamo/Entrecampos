/**
 * Secções da página inicial e as zonas onde podem estar (código partilhado pelo painel e pela home: sem nada de servidor).
 */
export type HomeZone = 'top' | 'main' | 'side' | 'main2' | 'side2' | 'bottom';
export const HOME_ZONES: { id: HomeZone; label: string; hint: string }[] = [
  { id: 'top', label: 'Topo', hint: 'largura total, por cima das colunas' },
  { id: 'main', label: 'Coluna principal', hint: 'coluna larga, à esquerda' },
  { id: 'side', label: 'Barra lateral', hint: 'coluna estreita, à direita' },
  { id: 'main2', label: 'Coluna principal (2.ª secção)', hint: 'coluna larga, na secção de baixo' },
  { id: 'side2', label: 'Barra lateral (2.ª secção)', hint: 'coluna estreita, na secção de baixo' },
  { id: 'bottom', label: 'Fim', hint: 'largura total, por baixo das colunas' },
];

/** Todas as secções da home. `zone` é a zona de origem (a ordem em que estão aqui é a ordem de origem). */
export const HOME_SECTIONS: { id: string; label: string; zone: HomeZone }[] = [
  { id: 'destaque', label: 'Destaque (slide principal e cards ao lado)', zone: 'top' },
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

export type HomeLayout = Record<HomeZone, string[]>;

/** A ordem de origem da página (a de antes de haver esta configuração). */
export function defaultHomeLayout(): HomeLayout {
  const out: HomeLayout = { top: [], main: [], side: [], main2: [], side2: [], bottom: [] };
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
  const out: HomeLayout = { top: [], main: [], side: [], main2: [], side2: [], bottom: [] };
  for (const zone of HOME_ZONES.map((z) => z.id)) {
    const list = Array.isArray(r[zone]) ? (r[zone] as unknown[]) : [];
    for (const id of list) {
      if (typeof id === 'string' && known.has(id) && !seen.has(id)) {
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
  { key: 'hero1', section: 'destaque', label: 'Card de cima', multi: false, defaults: ['comunidade'] },
  { key: 'hero2', section: 'destaque', label: 'Card de baixo', multi: false, defaults: ['oportunidades'] },
  { key: 'comunidade', section: 'comunidade', label: 'Categorias', multi: true, defaults: ['comunidade', 'ambiente', 'desenvolvimento-local', 'apoio-comunitario', 'turismo-rural', 'meios-de-vida'] },
  { key: 'agro', section: 'agro', label: 'Categorias', multi: true, defaults: ['agricultura', 'fruticultura', 'mulher-agrario', 'sector-publico', 'entrevista'] },
  { key: 'agro-negocio', section: 'agro-negocio', label: 'Categoria', multi: false, defaults: ['agro-negocio'] },
  { key: 'oportunidades', section: 'oportunidades', label: 'Categoria', multi: false, defaults: ['oportunidades'] },
  { key: 'internacional', section: 'internacional', label: 'Categoria', multi: false, defaults: ['internacional'] },
  { key: 'sabores', section: 'sabores', label: 'Categorias', multi: true, defaults: ['receitas', 'curiosidade'] },
  { key: 'recentes', section: 'recentes', label: 'Categoria', multi: false, defaults: ['entrevista'] },
];

export type HomeCategories = Record<string, string[]>;

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
  return out;
}
