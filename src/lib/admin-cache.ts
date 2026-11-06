/**
 * Cache do painel no navegador (vive enquanto o separador estiver aberto): ao voltar a uma página já visitada mostra-se logo
 * o que ficou guardado e a página actualiza-se em segundo plano, sem esperar pelo servidor.
 */
const store = new Map<string, unknown>();

export const adminCacheGet = <T>(key: string): T | undefined => store.get(key) as T | undefined;

export const adminCacheSet = (key: string, value: unknown) => {
  store.set(key, value);
};
