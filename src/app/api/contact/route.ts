import { NextRequest, NextResponse } from 'next/server';
import { cleanText, clientIp, guardForm, hashIp, isEmail, serverDb, tooManyLinks } from '@/lib/antispam';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';

/** Mensagem do formulário de contactos: protegida contra spam e guardada para o painel. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const guard = await guardForm(req, body, 'contacto');
    if (!guard.ok) return guard.silent ? NextResponse.json({ ok: true }) : NextResponse.json({ error: guard.error }, { status: guard.status });

    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 254).toLowerCase();
    const subject = cleanText(body.subject, 150);
    const message = cleanText(body.message, 4000);
    if (!name || !isEmail(email) || message.length < 5) {
      return NextResponse.json({ error: 'Preencha o nome, um e-mail válido e a mensagem.' }, { status: 400 });
    }
    if (tooManyLinks(message, 3)) return NextResponse.json({ error: 'A mensagem tem demasiadas ligações.' }, { status: 400 });

    const { error } = await serverDb().from('contact_messages').insert({
      site_id: SITE_ID,
      name,
      email,
      subject: subject || null,
      message,
      ip_hash: hashIp(clientIp(req)),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, message: 'Mensagem enviada. Obrigado pelo contacto!' });
  } catch {
    return NextResponse.json({ error: 'Não foi possível enviar a mensagem. Tente mais tarde.' }, { status: 500 });
  }
}
