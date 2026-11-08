import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isUuid } from '@/lib/api-guard';
import { mailAddress, mailConfigured } from '@/lib/redaccao-mail';
import { loadEmailLog, loadEmailSettings, processMailbox, publishDue, saveEmailSettings } from '@/lib/noticias-email';
import { refreshSite } from '@/lib/refresh-site';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const PERMISSION = 'publicar_artigos';

export async function GET() {
  const guard = await requireAuth(PERMISSION);
  if ('error' in guard) return guard.error;
  const [settings, log] = await Promise.all([loadEmailSettings(), loadEmailLog()]);
  return NextResponse.json({ configured: mailConfigured(), address: mailAddress(), authserv: Boolean((process.env.IMAP_AUTHSERV_ID || '').trim()), settings, entries: log.entries });
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(PERMISSION);
  if ('error' in guard) return guard.error;
  try {
    const body = (await req.json()) as { action?: string; senders?: unknown; requireVerified?: unknown; share?: unknown; newsId?: string; url?: string };
    if (body.action === 'verificar') {
      const result = await processMailbox(3);
      return NextResponse.json({ result, agendadas: await publishDue() });
    }
    // Troca a foto sugerida de uma notícia pendente por outra das sugestões registadas para ela.
    if (body.action === 'foto') {
      const id = String(body.newsId ?? '');
      const url = String(body.url ?? '');
      const log = await loadEmailLog();
      const item = log.entries.flatMap((e) => e.items).find((i) => i.id === id);
      if (!isUuid(id) || !item?.photos?.includes(url)) return NextResponse.json({ error: 'Foto inválida.' }, { status: 400 });
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { error } = await db.from('news').update({ image_url: url }).eq('id', id).eq('site_id', SITE_ID);
      if (error) throw new Error(error.message);
      refreshSite();
      return NextResponse.json({ ok: true });
    }
    const settings = await saveEmailSettings({
      ...(Array.isArray(body.senders) ? { senders: body.senders as string[] } : {}),
      ...(typeof body.requireVerified === 'boolean' ? { requireVerified: body.requireVerified } : {}),
      ...(typeof body.share === 'boolean' ? { share: body.share } : {}),
    });
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}
