/**
 * Visitas que não são do site EntreCampos: páginas do painel, ferramentas de desenvolvimento e
 * pedidos feitos a partir de um servidor local. Não se registam nem contam nas estatísticas.
 */
const OWN_PATHS = /^\/(admin|api|partilha\/|vhost:|pre-visualizacao)/i;
const LOCAL_HOST = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|.*\.local|.*\.localhost)$/i;

export const isForeignPath = (path: string) => OWN_PATHS.test(path);
/** `host` pode trazer porta (localhost:3004). */
export const isLocalHost = (host: string) => LOCAL_HOST.test((host || '').replace(/:\d+$/, '')) || /^127\./.test(host || '');
