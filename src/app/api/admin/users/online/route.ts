import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

/** O painel envia um sinal de vida de 2 em 2 minutos (/api/admin/presence): "logado agora" = sinal nos últimos 5 minutos. */
const WINDOW_MS = 5 * 60 * 1000;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';

export async function GET() {
  const guard = await requireAuth('listar_utilizadores');
  if ('error' in guard) return guard.error;
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET()).list('partilhado/_presence', { limit: 1000 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const since = Date.now() - WINDOW_MS;
    const count = (data ?? []).filter((f) => f.id && new Date(f.updated_at ?? f.created_at ?? 0).getTime() >= since).length;
    return NextResponse.json({ count });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao contar utilizadores.' }, { status: 500 });
  }
}
