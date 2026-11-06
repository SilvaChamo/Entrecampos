import { createClient } from '@supabase/supabase-js';
import { AD_SLOTS } from '@/lib/newsletter-brand';

/**
 * Publicidade da newsletter. Tudo num ficheiro pequeno no armazenamento (sem tabelas novas): os preços de cada espaço,
 * os anúncios (imagem + ligação + espaço) e os números de cada um (enviados, cliques e quem clicou, só em código).
 */
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const FILE = 'partilhado/_config/newsletter-publicidade.json';

export type Ad = { id: string; slot: string; advertiser: string; image: string; link: string; active: boolean; createdAt: string };
export type AdStats = { sent: number; clicks: number; clickers: string[] };
export type AdsData = { prices: Record<string, number>; ads: Ad[]; stats: Record<string, AdStats> };

const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

export async function loadAds(): Promise<AdsData> {
  try {
    const { data } = await db().storage.from(BUCKET()).download(FILE);
    if (!data) return { prices: {}, ads: [], stats: {} };
    const raw = JSON.parse(await data.text()) as Partial<AdsData>;
    return { prices: raw.prices ?? {}, ads: Array.isArray(raw.ads) ? raw.ads : [], stats: raw.stats ?? {} };
  } catch {
    return { prices: {}, ads: [], stats: {} };
  }
}

async function saveAds(d: AdsData) {
  const { error } = await db().storage.from(BUCKET()).upload(FILE, Buffer.from(JSON.stringify(d)), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
}

/** Um anúncio activo por espaço (o mais recente). */
export function activeBySlot(d: AdsData, only?: string[]): Record<string, Ad> {
  const out: Record<string, Ad> = {};
  for (const ad of [...d.ads].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (only ? !only.includes(ad.id) : !ad.active) continue;
    if (!out[ad.slot]) out[ad.slot] = ad;
  }
  return out;
}

const validSlot = (s: unknown): s is string => typeof s === 'string' && AD_SLOTS.some((x) => x.key === s);
const validUrl = (u: unknown): u is string => typeof u === 'string' && /^https?:\/\/\S+$/i.test(u.trim());

export async function addAd(input: { slot: unknown; advertiser: unknown; image: unknown; link: unknown }): Promise<Ad> {
  if (!validSlot(input.slot)) throw new Error('Espaço inválido.');
  if (!validUrl(input.image)) throw new Error('Falta a imagem do anúncio.');
  if (!validUrl(input.link)) throw new Error('A ligação do anúncio tem de começar por http:// ou https://.');
  const d = await loadAds();
  const ad: Ad = {
    id: Math.random().toString(36).slice(2, 8) + Date.now().toString(36),
    slot: input.slot,
    advertiser: String(input.advertiser || '').trim().slice(0, 80) || 'Anunciante',
    image: input.image.trim(),
    link: input.link.trim(),
    active: true,
    createdAt: new Date().toISOString(),
  };
  d.ads.unshift(ad);
  await saveAds(d);
  return ad;
}

export async function updateAd(id: string, patch: { active?: boolean }) {
  const d = await loadAds();
  const ad = d.ads.find((a) => a.id === id);
  if (!ad) throw new Error('Anúncio não encontrado.');
  if (typeof patch.active === 'boolean') ad.active = patch.active;
  await saveAds(d);
}

export async function deleteAd(id: string) {
  const d = await loadAds();
  d.ads = d.ads.filter((a) => a.id !== id);
  delete d.stats[id];
  await saveAds(d);
}

export async function setPrices(prices: Record<string, unknown>) {
  const d = await loadAds();
  const next: Record<string, number> = {};
  for (const s of AD_SLOTS) {
    const n = Number(prices[s.key]);
    if (Number.isFinite(n) && n > 0) next[s.key] = Math.round(n);
  }
  d.prices = next;
  await saveAds(d);
}

/** Cada envio conta como "alcançados" para os anúncios que levou. */
export async function recordSent(adIds: string[], delivered: number) {
  if (adIds.length === 0 || delivered <= 0) return;
  const d = await loadAds();
  for (const id of adIds) {
    const st = d.stats[id] ?? { sent: 0, clicks: 0, clickers: [] };
    st.sent += delivered;
    d.stats[id] = st;
  }
  await saveAds(d);
}

/** Regista o clique (cada pessoa conta uma vez em `clickers`) e devolve a ligação do anunciante. */
export async function recordClick(id: string, who: string): Promise<string | null> {
  const d = await loadAds();
  const ad = d.ads.find((a) => a.id === id);
  if (!ad) return null;
  const st = d.stats[id] ?? { sent: 0, clicks: 0, clickers: [] };
  st.clicks += 1;
  if (!st.clickers.includes(who)) st.clickers.push(who);
  d.stats[id] = st;
  try {
    await saveAds(d);
  } catch {
    /* o leitor segue para o anúncio mesmo que o registo falhe */
  }
  return ad.link;
}
