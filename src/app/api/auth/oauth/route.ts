import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookieOptions, SESSION_COOKIE, signSession } from '@/lib/local-session';
import { mapRole } from '@/lib/auth';
import { clientIp, serverDb } from '@/lib/antispam';
import { tooManyAttempts } from '@/lib/rate-limit';
import { siteAccess, withSiteAccess } from '@/lib/site-accounts';

/**
 * Entrada com Google (o Supabase trata do OAuth). Recebe o token da sessão do Supabase, confirma-o no servidor e
 * abre a sessão do EntreCAMPOS. Registo livre: quem ainda não tem conta aqui fica como visitante, com entrada imediata.
 * Quem já tem outro papel mantém-no; contas suspensas (approved=false) não entram.
 */
export async function POST(req: NextRequest) {
  try {
    if (tooManyAttempts(`oauth|${clientIp(req)}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Demasiadas tentativas. Aguarde alguns minutos.' }, { status: 429 });
    }
    const { access_token } = (await req.json()) as { access_token?: string };
    if (!access_token || typeof access_token !== 'string') return NextResponse.json({ error: 'Sessão inválida.' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const anon = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await anon.auth.getUser(access_token);
    let user = data?.user;
    const email = user?.email;
    if (error || !user || !email) return NextResponse.json({ error: 'Não foi possível confirmar a conta.' }, { status: 401 });
    if (!user.email_confirmed_at) return NextResponse.json({ error: 'O e-mail da conta ainda não está confirmado.' }, { status: 403 });

    let access = siteAccess(user);
    if (!access) {
      const { data: updated, error: updateError } = await serverDb().auth.admin.updateUserById(user.id, {
        app_metadata: withSiteAccess(user, { role: 'Subscritor', approved: true }),
      });
      if (updateError || !updated.user) return NextResponse.json({ error: 'Não foi possível criar o acesso.' }, { status: 500 });
      user = updated.user;
      access = siteAccess(user);
    }
    if (!access?.approved) return NextResponse.json({ error: 'Esta conta está suspensa no EntreCAMPOS.' }, { status: 403 });

    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || email.split('@')[0];
    const payload = { id: user.id, email, name: String(name), role: mapRole(access.role) };
    const res = NextResponse.json({ user: payload });
    res.cookies.set(SESSION_COOKIE, signSession(payload), cookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: 'Erro ao entrar.' }, { status: 500 });
  }
}
