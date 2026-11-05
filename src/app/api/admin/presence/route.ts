import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';

/**
 * Sinal de vida do painel: regrava um ficheiro minúsculo por sessão (`partilhado/_presence/<id>`); a hora da
 * última gravação diz quem está logado agora. Serve também a conta de arranque, que não existe no Supabase Auth.
 */
export async function POST() {
  const guard = await requireAuth();
  if ('error' in guard) return guard.error;
  try {
    const id = guard.session.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const { error } = await supabaseAdmin.storage
      .from(BUCKET())
      .upload(`partilhado/_presence/${id}`, new Blob([new Date().toISOString()], { type: 'text/plain' }), { upsert: true, contentType: 'text/plain' });
    return NextResponse.json({ ok: !error });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
