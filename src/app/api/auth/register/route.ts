import { NextRequest, NextResponse } from 'next/server';
import { cleanText, guardForm, isEmail, serverDb } from '@/lib/antispam';
import { roleToMetadata, translateAuthError } from '@/lib/auth';

/** Registo de conta: passa pelas protecções anti-spam no servidor antes de chegar ao Supabase Auth. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const guard = await guardForm(req, body, 'registo', { max: 5, windowMs: 30 * 60 * 1000 });
    if (!guard.ok) return guard.silent ? NextResponse.json({ ok: true }) : NextResponse.json({ error: guard.error }, { status: guard.status });

    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 254).toLowerCase();
    const password = String(body.password || '');
    // Registo livre: toda a conta nova é de visitante e entra logo (painel de visitante). Só o administrador
    // dá outros papéis, depois, no painel de utilizadores.
    const role = roleToMetadata('guest');

    if (!name || !isEmail(email) || password.length < 6 || password.length > 128) {
      return NextResponse.json({ error: 'Preencha o nome, um e-mail válido e uma palavra-passe com pelo menos 6 caracteres.' }, { status: 400 });
    }

    // A conta é criada AQUI, no servidor, depois de passar o anti-spam (a base recusa registos directos de contas
    // do EntreCAMPOS: ver sql/contas-entrecampos.sql).
    const { error } = await serverDb().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { entrecampos: { role: 'Subscritor', approved: true, via: 'servidor' } },
      user_metadata: { app: 'entrecampos', full_name: name, username: email.split('@')[0], role },
    });
    // Resposta igual com ou sem erro de "e-mail já existe": não revela que e-mails estão registados (a base é partilhada).
    if (error && !/already|registered|exists/i.test(error.message)) {
      return NextResponse.json({ error: translateAuthError(error.message) }, { status: 400 });
    }
    return NextResponse.json({ ok: true, message: 'Conta criada.' });
  } catch {
    return NextResponse.json({ error: 'Não foi possível criar a conta. Tente mais tarde.' }, { status: 500 });
  }
}
