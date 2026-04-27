import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    // Get user ID or email from query params
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    const email = searchParams.get('email');
    
    let user = null;
    let error = null;
    
    if (userId && userId.includes('-')) {
      // Valid UUID - get by ID
      const result = await supabaseAdmin.auth.admin.getUserById(userId);
      user = result.data.user;
      error = result.error;
    } else if (email) {
      // Get by email - fetch all and filter
      console.log('[API /users/me] Buscando usuário por email:', email);
      const { data: { users: allUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error('[API /users/me] Erro ao listar usuários:', listError);
        error = listError;
      } else if (allUsers) {
        console.log('[API /users/me] Total de usuários no sistema:', allUsers.length);
        user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
        if (user) {
          console.log('[API /users/me] Usuário encontrado:', user.email, 'ID:', user.id);
          console.log('[API /users/me] Avatar URL:', user.user_metadata?.avatar_url);
        } else {
          console.log('[API /users/me] Usuário não encontrado. Emails disponíveis:', allUsers.map(u => u.email));
        }
      }
    }
    
    if (error || !user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const mappedUser = {
      id: user.id,
      username: user.email?.split('@')[0] || 'user',
      firstName: user.user_metadata?.first_name || '',
      lastName: user.user_metadata?.last_name || '',
      email: user.email || '',
      role: user.user_metadata?.role || 'Subscritor',
      alcunha: user.user_metadata?.alcunha || '',
      displayNameType: user.user_metadata?.displayNameType || 'full_name',
      bio: user.user_metadata?.bio || '',
      website: user.user_metadata?.website || '',
      avatar: user.user_metadata?.avatar_url || null,
      isAdmin: user.user_metadata?.role === 'Administrador',
      articles: 0,
      telefone: user.user_metadata?.telefone || '',
      profissao: user.user_metadata?.profissao || '',
      cargo: user.user_metadata?.cargo || ''
    };

    return NextResponse.json({ user: mappedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
