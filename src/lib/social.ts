import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Partilha automática de notícias nas redes sociais (Graph API da Meta).
 * O token e os IDs ficam só no servidor (cifrados na base de dados ou em variáveis de ambiente): nunca seguem para o navegador.
 */

export type Network = 'facebook' | 'reels' | 'instagram' | 'linkedin';
export const NETWORKS: Network[] = ['facebook', 'reels', 'instagram', 'linkedin'];
export const NETWORK_LABEL: Record<Network, string> = { facebook: 'Facebook (Página)', reels: 'Facebook Reels', instagram: 'Instagram', linkedin: 'LinkedIn (Página)' };

/** ok = publicado; erro = falhou; ignorado = não se aplicava (ex.: Reel sem vídeo); ja = já tinha sido partilhado. */
export type NetworkResult = { network: Network; status: 'ok' | 'erro' | 'ignorado' | 'ja'; message: string; postId?: string };

export type SocialSettings = Record<Network, boolean>;
export type ShareRecord = Partial<Record<Network, { id: string; at: string }>>;

const SETTINGS_SLUG = 'entrecampos_social';
const SHARES_SLUG = 'entrecampos_social_shares';
const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';

export const siteOrigin = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://entrecamposblog.com').replace(/\/$/, '');

export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Base de dados sem chaves.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/* ---------- Chaves (só servidor) ---------- */

/** Chaves das redes. A tabela site_content é legível com a chave pública, por isso os segredos vão cifrados (AES-256-GCM) com uma chave que só o servidor tem. */
export type KeyName = 'metaPageId' | 'metaPageToken' | 'metaIgId' | 'linkedinOrgId' | 'linkedinToken';
export const KEY_NAMES: KeyName[] = ['metaPageId', 'metaPageToken', 'metaIgId', 'linkedinOrgId', 'linkedinToken'];
const KEYS_SLUG = 'entrecampos_social_chaves';
const ENV_KEYS: Record<KeyName, string> = {
  metaPageId: 'META_PAGE_ID',
  metaPageToken: 'META_PAGE_ACCESS_TOKEN',
  metaIgId: 'META_IG_USER_ID',
  linkedinOrgId: 'LINKEDIN_ORGANIZATION_ID',
  linkedinToken: 'LINKEDIN_ACCESS_TOKEN',
};

function cipherKey() {
  const base = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error('AUTH_SECRET não está definido.');
  return createHash('sha256').update(`${base}|redes-sociais`).digest();
}
function encrypt(obj: unknown): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', cipherKey(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), ct].map((b) => b.toString('base64url')).join('.');
}
function decrypt<T>(blob: string): T | null {
  try {
    const [iv, tag, ct] = blob.split('.').map((x) => Buffer.from(x, 'base64url'));
    const d = createDecipheriv('aes-256-gcm', cipherKey(), iv);
    d.setAuthTag(tag);
    return JSON.parse(Buffer.concat([d.update(ct), d.final()]).toString('utf8')) as T;
  } catch {
    return null;
  }
}

let keysCache: { at: number; value: Record<KeyName, string> } | null = null;

/** Valores guardados no painel (têm prioridade) ou, se faltarem, os das variáveis de ambiente. */
export async function loadKeys(): Promise<Record<KeyName, string>> {
  if (keysCache && Date.now() - keysCache.at < 15_000) return keysCache.value;
  const row = await readRow<{ v?: string }>(KEYS_SLUG);
  const saved = (row?.v ? decrypt<Partial<Record<KeyName, string>>>(row.v) : null) ?? {};
  const value = Object.fromEntries(KEY_NAMES.map((k) => [k, (saved[k] || process.env[ENV_KEYS[k]] || '').trim()])) as Record<KeyName, string>;
  value.linkedinOrgId = value.linkedinOrgId.replace(/^urn:li:organization:/, '');
  keysCache = { at: Date.now(), value };
  return value;
}

