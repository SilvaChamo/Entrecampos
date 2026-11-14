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
// Sem `catch` de propósito: se a base falhar, uma lista «vazia» abria o texto das exclusivas a todos (e o painel apagava a lista ao guardar).
export const loadExclusivas = cache(async (): Promise<string[]> => {
  const row = await lerLinha<{ slugs?: string[] }>(SLUG_EXCLUSIVAS);
  return Array.isArray(row?.slugs) ? row.slugs : [];
});
export const saveExclusivas = (slugs: string[]) => gravarLinha(SLUG_EXCLUSIVAS, { slugs });

/* ---------- Pedidos de subscrição ---------- */
export async function loadPedidos(): Promise<Pedido[]> {
  const row = await lerLinha<{ items?: Pedido[] }>(SLUG_PEDIDOS);
  return Array.isArray(row?.items) ? row.items : [];
}
/** Recusa com o código HTTP que a rota deve devolver (por exemplo, pedido já tratado = 409). */
export class Conflito extends Error {
  constructor(message: string, public status = 409) {
    super(message);
  }
}

/** Lê a linha, aplica `fn` e grava só se mais ninguém a mudou entretanto (compara `updated_at`); se mudou, repete. Dois pedidos em simultâneo já não se apagam um ao outro. */
async function alterarLinha<T>(slug: string, fn: (actual: T | null) => T): Promise<T> {
  for (let i = 0; i < 6; i++) {
    const { data, error } = await db().from('site_content').select('news, updated_at').eq('site_slug', slug).maybeSingle();
    if (error) throw error;
    const novo = fn((data?.news as T) ?? null);
    const quando = new Date().toISOString();
    if (!data) {
      const { error: e } = await db().from('site_content').insert({ site_slug: slug, news: novo, categories: [], documents: [], updated_at: quando });
      if (!e) return novo;
      if (e.code !== '23505') throw e; // 23505 = outro criou a linha primeiro: repete
    } else {
      const { data: rows, error: e } = await db().from('site_content').update({ news: novo, updated_at: quando }).eq('site_slug', slug).eq('updated_at', data.updated_at).select('site_slug');
      if (e) throw e;
      if (rows?.length) return novo;
    }
  }
  throw new Conflito('A lista foi alterada ao mesmo tempo por outra pessoa. Tente de novo.', 503);
}

/** Muda a lista de pedidos de forma segura contra pedidos em simultâneo; `fn` pode ser chamada mais de uma vez. */
export const alterarPedidos = (fn: (pedidos: Pedido[]) => Pedido[]) =>
  alterarLinha<{ items?: Pedido[] }>(SLUG_PEDIDOS, (c) => ({ items: fn(Array.isArray(c?.items) ? c.items : []) }));

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
