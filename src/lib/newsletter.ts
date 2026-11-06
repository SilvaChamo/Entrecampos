import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getAllPosts, type Post } from '@/lib/news-data';
import { mailConfigured, openMailer } from '@/lib/mailer';

/**
 * Newsletter do EntreCAMPOS. Subscritores: tabela `entrecampos_newsletter`. Fila: as notícias publicadas desde o último
 * envio. Estado do último envio num ficheiro pequeno no armazenamento (como as cores das categorias). O envio automático
 * é às 20h de Maputo (cron em vercel.json: 18:00 UTC).
 */
const SITE_URL = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://entrecamposblog.com').replace(/\/$/, '');
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const STATE_FILE = 'partilhado/_config/newsletter.json';
const MAX_NEWS = 20;

const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

export type Subscriber = { id: string; email: string; created_at: string };
export type SendRecord = { at: string; recipients: number; sent: number; failed: number; news: number };
export type NewsletterState = { lastSentAt?: string; history: SendRecord[] };

export async function loadState(): Promise<NewsletterState> {
  try {
    const { data } = await db().storage.from(BUCKET()).download(STATE_FILE);
    if (!data) return { history: [] };
    const raw = JSON.parse(await data.text());
    return { lastSentAt: typeof raw.lastSentAt === 'string' ? raw.lastSentAt : undefined, history: Array.isArray(raw.history) ? raw.history : [] };
  } catch {
    return { history: [] };
  }
}

