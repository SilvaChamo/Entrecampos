import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tooManyAttempts } from '@/lib/rate-limit';

/** Nomes dos campos que o componente AntiSpamFields junta a cada formulário. */
// Nome sem sentido de propósito: com um nome como "empresa" o preenchimento automático do navegador enche o campo
// escondido com a empresa do utilizador e o pedido de uma pessoa verdadeira era descartado como se fosse um robô.
export const HONEYPOT_FIELD = 'ec_hp_k7q2';
export const TIME_FIELD = '_ts';
export const TURNSTILE_FIELD = 'cf-turnstile-response';

const MIN_FILL_MS = 2000; // um humano demora mais do que isto a preencher um formulário
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type GuardResult = { ok: true } | { ok: false; status: number; error: string; silent?: boolean };

export function clientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}

/** O IP nunca é guardado em claro: só um hash curto, para limitar abusos. */
export function hashIp(ip: string) {
  return createHash('sha256').update(`${ip}|${process.env.AUTH_SECRET || 'ec'}`).digest('hex').slice(0, 24);
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Turnstile ainda sem chaves: ficam só o honeypot, o tempo e o limite de pedidos
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false; // sem resposta da Cloudflare: não deixa passar
  }
}

/**
 * Protecção anti-spam de um formulário público. Camadas: limite de pedidos por IP, honeypot (campo escondido
 * que só robôs preenchem), tempo mínimo de preenchimento e Cloudflare Turnstile.
 * Um robô apanhado no honeypot recebe "sucesso" (`silent`), para não saber que foi detectado.
 */
export async function guardForm(
  req: NextRequest,
  body: Record<string, unknown>,
  form: string,
  opts: { max?: number; windowMs?: number } = {},
): Promise<GuardResult> {
  const ip = clientIp(req);
  if (tooManyAttempts(`${form}|${ip}`, opts.max ?? 5, opts.windowMs ?? 10 * 60 * 1000)) {
    return { ok: false, status: 429, error: 'Demasiados pedidos. Aguarde alguns minutos e tente de novo.' };
  }

  if (String(body[HONEYPOT_FIELD] ?? '').trim() !== '') {
    // Fica no registo do servidor: um pedido descartado em silêncio não deixa outro rasto.
    console.warn(`[antispam] pedido descartado pelo honeypot (${form})`);
    return { ok: false, status: 200, error: 'ok', silent: true };
  }

  const age = Date.now() - Number(body[TIME_FIELD]);
  if (!Number.isFinite(age) || age < MIN_FILL_MS || age > MAX_AGE_MS) {
    return { ok: false, status: 400, error: 'O formulário foi enviado depressa demais. Tente de novo.' };
  }

  if (!(await verifyTurnstile(String(body[TURNSTILE_FIELD] ?? ''), ip))) {
    return { ok: false, status: 400, error: 'Não foi possível confirmar que é uma pessoa. Recarregue a página e tente de novo.' };
  }
  return { ok: true };
}

/** Cliente com chave de serviço: só no servidor (nunca NEXT_PUBLIC_*). */
export function serverDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const isEmail = (v: string) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(v) && v.length <= 254;

/** Texto livre: sem tags, sem espaços a mais e com limite de tamanho. */
export function cleanText(v: unknown, max: number) {
  return String(v ?? '').replace(/<[^>]*>/g, '').replace(/\r\n/g, '\n').trim().slice(0, max);
}

/** Muitos links num texto curto é o padrão clássico de spam. */
export const tooManyLinks = (v: string, max = 2) => (v.match(/https?:\/\/|www\./gi) || []).length > max;
