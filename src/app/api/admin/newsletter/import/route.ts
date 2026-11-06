import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { isEmail } from '@/lib/antispam';
import { addSubscribers } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';

/** Junta uma lista de contactos já existente (e-mails lidos no painel a partir de um ficheiro ou de texto colado). */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  const raw: unknown[] = Array.isArray(body.emails) ? body.emails.slice(0, 50_000) : [];
  const clean = raw.map((e) => String(e ?? '').trim().toLowerCase());
  const valid = clean.filter(isEmail);
  if (valid.length === 0) return NextResponse.json({ error: 'Não encontrei nenhum e-mail válido.' }, { status: 400 });
  try {
    const { added, duplicates } = await addSubscribers(valid);
    return NextResponse.json({ ok: true, added, duplicates, invalid: clean.length - valid.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível importar.' }, { status: 502 });
  }
}
