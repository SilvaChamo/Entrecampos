import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
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
        name: u.user_metadata?.full_name || `${u.user_metadata?.first_name || ''} ${u.user_metadata?.last_name || ''}`.trim() || '—',
        email: u.email || '',
        role: u.user_metadata?.role || 'Subscritor',
        alcunha: u.user_metadata?.alcunha || '',
        articles: 0,
        avatar: u.user_metadata?.avatar_url || null,
        isAdmin: u.user_metadata?.role === 'Administrador'
      }));

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
