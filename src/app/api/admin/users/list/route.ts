import { NextRequest, NextResponse } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';
import { siteAccess } from '@/lib/site-accounts';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  const guard = await requireAuth('listar_utilizadores');
  if ('error' in guard) return guard.error;
  try {
    // O Supabase Auth é partilhado por vários sites: só são listadas as contas deste (app_metadata.entrecampos).
    const all: User[] = [];
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      all.push(...data.users);
      if (data.users.length < 1000) break;
    }

    const users = all
      .filter((u) => siteAccess(u) !== null)
      .map(u => ({
        id: u.id,
        username: u.user_metadata?.username || u.email?.split('@')[0] || 'user',
        firstName: u.user_metadata?.first_name || '',
        lastName: u.user_metadata?.last_name || '',
        name: u.user_metadata?.first_name || '—',
        email: u.email || '',
        role: siteAccess(u)!.role,
        approved: siteAccess(u)!.approved,
        alcunha: u.user_metadata?.alcunha || '',
        displayNameType: u.user_metadata?.displayNameType || 'full_name',
        articles: 0,
        avatar: u.user_metadata?.avatar_url || null,
        isAdmin: siteAccess(u)!.role === 'Administrador'
      }));

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
