import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';
import { findSiteUserByEmail } from '@/lib/site-accounts';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  const guard = await requireAuth('editar_utilizadores');
  if ('error' in guard) return guard.error;
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    // Só contas deste site; para as outras não se faz nada (e a resposta é a mesma).
    const target = await findSiteUserByEmail(supabaseAdmin, String(email));
    if (target) {
      const { error } = await supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email: target.email! });
      if (error) console.error('Erro ao gerar link de recuperação:', error.message);
    }

    // Resposta genérica: não revela se o e-mail existe.
    return NextResponse.json({ success: true, message: `Se o e-mail existir, foi enviada a recuperação para ${email}` });
  } catch {
    return NextResponse.json({ error: 'Erro ao processar o pedido' }, { status: 500 });
  }
}