/** Quais as chaves já definidas e de onde vêm (nunca os valores). */
export async function keysState(): Promise<Record<KeyName, 'painel' | 'servidor' | 'em-falta'>> {
  const row = await readRow<{ v?: string }>(KEYS_SLUG);
  const saved = (row?.v ? decrypt<Partial<Record<KeyName, string>>>(row.v) : null) ?? {};
  return Object.fromEntries(KEY_NAMES.map((k) => [k, saved[k] ? 'painel' : process.env[ENV_KEYS[k]] ? 'servidor' : 'em-falta'])) as Record<KeyName, 'painel' | 'servidor' | 'em-falta'>;
}

/** Guarda as chaves recebidas: texto vazio ou ausente mantém o valor actual; `null` apaga o valor guardado no painel. */
export async function saveKeys(input: Partial<Record<string, unknown>>) {
  const row = await readRow<{ v?: string }>(KEYS_SLUG);
  const saved = (row?.v ? decrypt<Partial<Record<KeyName, string>>>(row.v) : null) ?? {};
  for (const k of KEY_NAMES) {
    const v = input[k];
    if (v === null) delete saved[k];
    else if (typeof v === 'string' && v.trim()) {
      if (v.trim().length > 1000 || /\s/.test(v.trim())) throw new Error('Valor inválido: não pode ter espaços nem ser tão longo.');
      saved[k] = v.trim();
    }
  }
  await writeRow(KEYS_SLUG, { v: encrypt(saved) });
  keysCache = null;
}

let igCache: { key: string; id: string; at: number } | null = null;

/**
 * Chaves da Meta. O Instagram vem ligado à Página do Facebook: sem ID indicado, procura-se a conta Instagram Business
 * ligada à Página (a mesma ligação do Facebook serve para os dois).
 */
export async function metaKeys() {
  const k = await loadKeys();
  let igId = k.metaIgId;
  if (!igId && k.metaPageId && k.metaPageToken) {
    const key = `${k.metaPageId}|${k.metaPageToken}`;
    if (igCache?.key === key && Date.now() - igCache.at < 600_000 && igCache.id) igId = igCache.id;
    else {
      try {
        const r = await graphWith(k.metaPageToken, k.metaPageId, { fields: 'instagram_business_account' }, 'GET');
        igId = (r as { instagram_business_account?: { id?: string } }).instagram_business_account?.id || '';
        igCache = { key, id: igId, at: Date.now() };
      } catch {
        /* sem ligação à Meta: o erro aparece ao publicar ou na verificação da ligação */
      }
    }
  }
  return { pageId: k.metaPageId, token: k.metaPageToken, igId };
}

export async function linkedinKeys() {
  const k = await loadKeys();
  return { orgId: k.linkedinOrgId, token: k.linkedinToken };
}

/** Quais as redes que têm as chaves necessárias (sem tocar na Meta). */
export async function configured(): Promise<Record<Network, boolean>> {
  const k = await loadKeys();
  const { metaPageId: pageId, metaPageToken: token, metaIgId: igId } = k;
  const page = Boolean(pageId && token);
  const li = await linkedinKeys();
  return { facebook: page, reels: page, instagram: Boolean(token && (igId || pageId)), linkedin: Boolean(li.orgId && li.token) };
}

/* ---------- Definições (escolha das redes) e registo de partilhas, em site_content ---------- */

/** Texto legível de qualquer erro (o Supabase devolve objectos simples, não instâncias de Error). */
export function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const e = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [e.message, e.details, e.hint].filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300));
    if (parts.length) return parts.join(' - ') + (e.code ? ` (${String(e.code)})` : '');
  }
  return typeof err === 'string' && err ? err : 'erro desconhecido';
}

/** Leitura que devolve null se a linha não existe e lança o erro real se a leitura falhar. */
async function readRowStrict<T>(slug: string): Promise<T | null> {
  const { data, error } = await db().from('site_content').select('news').eq('site_slug', slug).maybeSingle();
  if (error) throw new Error(`Não foi possível ler a base de dados: ${errorText(error)}`);
  return (data?.news as T) ?? null;
}

