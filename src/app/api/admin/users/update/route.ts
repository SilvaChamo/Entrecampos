import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isUuid } from '@/lib/api-guard';
import { hasPermission } from '@/lib/permissions';
import { getSiteUser, siteAccess, withSiteAccess } from '@/lib/site-accounts';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** Papéis que o painel pode atribuir (rótulos guardados em app_metadata.role). */
const ROLE_LABELS = ['Administrador', 'Editor', 'Contribuidor', 'Subscritor'];

export async function POST(req: NextRequest) {
  const guard = await requireAuth();
  if ('error' in guard) return guard.error;
  const { session } = guard;
  try {
    const { id, firstName, lastName, alcunha, displayNameType, role, approved, bio, website, avatarUrl, password, telefone, profissao, cargo } = await req.json();

    if (!id || !isUuid(String(id))) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    // Cada um edita o seu perfil; editar outros exige permissão.
    const isSelf = id === session.id;
    if (!isSelf && !hasPermission(session.role, 'editar_utilizadores')) {
      return NextResponse.json({ error: 'Não tem permissão para editar este utilizador.' }, { status: 403 });
    }
    // Só contas deste site podem ser editadas (as dos outros sites, no mesmo Supabase, respondem "não encontrado").
    const currentUser = await getSiteUser(supabaseAdmin, id);
    if (!currentUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }
    const current = { user: currentUser };
    const currentRole = siteAccess(currentUser)!.role;

    // Ninguém edita (nem muda a palavra-passe de) contas de nível igual ou superior ao seu; só o administrador edita administradores.
    const RANK: Record<string, number> = { Administrador: 3, Editor: 2, Contribuidor: 1, Subscritor: 0 };
    const callerRank = { admin: 3, editor: 2, contribuidor: 1, guest: 0 }[session.role] ?? 0;
    const targetRank = RANK[currentRole] ?? 0;
    if (!isSelf && (targetRank > callerRank || (targetRank === callerRank && session.role !== 'admin'))) {
      return NextResponse.json({ error: 'Não pode alterar um utilizador de nível igual ou superior ao seu.' }, { status: 403 });
    }
    const currentApproved = siteAccess(currentUser)!.approved;

    // Papel e aceitação só por quem gere permissões (nunca o próprio, para não se promover).
    // Reenviar o valor actual (formulário de perfil) não conta como alteração.
    if (role !== undefined && !ROLE_LABELS.includes(role)) {
      return NextResponse.json({ error: 'Papel inválido' }, { status: 400 });
    }
    const touchesAccess =
      (role !== undefined && role !== currentRole) || (approved !== undefined && (approved === true) !== currentApproved);
    if (touchesAccess && (isSelf || !hasPermission(session.role, 'gerir_permissoes'))) {
      return NextResponse.json({ error: 'Não tem permissão para alterar o papel ou a aceitação.' }, { status: 403 });
    }

    const updateData: any = {
      user_metadata: {
        full_name: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
        first_name: firstName,
        last_name: lastName,
        alcunha: alcunha || '',
        displayNameType: displayNameType || 'full_name',
        app: 'entrecampos',
        // Cópia só para mostrar na interface; o papel que vale está em app_metadata.
        role: (touchesAccess ? role : undefined) ?? currentRole,
        bio: bio,
        website: website,
        avatar_url: avatarUrl,
        telefone: telefone || '',
        profissao: profissao || '',
        cargo: cargo || ''
      }
    };
    if (touchesAccess) {
      updateData.app_metadata = withSiteAccess(currentUser, {
        ...(role !== undefined && role !== currentRole ? { role } : {}),
        ...(approved !== undefined ? { approved: approved === true } : {}),
      });
    }

    if (password) {
      // Mudar a palavra-passe de outra pessoa é uma acção de gestão de acessos.
      if (!isSelf && !hasPermission(session.role, 'gerir_permissoes')) {
        return NextResponse.json({ error: 'Não tem permissão para alterar a palavra-passe de outro utilizador.' }, { status: 403 });
      }
      if (String(password).length < 8) {
        return NextResponse.json({ error: 'A palavra-passe deve ter pelo menos 8 caracteres.' }, { status: 400 });
      }
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
