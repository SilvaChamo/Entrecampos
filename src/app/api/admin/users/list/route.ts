import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  const guard = await requireAuth('listar_utilizadores');
  if ('error' in guard) return guard.error;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map Supabase Auth users to our UserItem interface and filter by app
    const users = data.users
      .filter(u => 
        u.user_metadata?.app === 'entrecampos' || 
        u.email === 'silva.chamo@gmail.com' ||
        u.email === 'admin@ecamposmz.com'
      )
      .map(u => ({
        id: u.id,
        username: u.user_metadata?.username || u.email?.split('@')[0] || 'user',
        firstName: u.user_metadata?.first_name || '',
        lastName: u.user_metadata?.last_name || '',
        name: u.user_metadata?.first_name || '—',
        email: u.email || '',
        role: u.app_metadata?.role || 'Subscritor',
        approved: u.app_metadata?.approved === true,
        alcunha: u.user_metadata?.alcunha || '',
        displayNameType: u.user_metadata?.displayNameType || 'full_name',
        articles: 0,
        avatar: u.user_metadata?.avatar_url || null,
        isAdmin: u.app_metadata?.role === 'Administrador'
      }));

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
