import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';
import { isForeignPath, isLocalHost } from '@/lib/site-hits';

export const dynamic = 'force-dynamic';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const PAGE = 1000;
const MAX_ROWS = 50000;
const RECENT_DAYS = 30;
const TZ = 'Africa/Maputo';

type Hit = { path: string; news_slug: string | null; visitor: string; country: string | null; device: string | null; referrer: string | null; created_at: string };

const dayOf = (iso: string | number | Date) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: TZ }); // AAAA-MM-DD
const top = <T extends string>(map: Map<T, number>, n = 10) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

/**
 * Estatísticas reais do EntreCampos (visitas registadas em `site_hits` deste site, sem páginas do painel nem de
 * desenvolvimento). `dias` define o gráfico dia a dia; páginas, notícias, países, dispositivos e origens são dos últimos 30 dias.
 * Só quem vê estatísticas (administrador).
 */
export async function GET(req: NextRequest) {
  const guard = await requireAuth('ver_estatisticas', 'acesso_total');
  if ('error' in guard) return guard.error;
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get('dias')) || 30, 1), 365);
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const since = new Date(Date.now() - days * 86400000).toISOString();
  const rows: Hit[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await supabase
      .from('site_hits')
      .select('path,news_slug,visitor,country,device,referrer,created_at')
      .eq('site_id', SITE_ID)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) {
      const missing = /site_hits|does not exist|schema cache/i.test(error.message);
      return NextResponse.json({ error: missing ? 'missing_sql' : error.message }, { status: missing ? 503 : 500 });
    }
    rows.push(...(data as Hit[]));
    if (!data || data.length < PAGE) break;
  }

  const hits = rows.filter((h) => !isForeignPath(h.path) && !(h.referrer && isLocalHost(h.referrer)));
  const today = dayOf(Date.now());
  const recentSince = Date.now() - RECENT_DAYS * 86400000;
  const fiveMin = Date.now() - 5 * 60000;

  const daily = new Map<string, { views: number; visitors: Set<string> }>();
  const slugs = new Map<string, number>();
  const countries = new Map<string, number>();
  const devices = new Map<string, number>();
  const referrers = new Map<string, number>();
  const online = new Set<string>();

  for (const h of hits) {
    const t = new Date(h.created_at).getTime();
    const d = dayOf(t);
    const day = daily.get(d) ?? { views: 0, visitors: new Set<string>() };
    day.views++;
    day.visitors.add(h.visitor);
    daily.set(d, day);
    if (t >= fiveMin) online.add(h.visitor);
    if (t < recentSince) continue;
    if (h.news_slug) slugs.set(h.news_slug, (slugs.get(h.news_slug) ?? 0) + 1);
    const c = h.country || '??';
    countries.set(c, (countries.get(c) ?? 0) + 1);
    const dv = h.device || 'desktop';
    devices.set(dv, (devices.get(dv) ?? 0) + 1);
    if (h.referrer) referrers.set(h.referrer, (referrers.get(h.referrer) ?? 0) + 1);
  }

  // Notícias mais lidas: o título vem da própria notícia.
  const topSlugs = top(slugs);
  const titles = new Map<string, string>();
  if (topSlugs.length) {
    const { data } = await supabase.from('news').select('slug,title').eq('site_id', SITE_ID).in('slug', topSlugs.map(([s]) => s));
    for (const n of (data ?? []) as { slug: string; title: string }[]) titles.set(n.slug, n.title);
  }

  return NextResponse.json({
    online: online.size,
    today,
    daily: [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, views: v.views, visitors: v.visitors.size })),
    news: topSlugs.map(([slug, views]) => ({ slug, title: titles.get(slug) || slug, views })),
    countries: top(countries).map(([country, views]) => ({ country, views })),
    devices: top(devices).map(([device, views]) => ({ device, views })),
    referrers: top(referrers).map(([referrer, views]) => ({ referrer, views })),
  });
}