async function readRow<T>(slug: string): Promise<T | null> {
  try {
    return await readRowStrict<T>(slug);
  } catch {
    return null;
  }
}

async function writeRow(slug: string, news: unknown) {
  let last: unknown;
  // Uma segunda tentativa cobre falhas passageiras de rede entre o servidor e a base de dados.
  for (let i = 0; i < 2; i++) {
    const { error } = await db()
      .from('site_content')
      .upsert({ site_slug: slug, news, categories: [], documents: [], updated_at: new Date().toISOString() }, { onConflict: 'site_slug' });
    if (!error) return;
    last = error;
    console.error('[redes-sociais] falha ao guardar', slug, errorText(error));
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Não foi possível guardar na base de dados: ${errorText(last)}`);
}

export async function loadSettings(): Promise<SocialSettings> {
  const row = await readRow<Partial<SocialSettings>>(SETTINGS_SLUG);
  return { facebook: row?.facebook === true, reels: row?.reels === true, instagram: row?.instagram === true, linkedin: row?.linkedin === true };
}

export async function saveSettings(s: Partial<SocialSettings>) {
  // Leitura estrita: se falhar, não se grava (senão as outras redes voltariam a "desligado").
  const row = await readRowStrict<Partial<SocialSettings>>(SETTINGS_SLUG);
  const current: SocialSettings = { facebook: row?.facebook === true, reels: row?.reels === true, instagram: row?.instagram === true, linkedin: row?.linkedin === true };
  const next: SocialSettings = { facebook: s.facebook ?? current.facebook, reels: s.reels ?? current.reels, instagram: s.instagram ?? current.instagram, linkedin: s.linkedin ?? current.linkedin };
  await writeRow(SETTINGS_SLUG, next);
  return next;
}

/** Perfis (endereços públicos) das redes sociais que o EntreCAMPOS usa: não são segredos, por isso ficam na base de dados. */
export const PROFILE_NETWORKS = ['facebook', 'instagram', 'linkedin', 'youtube', 'x', 'tiktok', 'whatsapp'] as const;
export type ProfileNetwork = (typeof PROFILE_NETWORKS)[number];
export type Profiles = Record<ProfileNetwork, string>;
const PROFILES_SLUG = 'entrecampos_social_perfis';

export async function loadProfiles(): Promise<Profiles> {
  const row = (await readRow<Partial<Profiles>>(PROFILES_SLUG)) ?? {};
  return Object.fromEntries(PROFILE_NETWORKS.map((n) => [n, typeof row[n] === 'string' ? row[n]! : ''])) as Profiles;
}

/** Valida (https, até 300 caracteres; vazio = rede não usada) e guarda os endereços recebidos. */
export async function saveProfiles(input: Partial<Record<string, unknown>>): Promise<Profiles> {
  const next = await loadProfiles();
  for (const n of PROFILE_NETWORKS) {
    if (input[n] === undefined) continue;
    const v = String(input[n] ?? '').trim();
    if (v && (v.length > 300 || !/^https:\/\/[^\s]+$/i.test(v))) throw new Error(`Endereço inválido em ${n}: tem de começar por https://`);
    next[n] = v;
  }
  await writeRow(PROFILES_SLUG, next);
  return next;
}

type SharesMap = Record<string, ShareRecord>;

export async function loadShares(newsId: string): Promise<ShareRecord> {
  const all = (await readRow<SharesMap>(SHARES_SLUG)) ?? {};
  return all[newsId] ?? {};
}

async function rememberShare(newsId: string, network: Network, id: string) {
  const all = (await readRow<SharesMap>(SHARES_SLUG)) ?? {};
  all[newsId] = { ...all[newsId], [network]: { id, at: new Date().toISOString() } };
  // Guarda só as 500 notícias mais recentes (a linha não cresce sem fim).
  const keys = Object.keys(all);
  if (keys.length > 500) {
    for (const k of keys.sort((a, b) => latest(all[a]).localeCompare(latest(all[b]))).slice(0, keys.length - 500)) delete all[k];
  }
  await writeRow(SHARES_SLUG, all);
}
const latest = (r: ShareRecord) => Object.values(r).map((v) => v?.at ?? '').sort().pop() ?? '';

