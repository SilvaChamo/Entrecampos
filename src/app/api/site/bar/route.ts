import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { SESSION_COOKIE, verifySession } from '@/lib/local-session';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** Dados da barra verde do site: quem está ligado, o que pode fazer e quantas notícias estão pendentes. */
export async function GET() {
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ loggedIn: false });

  const canCreate = hasPermission(session.role, 'criar_artigos');
  const canReview = hasPermission(session.role, 'rever_artigos') || hasPermission(session.role, 'publicar_artigos');

  let pending = 0;
  if (canReview) {
    try {
      const { count } = await supabaseAdmin
        .from('news')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', SITE_ID)
        .ilike('status', 'pending');
      pending = count ?? 0;
    } catch {
      /* sem contagem: mostra o botão sem número */
    }
  }

  return NextResponse.json({ loggedIn: true, name: session.name, canCreate, canReview, pending });
}
