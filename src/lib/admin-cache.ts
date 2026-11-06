/**
 * Cache do painel no navegador (vive enquanto o separador estiver aberto): ao voltar a uma página já visitada mostra-se logo
 * o que ficou guardado e a página actualiza-se em segundo plano, sem esperar pelo servidor.
 */
const store = new Map<string, unknown>();

export const adminCacheGet = <T>(key: string): T | undefined => store.get(key) as T | undefined;

export const adminCacheSet = (key: string, value: unknown) => {
  store.set(key, value);
};

/** Notícias do painel já guardadas (a mesma lista serve Notícias, Pendentes, Revistas, Arquivadas e Lixo), filtradas pelo estado. */
export const cachedNewsWithStatus = <T extends { status?: unknown }>(status: string): T[] =>
  ((adminCacheGet<T[]>('news') ?? []) as T[]).filter((n) => String(n.status ?? '').toLowerCase() === status);

let inflight: Promise<void> | null = null;

/** Vai buscar a lista de notícias do painel e guarda-a (uma só ida ao servidor de cada vez); usada ao entrar no painel. */
export function prefetchAdminNews(): Promise<void> {
  if (adminCacheGet('news') !== undefined) return Promise.resolve();
  inflight ??= fetch('/api/admin/news/list', { credentials: 'include' })
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => {
      if (body?.items) adminCacheSet('news', body.items);
    })
    .catch(() => {})
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
