import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession, type LocalSessionPayload } from '@/lib/local-session';
import { hasPermission } from '@/lib/permissions';
import { mapRole } from '@/lib/auth';
import { serverDb } from '@/lib/antispam';
import { effectiveRole, siteAccess } from '@/lib/site-accounts';

type Guard = { session: LocalSessionPayload } | { error: NextResponse };

/**
 * A sessão (cookie) dura 7 dias e leva o papel dentro. Para uma conta suspensa ou com outro papel deixar de valer
 * já (e não daqui a uma semana), confirma-se na base, com uma guarda de 60 s por conta. O acesso de emergência
 * (sem conta na base) e a base em baixo ficam como a sessão diz.
 */
const recentes = new Map<string, { at: number; session: LocalSessionPayload | null }>();
async function sessaoActual(s: LocalSessionPayload): Promise<LocalSessionPayload | null> {
  if (!isUuid(s.id)) return s;
  const hit = recentes.get(s.id);
  if (hit && Date.now() - hit.at < 60_000) return hit.session;
  let session: LocalSessionPayload | null;
  try {
    const { data, error } = await serverDb().auth.admin.getUserById(s.id);
    // Só «conta inexistente» (404) tira o acesso; qualquer outro erro é a base em baixo.
    if (error && error.status !== 404) return s;
    const access = siteAccess(data?.user);
    session = access?.approved ? { ...s, role: mapRole(effectiveRole(access)), colunista: /^colunista$/i.test(access.role) } : null;
  } catch {
    return s;
  }
  recentes.set(s.id, { at: Date.now(), session });
  return session;
}

/**
 * Protege uma rota da API: exige sessão válida (cookie assinado) e, se indicadas,
 * pelo menos UMA das permissões do papel do utilizador. Uso:
 *   const guard = await requireAuth('eliminar_artigos');
 *   if ('error' in guard) return guard.error;
 */
export async function requireAuth(...anyOf: string[]): Promise<Guard> {
  const signed = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  const session = signed && (await sessaoActual(signed));
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
