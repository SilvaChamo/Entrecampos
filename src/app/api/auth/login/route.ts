import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions, SESSION_COOKIE, signSession } from '@/lib/local-session';
import { mapRole, translateAuthError } from '@/lib/auth';
import { verifyBootstrapAdmin } from '@/lib/bootstrap-admin';
import { clearAttempts, tooManyAttempts } from '@/lib/rate-limit';
import { siteAccess } from '@/lib/site-accounts';

function startSession(user: { id: string; email: string; name: string; role: 'admin' | 'editor' | 'contribuidor' | 'guest' }, extra: object = {}) {
  const res = NextResponse.json({ user, ...extra });
  res.cookies.set(SESSION_COOKIE, signSession(user), cookieOptions());
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Aceita e-mail ou nome de utilizador (ex.: "admin").
    const login = String(body.email ?? body.login ?? '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!login || !password) {
      return NextResponse.json({ error: 'Utilizador e palavra-passe são obrigatórios.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const throttleKey = `${ip}|${login}`;
    if (tooManyAttempts(throttleKey)) {
      return NextResponse.json({ error: 'Demasiadas tentativas. Aguarde alguns minutos e tente de novo.' }, { status: 429 });
    }

    // 1) Acesso de emergência do administrador (definido só por variáveis de ambiente).
    const bootstrap = verifyBootstrapAdmin(login, password);
    if (bootstrap) {
      clearAttempts(throttleKey);
      return startSession({ ...bootstrap, role: 'admin' });
    }

    // 2) Utilizadores do painel (Supabase Auth). Têm de ser e-mails.
    if (!login.includes('@')) {
      return NextResponse.json({ error: 'Utilizador ou palavra-passe incorrectos.' }, { status: 401 });
    }

    const mode = process.env.AUTH_MODE || process.env.NEXT_PUBLIC_AUTH_MODE || 'supabase';
    if (mode === 'local') {
      return NextResponse.json({ error: 'Utilizador ou palavra-passe incorrectos.' }, { status: 401 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
    }

    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await supabase.auth.signInWithPassword({ email: login, password });
    if (error || !data.user) {
      return NextResponse.json({ error: translateAuthError(error?.message || 'Credenciais inválidas') }, { status: 401 });
    }

    // Papel e aceitação vêm de app_metadata: só o painel/servidor (chave de serviço) os pode escrever.
    // user_metadata é editável pelo próprio utilizador e NUNCA decide permissões.
    // O Supabase Auth é partilhado com outros sites: só entram as contas deste (app_metadata.entrecampos) e já aceites.
    const access = siteAccess(data.user);
    const meta = data.user.user_metadata || {};
    if (!access) {
      return NextResponse.json({ error: 'Esta conta não tem acesso ao painel do EntreCAMPOS.' }, { status: 403 });
    }
    if (!access.approved) {
      return NextResponse.json(
        { error: 'A sua conta ainda não foi aceite pelo administrador. Aguarde a aprovação para entrar no painel.' },
        { status: 403 }
      );
    }

    const role = mapRole(access.role);
    const name =
      meta.full_name ||
      [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() ||
      meta.username ||
      login.split('@')[0];

    clearAttempts(throttleKey);
    return startSession(
      { id: data.user.id, email: data.user.email || login, name, role },
      { access_token: data.session?.access_token }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao autenticar';
    return NextResponse.json(
      { error: message.includes('fetch') ? 'Servidor de autenticação inacessível.' : 'Erro ao autenticar.' },
      { status: 503 }
    );
  }
}
