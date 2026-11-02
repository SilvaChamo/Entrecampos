import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clientIp, serverDb } from '@/lib/antispam';
import { tooManyAttempts } from '@/lib/rate-limit';
import { isSiteAccount } from '@/lib/site-accounts';

/** Segundo passo da recuperação: valida a ligação (token de uso único) e grava a nova palavra-passe. */
export async function POST(req: NextRequest) {
  try {
    if (tooManyAttempts(`recuperar-confirmar|${clientIp(req)}`, 10, 30 * 60 * 1000)) {
      return NextResponse.json({ error: 'Demasiadas tentativas. Aguarde alguns minutos.' }, { status: 429 });
    }
    const { token, password } = (await req.json()) as { token?: string; password?: string };
    if (!token || typeof token !== 'string' || token.length > 300) return NextResponse.json({ error: 'Ligação inválida.' }, { status: 400 });
    if (!password || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'A palavra-passe deve ter pelo menos 8 caracteres.' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const anon = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await anon.auth.verifyOtp({ token_hash: token, type: 'recovery' });
    const user = data?.user;
    if (error || !user || !isSiteAccount(user)) {
      return NextResponse.json({ error: 'Esta ligação já não é válida. Peça uma nova.' }, { status: 400 });
    }

    const { error: updateError } = await serverDb().auth.admin.updateUserById(user.id, { password });
    if (updateError) return NextResponse.json({ error: 'Não foi possível guardar a palavra-passe.' }, { status: 500 });
    return NextResponse.json({ ok: true, message: 'Palavra-passe alterada. Já pode entrar.' });
  } catch {
    return NextResponse.json({ error: 'Não foi possível concluir o pedido.' }, { status: 500 });
  }
}
