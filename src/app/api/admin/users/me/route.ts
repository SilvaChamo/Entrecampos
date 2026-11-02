import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isUuid } from '@/lib/api-guard';
import { getSiteUser, siteAccess } from '@/lib/site-accounts';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** Perfil do utilizador autenticado. O utilizador vem sempre da sessão (cookie), nunca de parâmetros do pedido. */
export async function GET() {
  const guard = await requireAuth();
  if ('error' in guard) return guard.error;
  const { session } = guard;

  try {
    // Acesso de emergência (sem conta no Supabase): perfil mínimo.
    if (!isUuid(session.id)) {
      return NextResponse.json({
        user: {
          id: session.id,
          username: session.email.split('@')[0],
          firstName: session.name,
          lastName: '',
          email: session.email,
          role: 'Administrador',
          alcunha: '',
          displayNameType: 'full_name',
          bio: '',
          website: '',
          avatar: null,
          isAdmin: true,
          articles: 0,
          telefone: '',
          profissao: '',
          cargo: '',
        },
      });
    }

    const user = await getSiteUser(supabaseAdmin, session.id);
    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.email?.split('@')[0] || 'user',
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        role: siteAccess(user)!.role,
        alcunha: user.user_metadata?.alcunha || '',
        displayNameType: user.user_metadata?.displayNameType || 'full_name',
        bio: user.user_metadata?.bio || '',
        website: user.user_metadata?.website || '',
        avatar: user.user_metadata?.avatar_url || null,
        isAdmin: siteAccess(user)!.role === 'Administrador',
        articles: 0,
        telefone: user.user_metadata?.telefone || '',
        profissao: user.user_metadata?.profissao || '',
        cargo: user.user_metadata?.cargo || '',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao obter o perfil' }, { status: 500 });
  }
}
