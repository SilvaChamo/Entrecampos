import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isUuid } from '@/lib/api-guard';
import { hasPermission } from '@/lib/permissions';
import { getSiteUser, siteAccess } from '@/lib/site-accounts';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAuth();
  if ('error' in guard) return guard.error;
  try {
    const { id } = await params;
    // Cada um vê o seu perfil; ver outros exige permissão de listar utilizadores.
    if (id !== guard.session.id && !hasPermission(guard.session.role, 'listar_utilizadores')) {
      return NextResponse.json({ error: 'Não tem permissão para ver este utilizador.' }, { status: 403 });
    }
    if (!isUuid(id)) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Só contas deste site: as dos outros sites respondem como se não existissem.
    const user = await getSiteUser(supabaseAdmin, id);
    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const mappedUser = {
      id: user.id,
      username: user.email?.split('@')[0] || 'user',
      firstName: user.user_metadata?.first_name || '',
      lastName: user.user_metadata?.last_name || '',
      email: user.email || '',
      role: siteAccess(user)!.role,
      colunista: siteAccess(user)!.colunista === true,
      editor: siteAccess(user)!.editor === true,
      alcunha: user.user_metadata?.alcunha || '',
      displayNameType: user.user_metadata?.displayNameType || 'full_name',
      bio: user.user_metadata?.bio || '',
      website: user.user_metadata?.website || '',
      avatar: user.user_metadata?.avatar_url || null,
      isAdmin: siteAccess(user)!.role === 'Administrador',
      telefone: user.user_metadata?.telefone || '',
      profissao: user.user_metadata?.profissao || '',
      cargo: user.user_metadata?.cargo || '',
      facebook: user.user_metadata?.facebook || '',
      instagram: user.user_metadata?.instagram || '',
      linkedin: user.user_metadata?.linkedin || '',
      x: user.user_metadata?.x || ''
    };

    return NextResponse.json({ user: mappedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
