const attempts = new Map<string, { count: number; resetAt: number }>();

/** Limite simples em memória (por instância): `max` tentativas por `windowMs`. Devolve true se excedido. */
export function tooManyAttempts(key: string, max = 8, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