async function saveState(state: NewsletterState) {
  const { error } = await db().storage.from(BUCKET()).upload(STATE_FILE, Buffer.from(JSON.stringify(state)), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
}

/** Todos os subscritores (a base devolve no máximo 1000 de cada vez). */
export async function listSubscribers(): Promise<Subscriber[]> {
  const all: Subscriber[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db()
      .from('entrecampos_newsletter')
      .select('id,email,created_at')
      .order('created_at', { ascending: false })
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    all.push(...((data ?? []) as Subscriber[]));
    if (!data || data.length < 1000) break;
  }
  return all;
}

/** Junta e-mails à lista (os repetidos ficam como estão). Devolve quantos eram novos. */
export async function addSubscribers(emails: string[]) {
  const unique = [...new Set(emails)];
  const existing = new Set((await listSubscribers()).map((s) => s.email));
  const fresh = unique.filter((e) => !existing.has(e));
  for (let i = 0; i < fresh.length; i += 500) {
    const { error } = await db()
      .from('entrecampos_newsletter')
      .upsert(fresh.slice(i, i + 500).map((email) => ({ email })), { onConflict: 'email', ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
  return { added: fresh.length, duplicates: unique.length - fresh.length };
}

export async function removeSubscriber(match: { id?: string; email?: string }) {
  const q = db().from('entrecampos_newsletter').delete();
  const { error } = match.id ? await q.eq('id', match.id) : await q.eq('email', match.email ?? '');
  if (error) throw new Error(error.message);
}

/** A fila: notícias publicadas desde o último envio (sem envio anterior, as das últimas 24 h), as mais recentes primeiro. */
export async function getQueue(state?: NewsletterState): Promise<Post[]> {
  const st = state ?? (await loadState());
  const since = st.lastSentAt ? new Date(st.lastSentAt).getTime() : Date.now() - 24 * 3600 * 1000;
  const { posts } = await getAllPosts();
  return posts
    .filter((p) => new Date(p.date).getTime() > since && new Date(p.date).getTime() <= Date.now())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_NEWS);
}

/** Ligação para cancelar a subscrição: o código só o servidor o sabe fazer (um e-mail não se cancela às cegas). */
const secret = () => process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const unsubscribeToken = (email: string) => createHmac('sha256', secret()).update(`newsletter:${email}`).digest('hex').slice(0, 32);
export function validUnsubscribeToken(email: string, token: string) {
  const good = unsubscribeToken(email);
  return token.length === good.length && timingSafeEqual(Buffer.from(token), Buffer.from(good));
}
const unsubscribeUrl = (email: string) => `${SITE_URL()}/api/newsletter/cancelar?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (url: string) => (!url ? '' : /^https?:\/\//.test(url) ? url : `${SITE_URL()}${url.startsWith('/') ? '' : '/'}${url}`);

/** O e-mail do dia: uma linha por notícia (foto, categoria, título, resumo), com a ligação para cancelar no fim. */
export function digestEmail(posts: Post[], email: string) {
  const day = new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Maputo' });
  const unsub = unsubscribeUrl(email);
  const rows = posts
    .map((p) => {
      const link = `${SITE_URL()}/noticias/${p.slug}`;
      const img = abs(p.image);
      return `<tr><td style="padding:16px 28px;border-bottom:1px solid #eee">
${img ? `<a href="${esc(link)}"><img src="${esc(img)}" alt="" width="504" style="display:block;width:100%;max-width:504px;height:auto;margin-bottom:10px;border:0"></a>` : ''}
<div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.06em;color:#d6101c">${esc(p.category)}</div>
<a href="${esc(link)}" style="display:block;margin:4px 0 6px;font-size:18px;line-height:1.3;font-weight:bold;color:#1a3d0c;text-decoration:none">${esc(p.title)}</a>
${p.excerpt ? `<div style="font-size:14px;line-height:1.55;color:#50575e">${esc(p.excerpt.slice(0, 220))}</div>` : ''}
</td></tr>`;
    })
    .join('\n');
  const html = `<!doctype html><html lang="pt"><body style="margin:0;background:#f0f0f1;font-family:Arial,Helvetica,sans-serif;color:#2c3338">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-top:4px solid #d6101c">
<tr><td style="background:#0c1f08;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:bold">Entre<span style="color:#39ff14">CAMPOS</span></td></tr>
<tr><td style="padding:22px 28px 6px"><div style="font-size:12px;color:#646970;text-transform:uppercase;letter-spacing:.06em">${esc(day)}</div>
<h1 style="margin:4px 0 0;font-size:20px;color:#1a3d0c">As notícias de hoje</h1></td></tr>
${rows}
<tr><td style="background:#f6f7f7;padding:14px 28px;font-size:11px;line-height:1.6;color:#646970">EntreCAMPOS · Agricultura Sustentável em Moçambique<br>Recebe este e-mail porque subscreveu a newsletter. <a href="${esc(unsub)}" style="color:#2271b1">Cancelar subscrição</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = `EntreCAMPOS — as notícias de hoje (${day})\n\n${posts.map((p) => `${p.title}\n${SITE_URL()}/noticias/${p.slug}`).join('\n\n')}\n\nCancelar subscrição: ${unsub}\n`;
  return { subject: `EntreCAMPOS · as notícias de hoje (${day})`, html, text };
}

export type RunResult =
  | { status: 'skipped'; reason: string; queue: number; recipients: number }
  | { status: 'dry'; queue: number; recipients: number }
  | { status: 'sent'; queue: number; recipients: number; sent: number; failed: number };

/**
 * Envia a newsletter do dia a todos os subscritores. Sem notícias na fila ou sem subscritores não envia nada.
 * `dry`: só conta (fila e destinatários), sem enviar e sem mexer no estado.
 */
export async function runNewsletter({ dry = false }: { dry?: boolean } = {}): Promise<RunResult> {
  const state = await loadState();
  const [queue, subscribers] = await Promise.all([getQueue(state), listSubscribers()]);
  const base = { queue: queue.length, recipients: subscribers.length };
  if (queue.length === 0) return { status: 'skipped', reason: 'Sem notícias novas desde o último envio.', ...base };
  if (subscribers.length === 0) return { status: 'skipped', reason: 'Ainda não há subscritores.', ...base };
  if (dry) return { status: 'dry', ...base };
  if (!mailConfigured()) throw new Error('SMTP não configurado.');

  const mailer = openMailer();
  let sent = 0;
  let failed = 0;
  try {
    // Um e-mail para cada pessoa (ninguém vê os outros endereços), 5 de cada vez.
    for (let i = 0; i < subscribers.length; i += 5) {
      await Promise.all(
        subscribers.slice(i, i + 5).map(async (s) => {
          try {
            await mailer.send({ to: s.email, ...digestEmail(queue, s.email) });
            sent++;
          } catch (e) {
            failed++;
            console.error('[newsletter] falha ao enviar:', e instanceof Error ? e.message : e);
          }
        }),
      );
    }
  } finally {
    mailer.close();
  }
  if (sent > 0) {
    const record: SendRecord = { at: new Date().toISOString(), recipients: subscribers.length, sent, failed, news: queue.length };
    await saveState({ lastSentAt: record.at, history: [record, ...state.history].slice(0, 30) });
  }
  return { status: 'sent', ...base, sent, failed };
}

export { mailConfigured };