/* ---------- Graph API ---------- */

class GraphError extends Error {}

async function graphWith<T = Record<string, unknown>>(token: string, path: string, params: Record<string, string> = {}, method: 'GET' | 'POST' = 'POST'): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: token });
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${path}`;
  const res = await fetch(method === 'GET' ? `${url}?${body}` : url, {
    method,
    ...(method === 'POST' ? { body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } } : {}),
    signal: AbortSignal.timeout(25_000),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number } } & T;
  if (!res.ok || json.error) {
    const msg = (json.error?.message || `Erro ${res.status} da Meta.`).split(token).join('***');
    throw new GraphError(json.error?.code === 190 ? `O token da Meta expirou ou é inválido (${msg})` : msg);
  }
  return json;
}

async function graph<T = Record<string, unknown>>(path: string, params: Record<string, string> = {}, method: 'GET' | 'POST' = 'POST'): Promise<T> {
  return graphWith<T>((await metaKeys()).token, path, params, method);
}

/** Chamada à API do LinkedIn (Página da empresa). O token nunca aparece nas mensagens de erro. */
async function linkedin(path: string, body?: unknown, method: 'GET' | 'POST' = 'POST'): Promise<Response> {
  const { token } = await linkedinKeys();
  const res = await fetch(`https://api.linkedin.com/rest/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'LinkedIn-Version': process.env.LINKEDIN_API_VERSION || '202506',
      'X-Restli-Protocol-Version': '2.0.0',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(25_000),
    cache: 'no-store',
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { message?: string; status?: number };
    const msg = (j.message || `Erro ${res.status} do LinkedIn.`).split(token).join('***');
    throw new GraphError(res.status === 401 ? `O token do LinkedIn expirou ou é inválido (${msg})` : msg);
  }
  return res;
}

const errText = (e: unknown) => (e instanceof Error ? e.message : 'Erro desconhecido.');

export type ConnectionState = { network: 'facebook' | 'instagram' | 'linkedin'; state: 'ligado' | 'erro' | 'sem-chaves'; detail: string };

/** Estado da ligação a cada conta (pergunta à Meta o nome da Página e o utilizador do Instagram). */
export async function connectionStatus(): Promise<ConnectionState[]> {
  const { pageId, igId } = await metaKeys();
  const ok = await configured();
  const out: ConnectionState[] = [];
  if (!ok.facebook) out.push({ network: 'facebook', state: 'sem-chaves', detail: 'Faltam o ID e o token da Página.' });
  else {
    try {
      const p = await graph<{ name?: string }>(pageId, { fields: 'name' }, 'GET');
      out.push({ network: 'facebook', state: 'ligado', detail: `Página: ${p.name ?? pageId}` });
    } catch (e) {
      out.push({ network: 'facebook', state: 'erro', detail: errText(e) });
    }
  }
  if (!ok.instagram) out.push({ network: 'instagram', state: 'sem-chaves', detail: 'Usa a ligação do Facebook: falta ligar a Página (ID e token).' });
  else if (!igId) out.push({ network: 'instagram', state: 'erro', detail: 'A Página do Facebook não tem nenhuma conta Instagram Business ligada. Ligue-a nas definições da Página.' });
  else {
    try {
      const u = await graph<{ username?: string }>(igId, { fields: 'username' }, 'GET');
      out.push({ network: 'instagram', state: 'ligado', detail: `Conta: @${u.username ?? igId}` });
    } catch (e) {
      out.push({ network: 'instagram', state: 'erro', detail: errText(e) });
    }
  }
  const li = await linkedinKeys();
  if (!ok.linkedin) out.push({ network: 'linkedin', state: 'sem-chaves', detail: li.orgId ? 'Falta o token de acesso.' : li.token ? 'Falta o ID da Página.' : 'Faltam o ID da Página e o token de acesso.' });
  else {
    try {
      const r = await linkedin(`organizations/${li.orgId}`, undefined, 'GET');
      const name = (await r.json().catch(() => ({}))) as { localizedName?: string };
      out.push({ network: 'linkedin', state: 'ligado', detail: `Página: ${name.localizedName ?? li.orgId}` });
    } catch (e) {
      out.push({ network: 'linkedin', state: 'erro', detail: errText(e) });
    }
  }
  return out;
}

