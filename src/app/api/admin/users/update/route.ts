import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { id, firstName, lastName, alcunha, displayNameType, role, bio, website, avatarUrl, password } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    const updateData: any = {
      user_metadata: {
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        alcunha: alcunha || '',
        displayNameType: displayNameType || 'full_name',
        app: 'entrecampos',
        role: role,
        bio: bio,
        website: website,
        avatar_url: avatarUrl
      }
    };

    if (password) {
      updateData.password = password;
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);

    if (error) {
      console.error('Erro ao atualizar utilizador:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
