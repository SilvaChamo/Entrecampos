import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isUuid } from '@/lib/api-guard';
import { importarDoEmail, loadDefinicoes, saveDefinicoes } from '@/lib/importar-noticias';
import { mailAddress, mailConfigured } from '@/lib/redaccao-mail';
import { refreshSite } from '@/lib/refresh-site';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const PERMISSION = 'publicar_artigos';

/** Estado da importação: ligação ao e-mail, remetentes autorizados, opção de publicar sozinha e o que já foi importado. */
export async function GET() {
  const guard = await requireAuth(PERMISSION);
  if ('error' in guard) return guard.error;
  const d = await loadDefinicoes();
  return NextResponse.json({
    configurado: mailConfigured(),
    caixa: mailAddress(),
    remetentes: d.remetentes,
    autoPublicar: d.autoPublicar,
    ultimaVerificacao: d.ultimaVerificacao ?? null,
    ultimoErro: d.ultimoErro ?? null,
    historico: [...d.historico].reverse().slice(0, 60),
  });
}

/** Guarda os remetentes autorizados e a opção de publicar sozinha as notícias que trazem foto. */
export async function PUT(req: NextRequest) {
  const guard = await requireAuth(PERMISSION);
  if ('error' in guard) return guard.error;
  try {
    const body = (await req.json()) as { remetentes?: unknown; autoPublicar?: unknown };
    const d = await loadDefinicoes();
    if (body.remetentes !== undefined) {
      const lista = (Array.isArray(body.remetentes) ? body.remetentes : String(body.remetentes).split(/[\s,;]+/)).map((e) => String(e).trim().toLowerCase()).filter(Boolean);
      const mau = lista.find((e) => !EMAIL.test(e));
      if (mau) return NextResponse.json({ error: `"${mau}" não é um e-mail válido.` }, { status: 400 });
      d.remetentes = [...new Set(lista)].slice(0, 30);
    }
    if (typeof body.autoPublicar === 'boolean') d.autoPublicar = body.autoPublicar;
    await saveDefinicoes(d);
    return NextResponse.json({ ok: true, remetentes: d.remetentes, autoPublicar: d.autoPublicar });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível guardar.' }, { status: 500 });
  }
}

/** `acao: 'verificar'` importa já os e-mails novos; `acao: 'foto'` troca a foto sugerida de uma notícia pendente por outra das sugestões. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth(PERMISSION);
  if ('error' in guard) return guard.error;
  try {
    const body = (await req.json()) as { acao?: string; newsId?: string; url?: string };
    if (body.acao === 'verificar') {
      return NextResponse.json({ resultado: await importarDoEmail() });
    }
    if (body.acao === 'foto') {
      const id = String(body.newsId ?? '');
      const d = await loadDefinicoes();
      const reg = d.historico.find((h) => h.newsId === id);
      if (!isUuid(id) || !reg?.fotos?.includes(String(body.url))) return NextResponse.json({ error: 'Foto inválida.' }, { status: 400 });
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { error } = await db.from('news').update({ image_url: body.url }).eq('id', id).eq('site_id', SITE_ID);
      if (error) throw new Error(error.message);
      reg.fotos = [String(body.url), ...reg.fotos.filter((f) => f !== body.url)];
      await saveDefinicoes(d);
      refreshSite();
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Pedido desconhecido.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro.' }, { status: 500 });
  }
}
