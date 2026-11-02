import { NextRequest, NextResponse } from 'next/server';
import { cleanText, clientIp, guardForm, hashIp, isEmail, serverDb } from '@/lib/antispam';

/** Subscrição da newsletter. Um e-mail repetido conta como sucesso (não revela quem já está inscrito). */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const guard = await guardForm(req, body, 'newsletter');
    if (!guard.ok) return guard.silent ? NextResponse.json({ ok: true }) : NextResponse.json({ error: guard.error }, { status: guard.status });

    const email = cleanText(body.email, 254).toLowerCase();
    if (!isEmail(email)) return NextResponse.json({ error: 'Indique um e-mail válido.' }, { status: 400 });

    const { error } = await serverDb()
      .from('entrecampos_newsletter')
      .upsert({ email, ip_hash: hashIp(clientIp(req)) }, { onConflict: 'email', ignoreDuplicates: true });
    if (error) throw error;
    return NextResponse.json({ ok: true, message: 'Subscrição feita. Obrigado!' });
  } catch {
    return NextResponse.json({ error: 'Não foi possível subscrever. Tente mais tarde.' }, { status: 500 });
  }
}
