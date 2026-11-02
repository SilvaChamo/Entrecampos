import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Acesso de emergência do administrador, definido SÓ por variáveis de ambiente (nunca no código):
 *   BOOTSTRAP_ADMIN_LOGINS=admin,pessoa@exemplo.com
 *   BOOTSTRAP_ADMIN_PASSWORD_HASH=scrypt:<sal>:<hash>   (gerado com hashPassword)
 * Sem estas variáveis, o acesso não existe.
 */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

function logins() {
  return (process.env.BOOTSTRAP_ADMIN_LOGINS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function verifyBootstrapAdmin(login: string, password: string) {
  const allowed = logins();
  const stored = process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH || '';
  const [scheme, salt, hash] = stored.split(':');
  if (allowed.length === 0 || scheme !== 'scrypt' || !salt || !hash) return null;

  // Calcula sempre o hash para o tempo de resposta não revelar se o utilizador existe.
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, 'hex');
  const passwordOk = candidate.length === expected.length && timingSafeEqual(candidate, expected);
  if (!passwordOk || !allowed.includes(login.trim().toLowerCase())) return null;

  const email = allowed.find((l) => l.includes('@')) || 'admin@entrecampos.local';
  return { id: 'bootstrap-admin', email, name: 'Administrador' };
}
