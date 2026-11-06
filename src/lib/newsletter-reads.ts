import { createClient } from '@supabase/supabase-js';

/**
 * Leituras das notícias que seguem na newsletter. Cada ligação do e-mail passa pelo servidor (/api/newsletter/ler), que
 * conta e segue para a notícia. Ficheiro pequeno no armazenamento, por envio: quem leu (só um código por pessoa) e
 * quantas vezes cada notícia foi aberta.
 */
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const FILE = 'partilhado/_config/newsletter-leituras.json';

export type SendReads = { clicks: number; readers: string[]; bySlug: Record<string, { clicks: number; readers: string[] }> };
export type ReadsData = Record<string, SendReads>;

const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

export async function loadReads(): Promise<ReadsData> {
  try {
    const { data } = await db().storage.from(BUCKET()).download(FILE);
    if (!data) return {};
    const raw = JSON.parse(await data.text());
    return raw && typeof raw === 'object' ? (raw as ReadsData) : {};
  } catch {
    return {};
  }
}

async function saveReads(d: ReadsData) {
  const { error } = await db().storage.from(BUCKET()).upload(FILE, Buffer.from(JSON.stringify(d)), { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
}

/** Conta a abertura de uma notícia por esta pessoa neste envio (cada pessoa conta uma vez em `readers`). */
export async function recordRead(sendId: string, slug: string, who: string) {
  const d = await loadReads();
  const s = d[sendId] ?? { clicks: 0, readers: [], bySlug: {} };
  s.clicks += 1;
  if (!s.readers.includes(who)) s.readers.push(who);
  const n = s.bySlug[slug] ?? { clicks: 0, readers: [] };
  n.clicks += 1;
  if (!n.readers.includes(who)) n.readers.push(who);
  s.bySlug[slug] = n;
  d[sendId] = s;
  await saveReads(d);
}

export async function removeReads(sendId: string) {
  const d = await loadReads();
  if (!(sendId in d)) return;
  delete d[sendId];
  await saveReads(d);
}
