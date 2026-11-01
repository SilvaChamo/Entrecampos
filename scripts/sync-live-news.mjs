// Copia as notícias publicadas no site online (WordPress) para data/live-posts.json.
// Serve de fallback local quando o Supabase não responde. Uso: node scripts/sync-live-news.mjs
import fs from 'node:fs';
import path from 'node:path';

const SITE = process.env.LIVE_SITE_URL || 'https://entrecamposblog.com';
const OUT = path.join(process.cwd(), 'data', 'live-posts.json');

async function fetchPage(page) {
  const url = `${SITE}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=wp:featuredmedia,wp:term,author`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(60000) });
  if (res.status === 400) return { rows: [], pages: page - 1 }; // página além do fim
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return { rows: await res.json(), pages: Number(res.headers.get('x-wp-totalpages') || 1) };
}

// Documentos da base de dados agro que o site online também publica: não são notícias (data/not-news.json).
const NOT_NEWS = new Set(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'not-news.json'), 'utf-8')).slugs);

const posts = [];
for (let page = 1; ; page++) {
  const { rows, pages } = await fetchPage(page);
  for (const p of rows) {
    if (NOT_NEWS.has(p.slug)) continue;
    const media = p._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const og = p.yoast_head_json?.og_image?.[0]?.url;
    const category = p._embedded?.['wp:term']?.[0]?.[0]?.name || 'Sem categoria';
    posts.push({
      slug: p.slug,
      title: p.title.rendered,
      excerpt: p.excerpt.rendered,
      content: p.content.rendered,
      date: p.date_gmt ? `${p.date_gmt}Z` : p.date,
      author: p._embedded?.author?.[0]?.name || 'admin',
      category,
      image: media || og || '',
      link: p.link,
    });
  }
  if (page >= pages || rows.length === 0) break;
}

fs.writeFileSync(OUT, JSON.stringify(posts, null, 1));
console.log(`${posts.length} notícias guardadas em ${path.relative(process.cwd(), OUT)}`);
console.log(`com imagem: ${posts.filter((p) => p.image).length}`);

// Páginas públicas do site online (só as que o site mostra aos leitores) → data/live-pages.json
const PAGE_SLUGS = ['contactos'];
const pages = [];
for (const slug of PAGE_SLUGS) {
  const res = await fetch(`${SITE}/wp-json/wp/v2/pages?slug=${slug}&_fields=slug,title,content`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) continue;
  const [page] = await res.json();
  if (page) pages.push({ slug: page.slug, title: page.title.rendered, content: page.content.rendered });
}
fs.writeFileSync(path.join(process.cwd(), 'data', 'live-pages.json'), JSON.stringify(pages, null, 1));
console.log(`${pages.length} páginas guardadas em data/live-pages.json`);
