import { NextRequest, NextResponse } from 'next/server';
import {
  cookieOptions,
  SESSION_COOKIE,
  signSession,
} from '@/lib/local-session';
import { translateAuthError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e palavra-passe são obrigatórios.' }, { status: 400 });
    }

    const mode = process.env.AUTH_MODE || process.env.NEXT_PUBLIC_AUTH_MODE || 'supabase';

    if (mode === 'local') {
      return NextResponse.json(
        { error: 'Modo local desactivado. Configure AUTH_MODE=supabase e as chaves do self-hosted.' },
        { status: 503 }
      );
    }

    // mode === supabase — autenticação via Supabase Auth (self-hosted / cloud)
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
    }

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json(
        { error: translateAuthError(error?.message || 'Credenciais inválidas') },
        { status: 401 }
      );
    }

    const meta = data.user.user_metadata || {};
    const roleRaw = String(meta.role || 'guest').toLowerCase();
    const role =
      roleRaw === 'administrador' || roleRaw === 'admin'
        ? 'admin'
        : roleRaw === 'editor'
          ? 'editor'
          : roleRaw === 'contribuidor' || roleRaw === 'actor'
            ? 'contribuidor'
            : 'guest';

    const name =
      meta.full_name ||
      [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() ||
      meta.username ||
      email.split('@')[0];

    const token = signSession({
      id: data.user.id,
      email: data.user.email || email,
      name,
      role,
    });

    const res = NextResponse.json({
      user: { id: data.user.id, email: data.user.email || email, name, role },
      access_token: data.session?.access_token,
    });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao autenticar';
    return NextResponse.json(
      { error: message.includes('fetch') ? 'Servidor de autenticação inacessível.' : message },
      { status: 503 }
    );
  }
}
