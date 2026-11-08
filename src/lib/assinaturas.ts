import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { SESSION_COOKIE, verifySession, type LocalSessionPayload } from '@/lib/local-session';
import { SITE_KEY } from '@/lib/site-accounts';
import { PLANOS_BASE, subscricaoActiva, type Pedido, type PlanosConfig, type Subscricao } from '@/lib/assinaturas-types';

/** Linhas da tabela site_content onde ficam os dados das subscrições (não precisam de tabelas novas). */
const SLUG_PLANOS = 'entrecampos_planos';
const SLUG_EXCLUSIVAS = 'entrecampos_exclusivas';
const SLUG_PEDIDOS = 'entrecampos_pedidos';

export function db(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Base de dados sem chaves.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function lerLinha<T>(slug: string): Promise<T | null> {
  const { data, error } = await db().from('site_content').select('news').eq('site_slug', slug).maybeSingle();
  if (error) throw error;
  return (data?.news as T) ?? null;
}

async function gravarLinha(slug: string, news: unknown) {
  const { error } = await db().from('site_content').upsert({ site_slug: slug, news, categories: [], documents: [], updated_at: new Date().toISOString() }, { onConflict: 'site_slug' });
  if (error) throw error;
}

/* ---------- Planos ---------- */
export async function loadPlanos(): Promise<PlanosConfig> {
  try {
    const row = await lerLinha<PlanosConfig>(SLUG_PLANOS);
    if (row && Array.isArray(row.plans)) return { plans: row.plans, payment: row.payment || '' };
  } catch {
    /* sem base: planos base */
  }
  return { plans: PLANOS_BASE, payment: '' };
}
export const savePlanos = (c: PlanosConfig) => gravarLinha(SLUG_PLANOS, c);

/* ---------- Notícias exclusivas (lista de slugs) ---------- */
export const loadExclusivas = cache(async (): Promise<string[]> => {
  try {
    const row = await lerLinha<{ slugs?: string[] }>(SLUG_EXCLUSIVAS);
    return Array.isArray(row?.slugs) ? row.slugs : [];
  } catch {
    return [];
  }
});
export const saveExclusivas = (slugs: string[]) => gravarLinha(SLUG_EXCLUSIVAS, { slugs });

/* ---------- Pedidos de subscrição ---------- */
export async function loadPedidos(): Promise<Pedido[]> {
  const row = await lerLinha<{ items?: Pedido[] }>(SLUG_PEDIDOS);
  return Array.isArray(row?.items) ? row.items : [];
}
export const savePedidos = (items: Pedido[]) => gravarLinha(SLUG_PEDIDOS, { items });

/* ---------- Subscrição na conta do leitor ---------- */
export function subscricaoDe(user: Pick<User, 'app_metadata'> | null | undefined): Subscricao | null {
  const raw = (user?.app_metadata?.[SITE_KEY] as { subscription?: Subscricao } | undefined)?.subscription;
  return raw && raw.until ? raw : null;
}

/** app_metadata com a subscrição posta (ou retirada, com null); tudo o resto, incluindo outros sites, fica intacto. */
export function comSubscricao(user: Pick<User, 'app_metadata'>, sub: Subscricao | null) {
  const current = ((user.app_metadata?.[SITE_KEY] as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
  const { subscription: _old, ...rest } = current;
  void _old;
  return { ...(user.app_metadata || {}), [SITE_KEY]: sub ? { ...rest, subscription: sub } : rest };
}

/* ---------- Quem está a ler ---------- */
export async function leitorActual(): Promise<LocalSessionPayload | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Redacção (admin, editor, contribuidor) lê tudo; os leitores precisam de subscrição activa. */
export async function podeLerExclusivas(session: LocalSessionPayload | null): Promise<boolean> {
  if (!session) return false;
  if (session.role !== 'guest') return true;
  try {
    const { data } = await db().auth.admin.getUserById(session.id);
    return subscricaoActiva(subscricaoDe(data?.user));
  } catch {
    return false;
  }
}
