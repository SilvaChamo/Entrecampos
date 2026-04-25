import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, firstName, lastName, alcunha, role, website, avatarUrl } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        app: 'entrecampos',
        username,
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        alcunha: alcunha || '',
        role: role,
        website,
        avatar_url: avatarUrl
      }
    });

    if (error) {
      console.error('Erro ao criar utilizador:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
