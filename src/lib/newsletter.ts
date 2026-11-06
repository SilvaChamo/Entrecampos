import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getAllPosts, type Post } from '@/lib/news-data';
import { mailConfigured, openMailer } from '@/lib/mailer';
import { AD_SLOTS, BRAND, EMAIL_WIDTH, GREEN, RED, categoryColor, categoryIcon, darken, longDate } from '@/lib/newsletter-brand';
import { getCategoryColors } from '@/lib/category-colors';
import { activeBySlot, loadAds, recordSent, type Ad } from '@/lib/newsletter-ads';

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
export type SendRecord = { at: string; recipients: number; sent: number; failed: number; news: number; /** Envio escolhido à mão ou agendado: as notícias que levou. */ slugs?: string[]; /** Anúncios que seguiram neste envio. */ ads?: string[] };
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
  // As notícias já enviadas à mão ou por agendamento depois do último envio não voltam a seguir na newsletter do dia.
  const already = new Set(st.history.filter((h) => h.slugs && new Date(h.at).getTime() > since).flatMap((h) => h.slugs!));
  return posts
    .filter((p) => !already.has(p.slug) && new Date(p.date).getTime() > since && new Date(p.date).getTime() <= Date.now())
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

/**
 * O e-mail: cabeçalho da empresa (logótipo, morada e contactos), a primeira notícia em destaque (foto grande, título e
 * «Ler mais») e as restantes em cards como os da secção Oportunidades do site (foto à esquerda, categoria, título,
 * data, resumo e «Ler mais»). Tabelas e estilos em linha, para funcionar nos programas de e-mail.
 */
