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

