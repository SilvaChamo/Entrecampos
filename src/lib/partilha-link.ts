import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Ligação temporária para partilhar uma pasta do arquivo com quem não tem conta: `<dados>.<assinatura>`.
 * Os dados levam a pasta e a hora em que a ligação expira; a assinatura impede que alguém os altere.
 * Dura 12 horas e não precisa de guardar nada na base de dados.
 */
export const PARTILHA_HORAS = 12;

function key() {
  const base = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) {
    if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET não está definido.');
    return 'entrecampos-dev-partilha';
  }
  return `${base}|partilha-pasta`; // chave própria: um token de partilha nunca serve de sessão
}

export function signPartilha(pasta: string): { token: string; expiraEm: number } {
  const expiraEm = Date.now() + PARTILHA_HORAS * 3600_000;
  const data = Buffer.from(JSON.stringify({ p: pasta, e: expiraEm })).toString('base64url');
  const sig = createHmac('sha256', key()).update(data).digest('base64url');
  return { token: `${data}.${sig}`, expiraEm };
}

export type PartilhaCheck = { ok: true; pasta: string; expiraEm: number } | { ok: false; motivo: 'invalida' | 'expirada' };

export function verifyPartilha(token: string): PartilhaCheck {
  const [data, sig] = String(token || '').split('.');
  if (!data || !sig) return { ok: false, motivo: 'invalida' };
  const expected = createHmac('sha256', key()).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, motivo: 'invalida' };
  try {
    const { p, e } = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as { p?: string; e?: number };
    if (!p || typeof e !== 'number') return { ok: false, motivo: 'invalida' };
    if (Date.now() > e) return { ok: false, motivo: 'expirada' };
    return { ok: true, pasta: p, expiraEm: e };
  } catch {
    return { ok: false, motivo: 'invalida' };
  }
}
