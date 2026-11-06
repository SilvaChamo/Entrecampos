import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { tooManyAttempts } from '@/lib/rate-limit';
import { isForeignPath, isLocalHost } from '@/lib/site-hits';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|go-http/i;

const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

function deviceOf(ua: string) {
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Regista uma visita. É chamada pelo navegador (as páginas estão em cache, por isso a contagem não pode ser no servidor).
 * Sem cookies nem dados pessoais: o visitante é um hash diário de IP + navegador.
 */
export async function POST(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'x';
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });
  if (tooManyAttempts(`hit:${ip}`, 120, 60 * 60 * 1000)) return new NextResponse(null, { status: 204 });

  const body = (await req.json().catch(() => null)) as { path?: string; slug?: string; ref?: string } | null;
  const path = typeof body?.path === 'string' ? body.path.split('?')[0].slice(0, 200) : '';
  if (!path.startsWith('/') || isForeignPath(path) || isLocalHost(req.headers.get('host') || '')) return new NextResponse(null, { status: 204 });

  const slug = typeof body?.slug === 'string' && /^[a-z0-9-]{1,200}$/i.test(body.slug) ? body.slug : null;
  let referrer: string | null = null;
  try {
    const host = body?.ref ? new URL(body.ref).hostname.replace(/^www\./, '') : '';
    const own = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://entrecamposblog.com').hostname.replace(/^www\./, '');
    referrer = host && host !== own ? host.slice(0, 80) : null;
  } catch { /* referência inválida: ignora */ }

  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash('sha256').update(`${ip}|${ua}|${day}|${process.env.AUTH_SECRET || ''}`).digest('hex').slice(0, 32);
  const country = (req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '').toUpperCase().slice(0, 2) || null;

  try {
    const supabase = db();
    let firstReadToday = false;
    if (slug) {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await supabase.from('site_hits').select('id', { count: 'exact', head: true })
        .eq('site_id', SITE_ID).eq('visitor', visitor).eq('news_slug', slug).gte('created_at', since);
      firstReadToday = (count ?? 0) === 0;
    }
    const { error } = await supabase.from('site_hits').insert({ site_id: SITE_ID, path, news_slug: slug, visitor, country, device: deviceOf(ua), referrer });
    if (error) console.warn('[stats] não gravou a visita (falta correr sql/estatisticas.sql?):', error.message);
    if (!error && firstReadToday && slug) {
      const { error: rpcError } = await supabase.rpc('increment_news_views', { p_slug: slug, p_site: SITE_ID });
      if (rpcError) console.warn('[stats] não somou a leitura:', rpcError.message);
    }
  } catch (err) {
    console.warn('[stats] erro:', err instanceof Error ? err.message : err);
  }
  return new NextResponse(null, { status: 204 });
}
