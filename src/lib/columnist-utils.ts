/* Ajudantes sem dependências do servidor: servem o painel (navegador), a API e a home. */
/** Mesmo autor? (sem maiúsculas, acentos nem espaços a mais) */
const norm = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export const sameAuthor = (a: string, b: string) => norm(a) !== '' && norm(a) === norm(b);

/** Artigos publicados da categoria Opinião (principal ou extra), os mais recentes primeiro. */
export function opinionPosts<T extends { categorySlug: string; extraCategories: { slug: string }[]; date: string }>(posts: T[]): T[] {
  return posts
    .filter((p) => p.categorySlug === 'opiniao' || p.extraCategories.some((c) => c.slug === 'opiniao'))
    .sort((a, b) => b.date.localeCompare(a.date));
}
