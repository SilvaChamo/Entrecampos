import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { serverDb } from '@/lib/antispam';
import { revalidateTag } from 'next/cache';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const STATUSES = ['pending', 'approved', 'spam', 'trash'] as const;
const PERMISSIONS = ['rever_artigos', 'publicar_artigos'];

/** Lista de comentários para moderação (com e-mail, que o público nunca vê) e contagem por estado. */
export async function GET(req: NextRequest) {
  const guard = await requireAuth(...PERMISSIONS);
  if ('error' in guard) return guard.error;
  try {
    const status = req.nextUrl.searchParams.get('status') || 'pending';
    const db = serverDb();
    let query = db.from('comments').select('id,news_slug,name,email,website,content,status,created_at').eq('site_id', SITE_ID).order('created_at', { ascending: false }).limit(300);
    if ((STATUSES as readonly string[]).includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const s of STATUSES) {
      const { count } = await db.from('comments').select('id', { count: 'exact', head: true }).eq('site_id', SITE_ID).eq('status', s);
      counts[s] = count ?? 0;
    }
    return NextResponse.json({ items: data ?? [], counts });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao ler os comentários.' }, { status: 500 });
  }
}

/** Aprovar / rejeitar / marcar como spam / enviar para o lixo (`status`) ou eliminar de vez (`action: "delete"`). */
export async function POST(req: NextRequest) {
  const guard = await requireAuth(...PERMISSIONS);
  if ('error' in guard) return guard.error;
  try {
    const { ids, status, action } = (await req.json()) as { ids?: unknown[]; status?: string; action?: string };
    const list = (Array.isArray(ids) ? ids : []).map(String).slice(0, 200);
    if (list.length === 0) return NextResponse.json({ error: 'Nenhum comentário indicado.' }, { status: 400 });

    const db = serverDb();
    if (action === 'delete') {
      const { error } = await db.from('comments').delete().eq('site_id', SITE_ID).eq('status', 'trash').in('id', list);
      if (error) throw error;
    } else {
      if (!status || !(STATUSES as readonly string[]).includes(status)) return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
      const { error } = await db.from('comments').update({ status }).eq('site_id', SITE_ID).in('id', list);
      if (error) throw error;
    }
    try {
      revalidateTag('comments', 'max');
    } catch {
      /* a lista pública atualiza-se sozinha em 30 s */
    }
    return NextResponse.json({ ok: true, updated: list.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao atualizar.' }, { status: 500 });
  }
}
