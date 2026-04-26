import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    // Get user ID from query params
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    // Get user by ID
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
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
      articles: 0
    };

    return NextResponse.json({ user: mappedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
