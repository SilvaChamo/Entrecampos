import { createHmac, timingSafeEqual } from 'crypto';
import type { AppUser, UserRole } from '@/lib/auth';

export const SESSION_COOKIE = 'ec_session';
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export type LocalSessionPayload = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
};

function secret() {
  const value = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (value) return value;
  // Sem segredo configurado qualquer pessoa poderia forjar uma sessão: só se aceita em desenvolvimento.
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET não está definido.');
  return 'entrecampos-dev-secret-change-me';
}

export function signSession(payload: Omit<LocalSessionPayload, 'exp'>): string {
  const body: LocalSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
  const data = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySession(token: string | undefined | null): LocalSessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;

  const expected = createHmac('sha256', secret()).update(data).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as LocalSessionPayload;
    if (!payload?.email || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionToUser(payload: LocalSessionPayload): AppUser {
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
}

export function cookieOptions(maxAge = MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
