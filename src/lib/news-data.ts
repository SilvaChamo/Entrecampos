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
  /** Leituras registadas na base de dados (0 se ainda não houver contagem). */
  views: number;
  /** Data da última edição (ISO) se a notícia foi editada depois de criada; vazio se nunca foi editada. */
  edited: string;
  /** Outras categorias da notícia além da principal (podem ser várias; vazio se só tem uma). */
  extraCategories: { slug: string; label: string }[];
  /** 'base' = artigo vindo da Base de Dados Agro (vista `noticias_base`), não editável neste painel. */
  origin?: 'base';
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
  'desenvolvimento-local': 'Desenvolvimento local',
  'apoio-comunitario': 'Apoio comunitário',
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
  // Categorias que chegam da Base de Dados Agro (vista `noticias_base`).
  noticia: 'Notícia',
  evento: 'Evento',
  guia: 'Guia',
  internacional: 'Internacional',
  'politica-agraria': 'Política Agrária',
  recursos: 'Recursos',
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
    allowedClasses: { div: ['ec-callout'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }, true),
    },
  });
  return safe
    // Parágrafos e títulos vazios (linhas em branco do editor): o espaço entre parágrafos já é automático.
    .replace(/<(p|h[1-6])>(?:\s|&nbsp;| |<br\s*\/?>)*<\/\1>/g, '')
    // Caixas e listas que ficaram vazias no editor.
    .replace(/<li>\s*<\/li>/g, '')
    .replace(/<(ul|ol)>\s*<\/\1>/g, '')
    .replace(/<div class="ec-callout">\s*<\/div>/g, '')
    .replace(/https?:\/\/(www\.)?entrecampos\.co\.mz\//g, ONLINE_HOST)
    .trim();
}

/**
 * Notícias importadas trazem a foto principal repetida no início do texto. Com imagem no cabeçalho da página
 * de leitura, tira-se a que abre o corpo (só se vier antes de qualquer texto); as do meio do texto ficam.
 */
function stripLeadingImage(html: string, hasHeaderImage: boolean) {
  if (!hasHeaderImage) return html;
  return html.replace(/^\s*(?:<(p|figure|div)>\s*)?<img\b[^>]*>\s*(?:<\/\1>\s*)?/i, '').trim();
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
  categories?: unknown;
  image?: string;
  date?: string;
  author?: string;
  featured?: boolean;
  views?: number;
  edited?: string;
  origin?: 'base';
}): Post | null {
  const slug = raw.slug?.trim();
  const title = stripTags(raw.title || '');
  if (!slug || !title) return null;

  const categorySlug = slugify(raw.category || 'sem-categoria') || 'sem-categoria';
  const extraCategories = (Array.isArray(raw.categories) ? (raw.categories as unknown[]) : [])
    .map((c) => slugify(String(c ?? '')))
    .filter((c, i, all) => c && c !== categorySlug && all.indexOf(c) === i)
    .map((slug) => ({ slug, label: categoryLabel(slug) }));
  const image = cleanImageUrl(raw.image);
  const content = stripLeadingImage(cleanContent(raw.content || ''), !!image);
  const excerptSource = stripTags(raw.excerpt || '') || stripTags(content);
  return {
    slug,
    title,
    excerpt: excerptSource.length > 160 ? `${excerptSource.slice(0, 157).trimEnd()}…` : excerptSource,
    content,
    category: categoryLabel(categorySlug, stripTags(raw.category || '')),
    categorySlug,
    extraCategories,
    image,
    date: raw.date || '',
    author: raw.author?.trim() || 'admin',
    featured: !!raw.featured,
    views: Number(raw.views) || 0,
    edited: raw.edited || '',
    ...(raw.origin ? { origin: raw.origin } : {}),
  };
}

/** Colunas da lista: sem `content` (o texto completo pesa ~5x mais e só a página de leitura precisa dele). */
const LIST_COLUMNS = 'id,slug,title,summary,category,categories,image_url,date,author_name,featured,views,status,created_at,updated_at';

async function querySupabase(table: string, filter: string, select = '*', limit = 1000): Promise<Array<Record<string, unknown>> | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}&${filter}&order=date.desc&limit=${limit}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 60, tags: ['news'] },
    });
    if (!res.ok) {
      // Base de dados sem a coluna `categories` ainda: repete sem ela.
      if (select.includes('categories') && res.status === 400) return querySupabase(table, filter, select.replace(',categories', ''), limit);
      return null;
    }
    return (await res.json()) as Array<Record<string, unknown>>;
  } catch {
    return null;
  }
}

