import { NextRequest, NextResponse } from 'next/server';
import { cleanText, guardForm, isEmail, serverDb } from '@/lib/antispam';
import { findSiteUserByEmail } from '@/lib/site-accounts';
import { mailConfigured, recoveryEmail, sendMail } from '@/lib/mailer';

/**
 * Endereços em que o site responde. A ligação do e-mail NUNCA se monta com o cabeçalho Host do pedido (podia ser
 * forjado para enviar o token da vítima a um site falso): só com um destes. Configurável em SITE_ORIGINS
 * (lista separada por vírgulas; o primeiro é o principal).
 */
const SITE_ORIGINS = (process.env.SITE_ORIGINS || 'https://entrecamposblog.com,https://www.entrecamposblog.com,http://localhost:3004,http://localhost:3005')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

function trustedOrigin(requestOrigin: string) {
  return SITE_ORIGINS.includes(requestOrigin) ? requestOrigin : SITE_ORIGINS[0];
}

/**
 * Recuperação de palavra-passe. O e-mail é enviado AQUI (SMTP próprio, modelo do EntreCAMPOS) e a ligação abre uma
 * página do EntreCAMPOS: não passa pelo e-mail partilhado do Supabase. Só contas deste site; a resposta é sempre a
 * mesma, exista ou não a conta, para não revelar que e-mails estão registados.
 */
export async function POST(req: NextRequest) {
  const same = NextResponse.json({ ok: true, message: 'Se o e-mail estiver registado, receberá uma ligação para criar nova palavra-passe.' });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const guard = await guardForm(req, body, 'recuperar', { max: 4, windowMs: 30 * 60 * 1000 });
    if (!guard.ok) return guard.silent ? same : NextResponse.json({ error: guard.error }, { status: guard.status });

    const email = cleanText(body.email, 254).toLowerCase();
    if (!isEmail(email)) return NextResponse.json({ error: 'Indique um e-mail válido.' }, { status: 400 });

    const db = serverDb();
    const user = await findSiteUserByEmail(db, email);
    if (user?.email && mailConfigured()) {
      const { data, error } = await db.auth.admin.generateLink({ type: 'recovery', email: user.email });
      const token = data?.properties?.hashed_token;
      if (!error && token) {
        const link = `${trustedOrigin(req.nextUrl.origin)}/recuperar-senha/nova?token=${encodeURIComponent(token)}`;
        const mail = recoveryEmail(link);
        await sendMail({ to: user.email, ...mail }).catch((e) => console.error('[recuperar] falha ao enviar e-mail:', e instanceof Error ? e.message : e));
      }
    }
    return same;
  } catch {
    return same;
  }
}