/* ---------- Conteúdo da notícia ---------- */

type NewsRow = { id: string; slug: string; title: string; summary: string | null; content: string | null; image_url: string | null; status: string | null };

const plain = (h: string) =>
  h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

export async function loadNews(id: string): Promise<NewsRow | null> {
  const { data } = await db().from('news').select('id,slug,title,summary,content,image_url,status').eq('id', id).eq('site_id', SITE_ID).maybeSingle();
  return (data as NewsRow | null) ?? null;
}

/** Primeiro vídeo MP4 que a notícia tem no texto (é o que o Reel precisa; a plataforma não gera vídeo a partir de fotos). */
function videoOf(content: string): string | null {
  const m = /(?:src|href)=["']([^"']+\.mp4[^"']*)["']/i.exec(content) || /(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i.exec(content);
  if (!m) return null;
  return m[1].startsWith('http') ? m[1] : `${siteOrigin()}${m[1].startsWith('/') ? '' : '/'}${m[1]}`;
}

async function describe(n: NewsRow) {
  const summary = plain(n.summary || '') || clip(plain(n.content || ''), 220);
  return { title: plain(n.title), summary, url: `${siteOrigin()}/noticias/${n.slug}`, image: `${siteOrigin()}/imagem-social/${n.id}`, video: videoOf(n.content || '') };
}

/* ---------- Publicar em cada rede ---------- */

async function postFacebook(d: Awaited<ReturnType<typeof describe>>): Promise<string> {
  const { pageId } = await metaKeys();
  const message = [d.title, d.summary, d.url].filter(Boolean).join('\n\n');
  const r = await graph<{ post_id?: string; id?: string }>(`${pageId}/photos`, { url: d.image, message, published: 'true' });
  return r.post_id || r.id || '';
}

async function postReel(d: Awaited<ReturnType<typeof describe>>): Promise<string> {
  const { pageId, token } = await metaKeys();
  const start = await graph<{ video_id?: string; upload_url?: string }>(`${pageId}/video_reels`, { upload_phase: 'start' });
  if (!start.video_id || !start.upload_url) throw new GraphError('A Meta não iniciou o envio do Reel.');
  // O vídeo é buscado pela Meta no endereço público (não passa pelo nosso servidor).
  const up = await fetch(start.upload_url, { method: 'POST', headers: { Authorization: `OAuth ${token}`, file_url: d.video! }, signal: AbortSignal.timeout(40_000) });
  const upJson = (await up.json().catch(() => ({}))) as { success?: boolean; debug_info?: { message?: string } };
  if (!up.ok || upJson.success === false) throw new GraphError(upJson.debug_info?.message || 'A Meta não conseguiu ler o vídeo do Reel.');
  await graph(`${pageId}/video_reels`, {
    upload_phase: 'finish',
    video_id: start.video_id,
    video_state: 'PUBLISHED',
    description: [d.title, d.summary, d.url].filter(Boolean).join('\n\n'),
  });
  return start.video_id;
}

async function postInstagram(d: Awaited<ReturnType<typeof describe>>): Promise<string> {
  const { igId } = await metaKeys();
  // O Instagram não aceita links na legenda: título e resumo; o endereço fica no perfil.
  const caption = clip([d.title, d.summary, `Leia a notícia completa em ${new URL(siteOrigin()).host} (link no perfil).`].filter(Boolean).join('\n\n'), 2200);
  const container = await graph<{ id?: string }>(`${igId}/media`, { image_url: d.image, caption });
  if (!container.id) throw new GraphError('O Instagram não criou a publicação.');
  for (let i = 0; i < 10; i++) {
    const st = await graph<{ status_code?: string }>(container.id, { fields: 'status_code' }, 'GET');
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new GraphError('O Instagram recusou a imagem (formato ou proporção).');
    await new Promise((r) => setTimeout(r, 2000));
  }
  const pub = await graph<{ id?: string }>(`${igId}/media_publish`, { creation_id: container.id });
  return pub.id || '';
}

