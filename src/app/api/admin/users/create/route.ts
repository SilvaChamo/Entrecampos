import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isUuid } from '@/lib/api-guard';
import { hasPermission } from '@/lib/permissions';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** Papéis que o painel pode atribuir (rótulos guardados em app_metadata.role). */
const ROLE_LABELS = ['Administrador', 'Editor', 'Contribuidor', 'Subscritor'];

export async function POST(req: NextRequest) {
  const guard = await requireAuth('criar_utilizadores');
  if ('error' in guard) return guard.error;
  try {
    const { username, email, password, firstName, lastName, alcunha, displayNameType, role, website, avatarUrl, telefone, profissao, cargo } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });
    }
    const roleLabel = ROLE_LABELS.includes(role) ? role : 'Subscritor';
    // Só quem gere permissões atribui papéis com acesso ao painel.
    if (roleLabel !== 'Subscritor' && !hasPermission(guard.session.role, 'gerir_permissoes')) {
      return NextResponse.json({ error: 'Não tem permissão para atribuir este papel.' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      // app_metadata só é escrito por aqui (chave de serviço): decide o papel e a aceitação.
      app_metadata: { entrecampos: { role: roleLabel, approved: true, via: 'servidor' } },
      user_metadata: {
        app: 'entrecampos',
        username,
        full_name: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
        first_name: firstName,
        last_name: lastName,
        alcunha: alcunha || '',
        displayNameType: displayNameType || 'full_name',
        role: roleLabel,
        website,
        avatar_url: avatarUrl,
        telefone: telefone || '',
        profissao: profissao || '',
        cargo: cargo || ''
      }
    });

    if (error) {
      console.error('Erro ao criar utilizador:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: { id: data.user.id, email: data.user.email } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