export function digestEmail(posts: Post[], email: string, colors: Record<string, string> = {}, ads: Record<string, Ad> = {}) {
  const day = new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Maputo' });
  const unsub = unsubscribeUrl(email);
  const link = (p: Post) => `${SITE_URL()}/noticias/${p.slug}`;
  // Etiqueta como a do site: caixa do ícone (cor escurecida) + nome da categoria, e abre a página da categoria.
  const tag = (p: Post) => {
    const color = colors[p.categorySlug] ?? categoryColor(p.categorySlug);
    return `<a class="ec-c" href="${esc(`${SITE_URL()}/categoria/${p.categorySlug}`)}" style="display:inline-block;text-decoration:none"><table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td style="background:${darken(color)};padding:0 8px;line-height:0;font-size:0" valign="middle"><img src="${esc(SITE_URL())}/images/categorias/${categoryIcon(p.categorySlug)}.png" alt="" width="14" height="14" style="display:block;width:14px;height:14px;border:0"></td><td style="background:${color};color:#ffffff;font-size:11px;line-height:1;font-weight:bold;padding:8px 10px;text-transform:uppercase;letter-spacing:.04em" valign="middle">${esc(p.category)}</td></tr></table></a>`;
  };
  const more = (p: Post) => `<a class="ec-b" href="${esc(link(p))}" style="display:inline-block;background:${GREEN};color:#ffffff;font-size:13px;text-decoration:none;padding:10px 20px;margin-top:12px">Ler mais</a>`;

  // Publicidade: só aparece onde há anúncio; o clique passa pelo servidor para ser contado e segue para o anunciante.
  const adUrl = (ad: Ad) => `${SITE_URL()}/api/newsletter/ad/${ad.id}?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
  const adRow = (position: string) =>
    AD_SLOTS.filter((x) => x.position === position)
      .map((x) => ({ ad: ads[x.key], h: x.h }))
      .filter((x) => x.ad)
      .slice(0, 1)
      .map(({ ad, h }) => `<tr><td style="padding:0 0 12px;line-height:0;font-size:0"><a href="${esc(adUrl(ad))}"><img src="${esc(abs(ad.image))}" alt="${esc(ad.advertiser)}" width="${EMAIL_WIDTH}" style="display:block;width:100%;max-width:${EMAIL_WIDTH}px;height:auto;max-height:${h}px;border:0"></a></td></tr>`)
      .join('');
  const headerAd = ads['cabecalho:caixa']
    ? `<td class="ec-hd ec-ad" width="212" valign="middle" style="width:212px;padding:10px 10px 10px 0;line-height:0;font-size:0"><a href="${esc(adUrl(ads['cabecalho:caixa']))}"><img src="${esc(abs(ads['cabecalho:caixa'].image))}" alt="${esc(ads['cabecalho:caixa'].advertiser)}" width="200" height="92" style="display:block;width:200px;max-width:100%;height:92px;border:0"></a></td>`
    : '';

  const [lead, ...rest] = posts;
  const leadHtml = lead
    ? `<tr><td style="padding:0 0 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e3e3e3"><tr><td>
${lead.image ? `<a href="${esc(link(lead))}"><img src="${esc(abs(lead.image))}" alt="" width="${EMAIL_WIDTH}" style="display:block;width:100%;height:auto;border:0"></a>` : ''}
<div class="ec-pad" style="padding:20px 24px 24px">
${tag(lead)}
<a class="ec-lt ec-t" href="${esc(link(lead))}" style="display:block;margin:10px 0 6px;font-size:23px;line-height:1.25;font-weight:bold;color:#1d2327;text-decoration:none">${esc(lead.title)}</a>
<div style="font-size:12px;color:${RED}">${esc(longDate(lead.date))}</div>
${lead.excerpt ? `<div style="margin-top:10px;font-size:14px;line-height:1.6;color:#50575e">${esc(lead.excerpt.slice(0, 280))}</div>` : ''}
${more(lead)}
</div></td></tr></table></td></tr>`
    : '';

  const mid = Math.ceil(rest.length / 2); // o anúncio «no meio» fica depois da notícia em destaque e de metade dos cartões
  const card = rest
    .map(
      (p) => `<tr><td style="padding:0 0 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e3e3e3"><tr>
${p.image ? `<td class="ec-img" width="220" valign="top" background="${esc(abs(p.image))}" style="width:220px;padding:0;background-color:#e5e7e9;background-image:url('${esc(abs(p.image))}');background-size:cover;background-position:center"><a href="${esc(link(p))}" style="display:block;width:220px;max-width:100%;min-height:150px;font-size:1px;line-height:150px;text-decoration:none">&nbsp;</a></td>` : ''}
<td class="ec-txt" valign="top" style="padding:16px">
${tag(p)}
<a class="ec-ct ec-t" href="${esc(link(p))}" style="display:block;margin:8px 0 4px;font-size:18px;line-height:1.3;font-weight:bold;color:#1d2327;text-decoration:none">${esc(p.title)}</a>
<div style="font-size:11px;color:${RED}">${esc(longDate(p.date))}</div>
${more(p)}
</td></tr></table></td></tr>`,
    );
  const cardsBefore = card.slice(0, mid).join('\n');
  const cardsAfter = card.slice(mid).join('\n');

  const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>.ec-t:hover{color:#d6101c!important}.ec-b:hover{background:#d6101c!important}.ec-c:hover{filter:brightness(1.1)}@media only screen and (max-width:700px){.ec-hd{display:block!important;width:auto!important}.ec-hd2{padding:0 10px 14px!important}.ec-hd3{display:none!important}.ec-ft{display:block!important;width:100%!important;padding:0 0 10px!important;text-align:left!important}.ec-img,.ec-txt{display:block!important;width:100%!important}.ec-img{height:190px!important}.ec-img a{width:100%!important;height:190px!important;line-height:190px!important}.ec-txt{padding:14px 16px 16px!important}.ec-pad{padding:14px 16px 18px!important}.ec-lt{font-size:16px!important}.ec-ct{font-size:14px!important}}</style></head>
<body style="margin:0;background:#f0f0f1;font-family:Arial,Helvetica,sans-serif;color:#2c3338">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 10px">
<table role="presentation" width="${EMAIL_WIDTH}" cellpadding="0" cellspacing="0" style="width:100%;max-width:${EMAIL_WIDTH}px">
${adRow('topo')}
<tr><td style="padding:0 0 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-bottom:4px solid ${RED}"><tr>
<td class="ec-hd" width="118" valign="middle" style="width:118px;padding:10px 0 10px 10px;line-height:0;font-size:0"><a href="${esc(SITE_URL())}"><img src="${esc(SITE_URL())}/images/entrecampos-simbolo.png" alt="${esc(BRAND.name)}" width="108" height="108" style="display:block;width:108px;height:108px;border:0"></a></td>
<td class="ec-hd ec-hd3" width="1" valign="middle" style="width:1px;padding:0"><div style="width:1px;height:92px;background:#d5d8db;font-size:0;line-height:0">&nbsp;</div></td>
<td class="ec-hd ec-hd2" valign="middle" style="padding:12px 20px;font-size:12px;line-height:1.6;color:#50575e;text-align:left"><div style="margin:0 0 4px;font-size:18px;line-height:1.2;font-weight:bold;color:#1d2327">${esc(BRAND.headline)}</div>${esc(BRAND.address)}<br>${BRAND.phones.map(esc).join(' · ')}<br>${BRAND.emails.map((m) => `<a href="mailto:${esc(m)}" style="color:#50575e;text-decoration:none">${esc(m)}</a>`).join(' · ')}</td>${headerAd}
</tr></table></td></tr>
${adRow('depois')}
${leadHtml}
${cardsBefore}
${adRow('meio')}
${cardsAfter}
${adRow('rodape')}
<tr><td align="left" style="background:#1d2327;padding:20px 24px;font-size:11px;line-height:1.8;color:#a7aaad;text-align:left"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td class="ec-ft" valign="middle" style="font-size:11px;line-height:1.8;color:#a7aaad;text-align:left"><div style="font-size:12px;font-weight:bold;color:#ffffff">${esc(BRAND.name)} · ${esc(BRAND.tagline)}</div><div>${esc(BRAND.address)}</div><div>${BRAND.phones.map(esc).join(' · ')}</div></td><td class="ec-ft" valign="middle" align="right" style="padding-left:12px;text-align:right"><a href="${esc(SITE_URL())}/newsletter/publicidade" style="display:inline-block;border:1px solid #a7aaad;color:#ffffff;font-size:11px;line-height:1.2;text-decoration:none;padding:9px 14px;white-space:nowrap">Ver espaços de publicidade</a></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid #6b7278"><tr><td valign="middle" style="padding-top:12px;font-size:11px;line-height:1.6;color:#a7aaad;text-align:left">Recebe este e-mail porque subscreveu a newsletter. <a href="${esc(unsub)}" style="color:#7fd35a;text-decoration:underline">Cancelar subscrição</a></td><td class="ec-soc" valign="middle" align="right" style="padding-top:12px;padding-left:12px;white-space:nowrap;text-align:right;font-size:0;line-height:0">${BRAND.social.map((n) => `<a href="${esc(n.url)}" style="display:inline-block;margin-left:10px;text-decoration:none"><img src="${esc(SITE_URL())}/images/social/${n.key}.png" alt="${esc(n.label)}" width="20" height="20" style="display:block;width:20px;height:20px;border:0"></a>`).join('')}</td></tr></table></td></tr>
</table></td></tr></table></body></html>`;
  const text = `${BRAND.name} — as notícias de hoje (${day})\n${BRAND.address} · ${BRAND.phones.join(' · ')} · ${BRAND.emails.join(' · ')}\n\n${posts.map((p) => `${p.title}\nLer mais: ${link(p)}`).join('\n\n')}\n\nCancelar subscrição: ${unsub}\n`;
  return { subject: `EntreCAMPOS · as notícias de hoje (${day})`, html, text, headers: { 'List-Unsubscribe': `<${unsub}>` } };
}