async function postLinkedin(d: Awaited<ReturnType<typeof describe>>): Promise<string> {
  const { orgId, token } = await linkedinKeys();
  const owner = `urn:li:organization:${orgId}`;
  // Miniatura do cartão: se o envio da imagem falhar, publica na mesma, sem miniatura.
  let thumbnail: string | undefined;
  try {
    const init = await linkedin('images?action=initializeUpload', { initializeUploadRequest: { owner } });
    const { value } = (await init.json()) as { value?: { uploadUrl?: string; image?: string } };
    const img = await fetch(d.image, { signal: AbortSignal.timeout(20_000) });
    if (value?.uploadUrl && value.image && img.ok) {
      const up = await fetch(value.uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' }, body: new Uint8Array(await img.arrayBuffer()), signal: AbortSignal.timeout(25_000) });
      if (up.ok) thumbnail = value.image;
    }
  } catch {
    /* sem miniatura */
  }
  const res = await linkedin('posts', {
    author: owner,
    commentary: [d.title, d.summary].filter(Boolean).join('\n\n').slice(0, 3000),
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    content: { article: { source: d.url, title: d.title.slice(0, 200), description: d.summary.slice(0, 300), ...(thumbnail ? { thumbnail } : {}) } },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  });
  return res.headers.get('x-restli-id') || '';
}

/**
 * Partilha uma notícia já publicada nas redes pedidas. Cada rede é independente: se uma falha, as outras seguem
 * e o resultado de todas volta ao editor. Redes já partilhadas são saltadas (não duplica), salvo `force`.
 */
export async function shareNews(newsId: string, wanted: Network[], opts: { force?: boolean } = {}): Promise<NetworkResult[]> {
  const news = await loadNews(newsId);
  if (!news) return wanted.map((network) => ({ network, status: 'erro', message: 'Notícia não encontrada.' }));
  if (String(news.status).toLowerCase() !== 'published') {
    return wanted.map((network) => ({ network, status: 'ignorado', message: 'A notícia não está publicada: só as publicadas seguem para as redes.' }));
  }
  const settings = await loadSettings();
  const ok = await configured();
  const done = await loadShares(newsId);
  const d = await describe(news);
  const results: NetworkResult[] = [];

  for (const network of NETWORKS.filter((n) => wanted.includes(n))) {
    if (!ok[network]) {
      results.push({ network, status: 'erro', message: 'Rede sem chaves configuradas no servidor.' });
      continue;
    }
    if (!settings[network]) {
      results.push({ network, status: 'ignorado', message: 'Rede desligada nas definições.' });
      continue;
    }
    if (done[network] && !opts.force) {
      results.push({ network, status: 'ja', message: 'Já foi partilhada: não se repete.', postId: done[network]!.id });
      continue;
    }
    if (network === 'reels' && !d.video) {
      results.push({ network, status: 'ignorado', message: 'Sem vídeo: o Reel precisa de um vídeo MP4 no texto da notícia (a foto sozinha não serve).' });
      continue;
    }
    try {
      const id = network === 'facebook' ? await postFacebook(d) : network === 'reels' ? await postReel(d) : network === 'linkedin' ? await postLinkedin(d) : await postInstagram(d);
      try {
        await rememberShare(newsId, network, id || 'sem-id');
      } catch {
        /* publicou mas não ficou registado: pior caso, uma repetição na próxima edição */
      }
      results.push({ network, status: 'ok', message: 'Publicado.', postId: id });
    } catch (e) {
      results.push({ network, status: 'erro', message: errText(e) });
    }
  }
  return results;
}