/** Notícias do site na tabela `news` (partilhada por vários sites): as publicadas e todos os slugs conhecidos (qualquer estado). */
async function fromSupabase(): Promise<{ published: Post[]; known: Set<string>; base: Post[] } | null> {
  const [rows, baseRows] = await Promise.all([
    querySupabase('news', `site_id=eq.${encodeURIComponent(SITE_ID)}`, LIST_COLUMNS),
    // Artigos da Base de Dados Agro (menos documentos) partilhados com este site; sem a vista, simplesmente não há.
    querySupabase('noticias_base', 'status=eq.published', LIST_COLUMNS),
  ]);
  if (!rows) return null;
  const base = (baseRows ?? [])
    .map((r) =>
      toPost({
        slug: r.slug as string,
        title: r.title as string,
        excerpt: r.summary as string,
        category: r.category as string,
        image: r.image_url as string,
        date: r.date as string,
        author: r.author_name as string,
        views: Number(r.views) || 0,
        origin: 'base',
      }),
    )
    .filter((p): p is Post => p !== null);
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
        categories: r.categories,
        image: r.image_url as string,
        date: r.date as string,
        author: r.author_name as string,
        featured: r.featured === true,
        views: Number(r.views) || 0,
        // Editada = alterada depois de criada (mais de 1 minuto de diferença); as importadas não contam.
        edited:
          r.updated_at && r.created_at && Date.parse(String(r.updated_at)) - Date.parse(String(r.created_at)) > 60_000
            ? String(r.updated_at)
            : '',
      }),
    )
    .filter((p): p is Post => p !== null);

  // Partilha com a BasededadosAgro (sql/partilha-entrecampos-base.sql): a vista public.noticias_base traz os artigos
  // activos da Base, excepto documentos. Se a vista não existir ou falhar, o site segue só com as suas notícias.
  const shared = await querySupabase('noticias_base', 'status=eq.published', 'slug,title,summary,content,category,image_url,date,views');
  for (const r of shared ?? []) {
    const post = toPost({
      slug: r.slug as string,
      title: r.title as string,
      excerpt: r.summary as string,
      content: r.content as string,
      category: r.category as string,
      image: r.image_url as string,
      date: r.date as string,
      author: 'BasededadosAgro',
      views: Number(r.views) || 0,
    });
    if (!post || known.has(post.slug) || known.has(`t:${normTitle(post.title)}`)) continue;
    published.push(post);
  }
  return { published, known, base };
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

/** Documentos da base de dados agro que o site online também publica, mas que não são notícias (data/not-news.json). */
function notNewsSlugs(): Set<string> {
  try {
    const file = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'not-news.json'), 'utf-8')) as { slugs?: string[] };
    return new Set(file.slugs ?? []);
  } catch {
    return new Set();
  }
}

export const getAllPosts = cache(async (): Promise<{ posts: Post[]; source: 'supabase' | 'local' }> => {
  const remote = await fromSupabase();
  const excluded = notNewsSlugs();
  const local = fromLocalData().filter((p) => !excluded.has(p.slug));
  if (remote) remote.published = remote.published.filter((p) => !excluded.has(p.slug));
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
  // Artigos da Base que ainda não existem aqui (mesmo slug ou título = a mesma notícia).
  const have = new Set(posts.flatMap(localKey));
  posts.push(...remote.base.filter((p) => !localKey(p).some((k) => have.has(k))));
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
  const { posts, source } = await getAllPosts();
  const wanted = decodeURIComponent(slug);
  const post = posts.find((p) => p.slug === wanted) ?? null;
  if (!post || post.content || source !== 'supabase') return post;

  // A lista não traz o texto: vai buscar-se só o desta notícia (as do site online já o trazem do instantâneo local).
  const rows =
    post.origin === 'base'
      ? await querySupabase('noticias_base', `slug=eq.${encodeURIComponent(post.slug)}`, 'content', 1)
      : await querySupabase('news', `site_id=eq.${encodeURIComponent(SITE_ID)}&slug=eq.${encodeURIComponent(post.slug)}`, 'content', 1);
  const content = stripLeadingImage(cleanContent(String(rows?.[0]?.content || '')), !!post.image);
  if (!content) return post;
  const text = stripTags(content);
  return { ...post, content, excerpt: post.excerpt || (text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text) };
}

export async function getCategoryPosts(categorySlug: string) {
  const { posts } = await getAllPosts();
  return posts.filter((p) => p.categorySlug === categorySlug || p.extraCategories.some((c) => c.slug === categorySlug));
}

export async function getCategories(): Promise<Category[]> {
  const { posts } = await getAllPosts();
  const counts = new Map<string, number>();
  for (const p of posts) for (const slug of [p.categorySlug, ...p.extraCategories.map((c) => c.slug)]) counts.set(slug, (counts.get(slug) ?? 0) + 1);
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
/** Arquivo de notícias (/noticias): 12 por página, depois paginação. */
export const ARCHIVE_PAGE_SIZE = 12;

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
