import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession, type LocalSessionPayload } from '@/lib/local-session';
import { hasPermission } from '@/lib/permissions';

type Guard = { session: LocalSessionPayload } | { error: NextResponse };

/**
 * Protege uma rota da API: exige sessão válida (cookie assinado) e, se indicadas,
 * pelo menos UMA das permissões do papel do utilizador. Uso:
 *   const guard = await requireAuth('eliminar_artigos');
 *   if ('error' in guard) return guard.error;
 */
export async function requireAuth(...anyOf: string[]): Promise<Guard> {
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) {
    return { error: NextResponse.json({ error: 'Sessão inválida ou expirada. Inicie sessão.' }, { status: 401 }) };
  }
  if (anyOf.length > 0 && !anyOf.some((p) => hasPermission(session.role, p))) {
    return { error: NextResponse.json({ error: 'Não tem permissão para esta operação.' }, { status: 403 }) };
  }
  return { session };
}

export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
