import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import sanitizeHtml from 'sanitize-html';
import { normalizeSpaces } from '@/lib/normalize-spaces';

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  /** HTML limpo, pronto a mostrar na página de leitura. */
  content: string;
  category: string;
  categorySlug: string;
  image: string;
  date: string;
  author: string;
  /** Marcada como "Destaque" no dashboard: entra no slide da home. */
  featured: boolean;
}

/** Nome mantido por compatibilidade com os componentes das homes anteriores. */
export type HomePost = Post;

export interface Category {
  slug: string;
  label: string;
  count: number;
}

export const FEATURED_SLIDES = 5;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Leitura pública: chave anon primeiro; a de serviço só se as outras não existirem.
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';
const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';

/** Domínio antigo (sem DNS) → site online, onde as imagens existem. */
const ONLINE_HOST = 'https://entrecamposblog.com/';

const CATEGORY_LABELS: Record<string, string> = {
  agricultura: 'Agricultura',
  'sector-agrario': 'Sector agrário',
  comunidade: 'Comunidade',
  ambiente: 'Ambiente',
  'turismo-rural': 'Turismo rural',
  'mulher-agrario': 'Mulher agrário',
  curiosidade: 'Curiosidade',
  'agro-negocio': 'Agro-negócio',
  'agro-pecuaria': 'Agro-pecuária',
  'agro-processamento': 'Agro-processamento',
  fruticultura: 'Fruticultura',
  oportunidades: 'Oportunidades',
  receitas: 'Receitas',
  apicultura: 'Apicultura',
  'seguranca-alimentar': 'Segurança alimentar',
  'meios-de-vida': 'Meios de vida',
  entrevsta: 'Entrevista',
  entrevista: 'Entrevista',
  'gestao-agricola': 'Gestão agrícola',
  'historias-inspiradoras': 'Histórias inspiradoras',
  'inclusao-feminina': 'Inclusão feminina',
  'infra-estruturas': 'Infra-estruturas',
  inovacao: 'Inovação',
  'sem-categoria': 'Sem categoria',
  'voce-sabiaa': 'Você sabia?',
};

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isKnownCategory(slug: string) {
  return slug in CATEGORY_LABELS;
}

