import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';

/** Estatísticas reais do site (visitas registadas em `site_hits`). Só quem vê estatísticas (administrador). */
export async function GET(req: NextRequest) {
  const guard = await requireAuth('ver_estatisticas', 'acesso_total');
  if ('error' in guard) return guard.error;
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get('dias')) || 30, 1), 365);
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc('site_stats', { p_site: SITE_ID, p_days: days });
  if (error) {
    const missing = /site_stats|site_hits|does not exist|schema cache/i.test(error.message);
    return NextResponse.json({ error: missing ? 'missing_sql' : error.message }, { status: missing ? 503 : 500 });
  }
  return NextResponse.json(data);
}