/** Envia estas notícias a cada subscritor: um e-mail para cada pessoa (ninguém vê os outros endereços), 5 de cada vez. */
async function deliver(posts: Post[], subscribers: Subscriber[]) {
  const [colors, adsData] = await Promise.all([getCategoryColors(), loadAds()]);
  const ads = activeBySlot(adsData);
  const adIds = Object.values(ads).map((a) => a.id);
  const mailer = openMailer();
  let sent = 0;
  let failed = 0;
  try {
    for (let i = 0; i < subscribers.length; i += 5) {
      await Promise.all(
        subscribers.slice(i, i + 5).map(async (s) => {
          try {
            await mailer.send({ to: s.email, ...digestEmail(posts, s.email, colors, ads) });
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
  await recordSent(adIds, sent).catch((e) => console.error('[newsletter] publicidade:', e instanceof Error ? e.message : e));
  return { sent, failed, adIds };
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

  const { sent, failed, adIds } = await deliver(queue, subscribers);
  if (sent > 0) {
    const record: SendRecord = { at: new Date().toISOString(), recipients: subscribers.length, sent, failed, news: queue.length, slugs: queue.map((p) => p.slug), ads: adIds };
    await saveState({ lastSentAt: record.at, history: [record, ...state.history].slice(0, 30) });
  }
  return { status: 'sent', ...base, sent, failed };
}

/**
 * Envio de notícias escolhidas à mão (sem esperar pelo das 20h). Não mexe no `lastSentAt` da fila diária; regista o envio
 * no histórico com as notícias que levou, para elas não irem outra vez na newsletter do dia.
 */
export async function sendSelected(slugs: string[]): Promise<RunResult> {
  const wanted = [...new Set(slugs)];
  const { posts } = await getAllPosts();
  const chosen = wanted.map((s) => posts.find((p) => p.slug === s)).filter((p): p is Post => Boolean(p));
  const subscribers = await listSubscribers();
  const base = { queue: chosen.length, recipients: subscribers.length };
  if (chosen.length === 0) return { status: 'skipped', reason: 'Nenhuma das notícias escolhidas foi encontrada.', ...base };
  if (subscribers.length === 0) return { status: 'skipped', reason: 'Ainda não há subscritores.', ...base };
  if (!mailConfigured()) throw new Error('SMTP não configurado.');
  const { sent, failed, adIds } = await deliver(chosen, subscribers);
  if (sent > 0) {
    const state = await loadState();
    const record: SendRecord = { at: new Date().toISOString(), recipients: subscribers.length, sent, failed, news: chosen.length, slugs: chosen.map((p) => p.slug), ads: adIds };
    await saveState({ ...state, history: [record, ...state.history].slice(0, 30) });
  }
  return { status: 'sent', ...base, sent, failed };
}

/* ---------- Agendamentos: envios com dia, hora e notícias escolhidas ---------- */
const AGENDA_FILE = 'partilhado/_config/newsletter-agenda.json';
export type Schedule = {
  id: string;
  /** Momento do envio (ISO). A hora é a de Maputo (UTC+2, sem hora de verão). */
  at: string;
  slugs: string[];
  status: 'pending' | 'sending' | 'sent' | 'failed';
  createdAt: string;
  result?: string;
};

export async function loadSchedules(): Promise<Schedule[]> {
  try {
    const { data } = await db().storage.from(BUCKET()).download(AGENDA_FILE);
    if (!data) return [];
    const raw = JSON.parse(await data.text());
    return Array.isArray(raw) ? (raw as Schedule[]) : [];
  } catch {
    return [];
  }
}

async function saveSchedules(list: Schedule[]) {
  const { error } = await db().storage.from(BUCKET()).upload(AGENDA_FILE, Buffer.from(JSON.stringify(list)), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
}

export async function addSchedule(at: string, slugs: string[]): Promise<Schedule> {
  const list = await loadSchedules();
  const item: Schedule = { id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36), at, slugs: [...new Set(slugs)], status: 'pending', createdAt: new Date().toISOString() };
  // Mantém os pendentes e os 30 últimos já tratados.
  const done = list.filter((s) => s.status !== 'pending').slice(0, 30);
  await saveSchedules([item, ...list.filter((s) => s.status === 'pending'), ...done]);
  return item;
}

export async function removeSchedule(id: string) {
  const list = await loadSchedules();
  await saveSchedules(list.filter((s) => s.id !== id || s.status === 'sending'));
}

/** Altera um agendamento ainda pendente: nova hora, juntar ou tirar uma notícia, ou mudá-la de posição. */
export async function updateSchedule(id: string, patch: { at?: string; add?: string; remove?: string; move?: { slug: string; dir: -1 | 1 } }): Promise<Schedule> {
  const list = await loadSchedules();
  const item = list.find((s) => s.id === id);
  if (!item) throw new Error('Agendamento não encontrado.');
  if (item.status !== 'pending') throw new Error('Este envio já não se pode alterar.');
  if (patch.at) item.at = patch.at;
  if (patch.add && !item.slugs.includes(patch.add) && item.slugs.length < MAX_NEWS) item.slugs.push(patch.add);
  if (patch.remove) item.slugs = item.slugs.filter((x) => x !== patch.remove);
  if (patch.move) {
    const i = item.slugs.indexOf(patch.move.slug);
    const j = i + patch.move.dir;
    if (i >= 0 && j >= 0 && j < item.slugs.length) [item.slugs[i], item.slugs[j]] = [item.slugs[j], item.slugs[i]];
  }
  await saveSchedules(list);
  return item;
}

/** Envia um agendamento: o resultado fica no próprio agendamento. */
async function dispatch(s: Schedule): Promise<string> {
  try {
    const r = await sendSelected(s.slugs);
    return r.status === 'sent' ? `Enviado a ${r.sent} subscritores${r.failed ? ` (${r.failed} falharam)` : ''}.` : r.status === 'skipped' ? r.reason : 'Nada enviado.';
  } catch (e) {
    return e instanceof Error ? e.message : 'Falhou.';
  }
}

async function finish(id: string, result: string, ok: boolean) {
  const fresh = await loadSchedules();
  await saveSchedules(fresh.map((s) => (s.id === id ? { ...s, status: ok ? ('sent' as const) : ('failed' as const), result } : s)));
}

/** Envia já um agendamento (botão "Enviar agora" do painel). */
export async function runSchedule(id: string): Promise<string> {
  const list = await loadSchedules();
  const item = list.find((s) => s.id === id);
  if (!item) throw new Error('Agendamento não encontrado.');
  if (item.status !== 'pending') throw new Error('Este envio já foi tratado.');
  if (item.slugs.length === 0) throw new Error('Este envio ainda não tem notícias.');
  await saveSchedules(list.map((s) => (s.id === id ? { ...s, status: 'sending' as const } : s)));
  const result = await dispatch(item);
  await finish(id, result, /^Enviado/.test(result));
  return result;
}

/** Envia os agendamentos cuja hora já chegou. Chamado pelo agendador (de poucos em poucos minutos). */
export async function runDueSchedules(): Promise<{ due: number; results: { id: string; result: string }[] }> {
  const list = await loadSchedules();
  const due = list.filter((s) => s.status === 'pending' && new Date(s.at).getTime() <= Date.now());
  if (due.length === 0) return { due: 0, results: [] };
  // Marca como "a enviar" antes, para uma segunda chamada em simultâneo não os enviar duas vezes.
  await saveSchedules(list.map((s) => (due.some((d) => d.id === s.id) ? { ...s, status: 'sending' as const } : s)));
  const results: { id: string; result: string }[] = [];
  for (const s of due) {
    const result = s.slugs.length === 0 ? 'Sem notícias: nada foi enviado.' : await dispatch(s);
    await finish(s.id, result, /^Enviado/.test(result));
    results.push({ id: s.id, result });
  }
  return { due: due.length, results };
}

export { mailConfigured };
