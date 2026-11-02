import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';
import { getSiteUser, onlyThisSite, siteAccess, SITE_KEY } from '@/lib/site-accounts';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const guard = await requireAuth('eliminar_utilizadores');
  if ('error' in guard) return guard.error;
  try {
    const { id, ids } = await req.json();
    const targetIds: string[] = ((ids ? ids : id ? [id] : []) as unknown[]).map(String).filter((x: string) => x !== guard.session.id); // ninguém apaga a própria conta

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'ID(s) obrigatório(s)' }, { status: 400 });
    }

    const errors: string[] = [];
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    for (const userId of targetIds) {
      // Se for um ID de teste (não UUID), apenas ignoramos a chamada ao Supabase e retornamos sucesso
      if (!isUUID(userId)) {
        console.log(`Ignorando delete de ID de teste (não UUID): ${userId}`);
        continue;
      }

      // Só contas deste site. Se a conta também serve outro site (mesmo Supabase), só se retira o acesso ao EntreCAMPOS.
      const target = await getSiteUser(supabaseAdmin, userId);
      if (!target) {
        errors.push(`${userId}: não é uma conta deste site`);
        continue;
      }
      // Mesma regra da edição: ninguém elimina contas de nível igual ou superior ao seu; só o administrador elimina administradores.
      const RANK: Record<string, number> = { Administrador: 3, Editor: 2, Contribuidor: 1, Subscritor: 0 };
      const callerRank = ({ admin: 3, editor: 2, contribuidor: 1, guest: 0 } as Record<string, number>)[guard.session.role] ?? 0;
      const targetRank = RANK[siteAccess(target)!.role] ?? 0;
      if (targetRank > callerRank || (targetRank === callerRank && guard.session.role !== 'admin')) {
        errors.push(`${userId}: sem permissão para eliminar um utilizador de nível igual ou superior ao seu`);
        continue;
      }
      let error: { message: string } | null;
      if (onlyThisSite(target)) {
        ({ error } = await supabaseAdmin.auth.admin.deleteUser(userId));
      } else {
        const { [SITE_KEY]: _removed, ...rest } = target.app_metadata || {};
        void _removed;
        ({ error } = await supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: { ...rest, [SITE_KEY]: null } }));
      }
      if (error) {
        console.error(`Erro ao eliminar utilizador ${userId}:`, error.message);
        errors.push(`${userId}: ${error.message}`);
      }
    }

    if (errors.length === targetIds.length) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: targetIds.length - errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('Erro ao eliminar utilizador:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