export function categoryLabel(slug: string, fallback = '') {
  return CATEGORY_LABELS[slug] || fallback || slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

function stripTags(value: string) {
  return (value || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanImageUrl(value?: string) {
  const url = (value || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
  return url.replace(/^https?:\/\/(www\.)?entrecampos\.co\.mz\//, ONLINE_HOST);
}

/** HTML do artigo: sanitizado (conteúdo vindo do editor/contribuidores) e com imagens apontadas ao site online. */
function cleanContent(html: string) {
  const safe = sanitizeHtml(normalizeSpaces(html || '').replace(/<!\[CDATA\[|\]\]>/g, ''), {
    allowedTags: [
      'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'blockquote', 'pre', 'code',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }, true),
    },
  });
  return safe
    // Parágrafos vazios (linhas em branco do editor): o espaço entre parágrafos já é automático.
    .replace(/<p>(?:\s|&nbsp;| |<br\s*\/?>)*<\/p>/g, '')
    .replace(/https?:\/\/(www\.)?entrecampos\.co\.mz\//g, ONLINE_HOST)
    .trim();
}

function normTitle(value: string) {
  return stripTags(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toPost(raw: {
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  image?: string;
  date?: string;
  author?: string;
  featured?: boolean;
}): Post | null {
  const slug = raw.slug?.trim();
  const title = stripTags(raw.title || '');
  if (!slug || !title) return null;

  const categorySlug = slugify(raw.category || 'sem-categoria') || 'sem-categoria';
  const content = cleanContent(raw.content || '');
  const excerptSource = stripTags(raw.excerpt || '') || stripTags(content);
  return {
    slug,
    title,
    excerpt: excerptSource.length > 160 ? `${excerptSource.slice(0, 157).trimEnd()}…` : excerptSource,
    content,
    category: categoryLabel(categorySlug, stripTags(raw.category || '')),
    categorySlug,
    image: cleanImageUrl(raw.image),
    date: raw.date || '',
    author: raw.author?.trim() || 'admin',
    featured: !!raw.featured,
  };
}

async function querySupabase(table: string, filter: string): Promise<Array<Record<string, unknown>> | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&${filter}&order=date.desc&limit=1000`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: AbortSignal.timeout(15000), // a lista completa (com texto) demora uns 6 s neste servidor
      next: { revalidate: 60, tags: ['news'] },
    });
    if (!res.ok) return null;
    return (await res.json()) as Array<Record<string, unknown>>;
  } catch {
    return null;
  }
}

/** Notícias do site na tabela `news` (partilhada por vários sites): as publicadas e todos os slugs conhecidos (qualquer estado). */
async function fromSupabase(): Promise<{ published: Post[]; known: Set<string> } | null> {
  const rows = await querySupabase('news', `site_id=eq.${encodeURIComponent(SITE_ID)}`);
  if (!rows) return null;
  // Chaves de identificação (slug e título normalizado): o site online e o Supabase nem sempre usam o mesmo slug.
  const known = new Set(rows.flatMap((r) => [String(r.slug || ''), `t:${normTitle(String(r.title || ''))}`]).filter((k) => k && k !== 't:'));
  const published = rows
    // O estado vem ora "published" ora "Published".
    .filter((r) => String(r.status || '').toLowerCase() === 'published')
    .map((r) =>
      toPost({
        slug: r.slug as string,
        title: r.title as string,
        excerpt: r.summary as string,
        content: r.content as string,
        category: r.category as string,
        image: r.image_url as string,
        date: r.date as string,
        author: r.author_name as string,
        featured: r.featured === true,
      }),
    )
    .filter((p): p is Post => p !== null);
  return { published, known };
}

/**
 * Fallback local: instantâneo do site online (scripts/sync-live-news.mjs), com texto completo e imagem
 * de cada notícia. Se não existir, usa a importação antiga (posts.json), cujo texto vem cortado.
 */
function fromLocalData(): Post[] {
  const dir = path.join(process.cwd(), 'data');
  try {
    const live = JSON.parse(fs.readFileSync(path.join(dir, 'live-posts.json'), 'utf-8')) as Array<Record<string, string>>;
    return live
      .map((r) => toPost({ ...r, excerpt: r.excerpt }))
      .filter((p): p is Post => p !== null);
  } catch {
    /* sem instantâneo: tenta a importação antiga */
  }
  try {
    const rows = JSON.parse(fs.readFileSync(path.join(dir, 'posts.json'), 'utf-8')) as Array<Record<string, unknown>>;
    const images = JSON.parse(fs.readFileSync(path.join(dir, 'post-images.json'), 'utf-8')) as Record<string, string>;
    return rows
      .map((r) =>
        toPost({
          slug: r.slug as string,
          title: r.title as string,
          excerpt: r.excerpt as string,
          content: r.content as string,
          category: r.category as string,
          image: images[r.slug as string],
          date: r.pubDate ? new Date(r.pubDate as string).toISOString() : '',
          author: r.author as string,
        }),
      )
      .filter((p): p is Post => p !== null);
  } catch {
    return [];
  }
}

export const getAllPosts = cache(async (): Promise<{ posts: Post[]; source: 'supabase' | 'local' }> => {
  const remote = await fromSupabase();
  const local = fromLocalData();
  if (!remote || remote.published.length === 0) {
    local.sort((a, b) => b.date.localeCompare(a.date));
    return { posts: local, source: 'local' };
  }

  // O que está no Supabase manda (é o que o dashboard edita). Notícias antigas sem imagem recebem a do site online
  // (mesmo slug) e as que só existem no site online continuam visíveis, excepto as que o dashboard já tem em
  // qualquer estado (ex.: lixo/arquivadas).
  const localKey = (p: Post) => [p.slug, `t:${normTitle(p.title)}`];
  const localByKey = new Map(local.flatMap((p) => localKey(p).map((k) => [k, p] as const)));
  const posts = [
    ...remote.published.map((p) => ({ ...p, image: p.image || localKey(p).map((k) => localByKey.get(k)?.image).find(Boolean) || '' })),
    ...local.filter((p) => !localKey(p).some((k) => remote.known.has(k))),
  ];
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return { posts, source: 'supabase' };
});

/** Uma notícia por imagem e só com imagem: usado nas homes, onde a foto manda. */
export function uniqueWithImage(posts: Post[]) {
  const seen = new Set<string>();
  return posts.filter((p) => !!p.image && !seen.has(p.image) && !!seen.add(p.image));
}

/** Compatível com a home World Vision (/iniciar). */
export async function getHomePosts() {
  const { posts, source } = await getAllPosts();
  return { posts: uniqueWithImage(posts), source };
}

export async function getPost(slug: string) {
  const { posts } = await getAllPosts();
  const wanted = decodeURIComponent(slug);
  return posts.find((p) => p.slug === wanted) ?? null;
}

export async function getCategoryPosts(categorySlug: string) {
  const { posts } = await getAllPosts();
  return posts.filter((p) => p.categorySlug === categorySlug);
}

export async function getCategories(): Promise<Category[]> {
  const { posts } = await getAllPosts();
  const counts = new Map<string, number>();
  for (const p of posts) counts.set(p.categorySlug, (counts.get(p.categorySlug) ?? 0) + 1);
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, label: categoryLabel(slug), count }))
    .sort((a, b) => b.count - a.count);
}

export async function getRelated(post: Post, count = 4) {
  const { posts } = await getAllPosts();
  const others = posts.filter((p) => p.slug !== post.slug && p.image);
  const same = others.filter((p) => p.categorySlug === post.categorySlug);
  const rest = others.filter((p) => p.categorySlug !== post.categorySlug);
  return [...same, ...rest].slice(0, count);
}

/**
 * Slide da home: as últimas 5 notícias marcadas "Destaque" no dashboard. Quando entra uma nova,
 * a mais antiga sai do slide e fica só na sua categoria. Sem nenhuma marcada, usa as 5 mais recentes.
 */
export async function getFeatured(count = FEATURED_SLIDES) {
  const { posts } = await getAllPosts();
  const withImage = uniqueWithImage(posts);
  const featured = withImage.filter((p) => p.featured);
  return (featured.length > 0 ? featured : withImage).slice(0, count);
}

export const PAGE_SIZE = 12;

export function longDatePt(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const month = d.toLocaleDateString('pt-PT', { month: 'long' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Página estática (ex.: Contactos): snapshot do site online, com o antigo pages.json como reserva. Conteúdo sanitizado. */
export function getStaticPage(slug: string): { title: string; content: string } | null {
  for (const file of ['live-pages.json', 'pages.json']) {
    try {
      const pages = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', file), 'utf-8')) as Array<{ slug: string; title: string; content: string }>;
      const page = pages.find((p) => p.slug === slug);
      if (page) {
        // A página Contactos do site online traz um formulário Elementor (sem utilidade aqui): ficam só os contactos.
        const html = slug === 'contactos' ? page.content.slice(0, page.content.indexOf('</ul>') + 5) || page.content : page.content;
        return { title: stripTags(page.title), content: cleanContent(html) };
      }
    } catch {
      /* ficheiro em falta: tenta o seguinte */
    }
  }
  return null;
}
