import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendMail, mailConfigured } from '@/lib/mailer';
import { FEEDS, MAX_AGE_HOURS, fetchArticleContent, fetchFeed, guessCategory, isRelevantNews } from '@/lib/news-fetch';
import { slugify } from '@/lib/news-data';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const MAX_PER_RUN = 20;

const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Busca diária (à 1h da manhã, hora de Maputo) das notícias do dia sobre agricultura, clima e ambiente. Ficam na fila de
 * pendentes (estado `pending`), à espera de revisão no painel: nunca vão directas ao site. Mesmo sistema da Base de Dados Agro.
 * Chamada pelo agendador da Vercel com `Authorization: Bearer <CRON_SECRET>`. Com `?dry=1` só mostra o que encontraria, sem gravar.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const sent = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const ok = Boolean(secret) && sent.length === secret!.length && timingSafeEqual(Buffer.from(sent), Buffer.from(secret!));
  if (!ok) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const dry = req.nextUrl.searchParams.get('dry') === '1';

  try {
    const supabase = db();
    // Tudo o que já existe, em qualquer estado (também lixo e arquivo): o que foi apagado ou recusado não volta.
    const { data: existing, error: readError } = await supabase.from('news').select('slug,title').eq('site_id', SITE_ID);
    if (readError) throw new Error(readError.message);
    const knownSlugs = new Set((existing ?? []).map((r) => String(r.slug)));
    const knownTitles = new Set((existing ?? []).map((r) => norm(String(r.title ?? ''))));

    const cutoff = Date.now() - MAX_AGE_HOURS * 3600 * 1000;
    const candidates: Record<string, unknown>[] = [];
    const perFeed: Record<string, { found: number; kept: number }> = {};

    for (const feed of FEEDS) {
      let items;
      try {
        items = await fetchFeed(feed.url);
      } catch (err) {
        console.error(`[buscar-noticias] falha no feed "${feed.url}":`, err instanceof Error ? err.message : err);
        continue;
      }
      perFeed[feed.label] = { found: items.length, kept: 0 };
      for (const item of items) {
        if (candidates.length >= MAX_PER_RUN) break;
        if (!isRelevantNews(item.title)) continue;
        const ts = item.pubDate ? new Date(item.pubDate).getTime() : NaN;
        if (!isNaN(ts) && ts < cutoff) continue;
        const slug = slugify(item.title).slice(0, 120);
        const title = norm(item.title);
        if (!slug || knownSlugs.has(slug) || knownTitles.has(title)) continue;
        knownSlugs.add(slug);
        knownTitles.add(title);

        const { image, paragraphs } = await fetchArticleContent(item.link);
        const body = paragraphs.length > 0 ? paragraphs : item.description ? [item.description] : [];
        const first = body[0] || item.title;
        candidates.push({
          site_id: SITE_ID,
          title: item.title,
          slug,
          summary: first.length > 160 ? `${first.slice(0, 157).trimEnd()}…` : first,
          content: [...body.map((p) => `<p>${esc(p)}</p>`), `<p>Fonte: <a href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">${esc(feed.label)}</a></p>`].join('\n'),
          image_url: image,
          date: !isNaN(ts) ? new Date(ts).toISOString() : new Date().toISOString(),
          category: guessCategory(`${item.title} ${item.description}`),
          author_name: feed.label,
          status: 'pending',
        });
        perFeed[feed.label].kept++;
      }
    }

    if (dry) {
      return NextResponse.json({ dry: true, found: candidates.length, perFeed, titulos: candidates.map((c) => ({ titulo: c.title, categoria: c.category, fonte: c.author_name, imagem: Boolean(c.image_url) })) });
    }

    let inserted = 0;
    if (candidates.length > 0) {
      // Colunas que a tabela ainda possa não ter (ex.: author_name) vão caindo uma a uma, como ao gravar no painel.
      let rows: Record<string, unknown>[] = candidates;
      for (let i = 0; i < 4; i++) {
        const { data, error } = await supabase.from('news').insert(rows).select('id');
        if (!error) {
          inserted = data?.length ?? 0;
          break;
        }
        const column = /Could not find the '([^']+)' column/i.exec(error.message)?.[1];
        if (!column) throw new Error(error.message);
        rows = rows.map(({ [column]: _drop, ...rest }) => rest);
      }
    }

    // Aviso por e-mail aos responsáveis: há notícias à espera de revisão (falhar aqui não é grave).
    const to = process.env.NEWS_ALERT_TO || process.env.ADMIN_EMAIL;
    if (inserted > 0 && to && mailConfigured()) {
      const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://entrecamposblog.com').replace(/\/$/, '');
      try {
        await sendMail({
          to,
          subject: `${inserted} nova(s) notícia(s) à espera de revisão`,
          html: `<p>Foram encontradas <strong>${inserted}</strong> notícia(s) nova(s) sobre agricultura, clima e ambiente.</p><p>Reveja, edite o texto e publique em <a href="${site}/admin/noticias">Painel &rarr; Notícias</a> (estado pendente).</p>`,
          text: `Foram encontradas ${inserted} notícia(s) nova(s) sobre agricultura, clima e ambiente. Reveja e publique em ${site}/admin/noticias (estado pendente).`,
        });
      } catch (err) {
        console.error('[buscar-noticias] aviso por e-mail falhou (não crítico):', err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json({ found: candidates.length, inserted, perFeed });
  } catch (err) {
    console.error('[buscar-noticias] erro geral:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}
