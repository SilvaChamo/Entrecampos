import 'server-only';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';
import { fetchNewsMails, mailConfigured, type NewsMail } from '@/lib/redaccao-mail';
import { parseNewsDocx, plainText, type ParsedNews } from '@/lib/noticias-docx';
import { toWebp100 } from '@/lib/image-optimize';
import { antivirusConfigured, scanBuffer } from '@/lib/antivirus';
import { applyCategoryNames, getCategoryOptions, slugify } from '@/lib/news-data';
import { guessCategory } from '@/lib/news-fetch';
import { attachToNextSchedule } from '@/lib/newsletter';
import { refreshNews } from '@/lib/refresh-site';
import { shareToEnabled } from '@/lib/social';
import { mailConfigured as smtpConfigured, sendMail } from '@/lib/mailer';

/**
 * Notícias por e-mail: a redacção envia um Word para o e-mail da redacção no modelo fixo; cada notícia é criada no site.
 *  - com foto, verificada e sem dúvidas → publicada já, ou agendada se tiver data futura;
 *  - sem foto, ou com qualquer dúvida → fica nos pendentes (com foto sugerida, se houver), para rever e publicar;
 *  - ao publicar (já ou na hora agendada), segue para as redes sociais ligadas e entra no próximo envio da newsletter.
 */

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const SETTINGS_SLUG = 'entrecampos_noticias_email';
const LOG_SLUG = 'entrecampos_noticias_email_log';
/** Definições da primeira versão (importação do e-mail): lidas só para não perder remetentes nem e-mails já tratados. */
const OLD_SLUG = 'entrecampos_importacao';
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';

export type EmailSettings = {
  /** Remetentes autorizados: um endereço completo ou «@dominio.com». */
  senders: string[];
  /** Só publica sozinho se o servidor de e-mail confirmar o remetente (SPF/DKIM); senão fica nos pendentes. */
  requireVerified: boolean;
  /** Partilha nas redes sociais ligadas ao publicar. */
  share: boolean;
};
export type LogItem = {
  title: string;
  status: 'published' | 'scheduled' | 'pending' | 'erro';
  note: string;
  /** Notícia criada (para abrir no painel). */
  id?: string;
  /** Fotos sugeridas (só nas pendentes sem foto): a primeira fica na notícia; as outras podem ser escolhidas no painel. */
  photos?: string[];
};
export type LogEntry = { at: string; from: string; subject: string; items: LogItem[]; note?: string };
type Log = { done: string[]; entries: LogEntry[] };

const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

async function readRow<T>(slug: string): Promise<T | null> {
  try {
    const { data, error } = await db().from('site_content').select('news').eq('site_slug', slug).maybeSingle();
    if (error) throw error;
    return (data?.news as T) ?? null;
  } catch {
    return null;
  }
}

async function writeRow(slug: string, news: unknown) {
  const { error } = await db().from('site_content').upsert({ site_slug: slug, news, categories: [], documents: [], updated_at: new Date().toISOString() }, { onConflict: 'site_slug' });
  if (error) throw new Error(error.message);
}

const cleanSenders = (list: unknown[]) => list.map((s) => String(s).trim().toLowerCase()).filter(Boolean);

export async function loadEmailSettings(): Promise<EmailSettings> {
  const row = await readRow<Partial<EmailSettings>>(SETTINGS_SLUG);
  const old = row ? null : await readRow<{ remetentes?: unknown[] }>(OLD_SLUG);
  const senders = Array.isArray(row?.senders) ? cleanSenders(row!.senders) : Array.isArray(old?.remetentes) ? cleanSenders(old!.remetentes) : [];
  return { senders: senders.slice(0, 30), requireVerified: row?.requireVerified !== false, share: row?.share !== false };
}

export async function saveEmailSettings(input: Partial<EmailSettings>): Promise<EmailSettings> {
  const cur = await loadEmailSettings();
  const senders = Array.isArray(input.senders)
    ? [...new Set(cleanSenders(input.senders).filter((s) => /^(@[a-z0-9.-]+\.[a-z]{2,}|[^\s@<>]+@[a-z0-9.-]+\.[a-z]{2,})$/.test(s)))].slice(0, 30)
    : cur.senders;
  const next: EmailSettings = { senders, requireVerified: input.requireVerified ?? cur.requireVerified, share: input.share ?? cur.share };
  await writeRow(SETTINGS_SLUG, next);
  return next;
}

export async function loadEmailLog(): Promise<Log> {
  const row = await readRow<Partial<Log>>(LOG_SLUG);
  if (row) return { done: Array.isArray(row.done) ? row.done : [], entries: Array.isArray(row.entries) ? row.entries : [] };
  const old = await readRow<{ processados?: unknown[] }>(OLD_SLUG);
  return { done: Array.isArray(old?.processados) ? old!.processados.map(String) : [], entries: [] };
}

async function saveEmailLog(log: Log) {
  await writeRow(LOG_SLUG, log);
}

const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const words = (v: string) => new Set(norm(v).split(' ').filter((w) => w.length > 3));
const fmtMaputo = (iso: string) => new Date(iso).toLocaleString('pt-PT', { timeZone: 'Africa/Maputo' });

/** Até 5 fotos de notícias já publicadas, as que mais se parecem com esta (palavras do título e da descrição; mesma categoria pesa mais). */
async function suggestPhotos(item: { title: string; summary: string }, category: string): Promise<string[]> {
  const { data } = await db().from('news').select('title,summary,category,image_url').eq('site_id', SITE_ID).eq('status', 'published').not('image_url', 'is', null).order('date', { ascending: false }).limit(300);
  const target = words(`${item.title} ${item.summary}`);
  const scored = (data ?? [])
    .filter((r) => r.image_url)
    .map((r) => {
      const w = words(`${r.title ?? ''} ${r.summary ?? ''}`);
      let score = 0;
      for (const p of target) if (w.has(p)) score += 1;
      if (String(r.category ?? '').toLowerCase() === category) score += 2;
      return { url: String(r.image_url), score };
    })
    .sort((a, b) => b.score - a.score);
  return [...new Set(scored.filter((p) => p.score > 0).map((p) => p.url))].slice(0, 5);
}

/** Foto em WebP até 100 KB, com um nome que ainda não existe no armazenamento. */
async function uploadPhoto(buf: Buffer, contentType: string, title: string): Promise<string | null> {
  if (!/^image\/(jpe?g|png|webp)$/i.test(contentType)) return null;
  try {
    const webp = await toWebp100(buf);
    const base = slugify(title).slice(0, 80) || 'noticia';
    const store = db().storage.from(BUCKET());
    for (let n = 1; n <= 30; n++) {
      const name = `${base}${n > 1 ? `-${n}` : ''}.webp`;
      const { error } = await store.upload(name, webp, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' });
      if (!error) return store.getPublicUrl(name).data.publicUrl;
      if (!/exist|duplicate|409/i.test(error.message)) return null;
    }
  } catch (e) {
    console.error('[noticias-email] foto não guardada:', e instanceof Error ? e.message : e);
  }
  return null;
}

/** Grava; se a tabela não tem alguma coluna opcional, repete sem ela. */
async function insertNews(row: Record<string, unknown>) {
  const body = { ...row };
  for (let i = 0; i < 6; i++) {
    const res = await db().from('news').insert([body]).select('id,slug').single();
    const col = /Could not find the '([^']+)' column/i.exec(res.error?.message || '')?.[1];
    if (!res.error || !col || !(col in body) || col === 'status') return res;
    delete body[col];
  }
  return { data: null, error: { message: 'Colunas em falta na tabela news.' } };
}

async function shareEverywhere(id: string): Promise<string> {
  try {
    const res = await shareToEnabled(id);
    const ok = res.filter((r) => r.status === 'ok').length;
    const bad = res.filter((r) => r.status === 'erro').length;
    return ok || bad ? ` Redes: ${ok} publicada(s)${bad ? `, ${bad} com erro` : ''}.` : '';
  } catch {
    return ' Redes: falhou o envio.';
  }
}

/** A notícia fica online: entra no próximo envio da newsletter e a cache do site é refeita. */
async function afterPublish(slug: string, category: string) {
  await attachToNextSchedule(slug);
  refreshNews([{ slug, category }]);
}

async function createOne(n: ParsedNews, mail: NewsMail, settings: EmailSettings): Promise<LogItem> {
  const title = n.title || '(sem título)';
  try {
    const problems = [...n.problems];
    if (/^opini[aã]o$/i.test(n.category.trim())) problems.push('Opinião é só para colunistas');
    if (!n.title || problems.some((p) => /Sem título|Sem texto|Opinião/.test(p))) {
      return { title, status: 'erro', note: `Não criada: ${problems.join('; ')}.` };
    }

    const supabase = db();
    const { data: existing, error: readErr } = await supabase.from('news').select('slug,title').eq('site_id', SITE_ID);
    if (readErr) throw new Error(readErr.message);
    if ((existing ?? []).some((r) => norm(String(r.title ?? '')) === norm(n.title))) return { title, status: 'erro', note: 'Não criada: já existe uma notícia com este título.' };

    // Categoria: tem de ser uma das do site; se não for reconhecida, a notícia fica nos pendentes para escolher a certa.
    await applyCategoryNames();
    const options = await getCategoryOptions();
    const said = norm(n.category);
    const hit = said ? options.find((o) => norm(o.label) === said || o.slug === slugify(n.category) || norm(o.slug.replace(/-/g, ' ')) === said) : undefined;
    const category = hit?.slug ?? guessCategory(`${n.title} ${n.summary}`);
    if (!hit && n.category.trim()) problems.push(`Categoria «${n.category.trim()}» não reconhecida`);

    // Foto: a que está no próprio Word ou o anexo com o nome indicado em «Foto:».
    let photoUrl: string | null = null;
    if (n.photo) photoUrl = await uploadPhoto(n.photo.buffer, n.photo.contentType, n.title);
    else if (n.photoName) {
      const wanted = n.photoName.trim().toLowerCase();
      const file = mail.images.find((f) => f.filename.toLowerCase() === wanted) ?? mail.images.find((f) => f.filename.toLowerCase().startsWith(wanted.replace(/\.[a-z]+$/, '')));
      if (file) photoUrl = await uploadPhoto(file.buffer, file.contentType, n.title);
      else problems.push(`Foto «${n.photoName}» não veio anexada ao e-mail`);
    }
    let photos: string[] = [];
    if (!photoUrl) {
      problems.push('Sem foto');
      photos = await suggestPhotos({ title: n.title, summary: n.summary }, category).catch(() => []);
    }

    const trusted = !settings.requireVerified || mail.verified;
    if (!trusted) problems.push('Remetente não confirmado pelo servidor de e-mail (SPF/DKIM)');

    const now = new Date();
    const later = n.when && Date.parse(n.when) > now.getTime() ? n.when : null;
    const status = problems.length ? 'pending' : later ? 'scheduled' : 'published';

    const taken = new Set((existing ?? []).map((r) => String(r.slug)));
    const base = slugify(n.title).slice(0, 120) || `noticia-${Date.now()}`;
    let slug = base;
    for (let k = 2; taken.has(slug); k++) slug = `${base.slice(0, 110)}-${k}`;

    const summary = (n.summary || plainText(n.html).slice(0, 200)).slice(0, 300);
    const { data, error } = await insertNews({
      site_id: SITE_ID,
      title: n.title,
      slug,
      content: sanitizeHtml(n.html),
      summary,
      category,
      image_url: photoUrl || photos[0] || null,
      date: status === 'scheduled' ? later : now.toISOString(),
      status,
      author_name: 'Redacção',
    });
    if (error || !data) return { title, status: 'erro', note: `Não gravada: ${error?.message ?? 'erro'}` };

    const id = String((data as { id: string }).id);
    if (status === 'published') {
      await afterPublish(slug, category);
      return { title, status, id, note: `Publicada.${settings.share ? await shareEverywhere(id) : ''}` };
    }
    if (status === 'scheduled') {
      refreshNews([{ slug, category }]);
      return { title, status, id, note: `Agendada (${fmtMaputo(later!)}); segue para as redes e para a newsletter quando for publicada.` };
    }
    refreshNews([{ slug, category }]);
    const hint = photos.length ? ' Foto sugerida de notícias parecidas.' : '';
    return {
      title, status, id, photos: photos.length ? photos : undefined,
      note: `Nos pendentes: ${problems.join('; ')}.${hint}${n.when ? ` Data pedida: ${fmtMaputo(n.when)}.` : ''}`,
    };
  } catch (e) {
    return { title, status: 'erro', note: e instanceof Error ? e.message : 'Erro' };
  }
}

export type ProcessResult = { configured: boolean; senders: number; mails: number; created: number; pending: number; failed: number };

/** Lê os e-mails novos dos remetentes autorizados e cria as notícias dos Word. */
export async function processMailbox(max = 3): Promise<ProcessResult> {
  const settings = await loadEmailSettings();
  const result: ProcessResult = { configured: mailConfigured(), senders: settings.senders.length, mails: 0, created: 0, pending: 0, failed: 0 };
  if (!result.configured || !settings.senders.length) return result;

  const log = await loadEmailLog();
  const mails = await fetchNewsMails(settings.senders, new Set(log.done), max);
  for (const mail of mails) {
    const entry: LogEntry = { at: new Date().toISOString(), from: mail.from, subject: mail.subject, items: [] };
    try {
      for (const doc of mail.docs) {
        if (antivirusConfigured()) {
          const scan = await scanBuffer(doc.buffer).catch(() => ({ status: 'unavailable' as const }));
          if (scan.status === 'infected') { entry.items.push({ title: doc.filename, status: 'erro', note: 'Ficheiro bloqueado pelo antivírus.' }); continue; }
        }
        const parsed = await parseNewsDocx(doc.buffer);
        if (!parsed.length) entry.items.push({ title: doc.filename, status: 'erro', note: 'Nenhuma notícia encontrada: o documento deve ter «Título:», «Categoria:», «Descrição:», «Foto:», «Data:» e «Texto:».' });
        for (const n of parsed.slice(0, 40)) entry.items.push(await createOne(n, mail, settings));
      }
    } catch (e) {
      entry.note = e instanceof Error ? e.message : 'Erro ao ler o documento.';
    }
    result.mails += 1;
    for (const i of entry.items) {
      if (i.status === 'erro') result.failed += 1;
      else if (i.status === 'pending') result.pending += 1;
      else result.created += 1;
    }
    log.done = [...log.done, mail.key].slice(-600);
    log.entries = [entry, ...log.entries].slice(0, 40);
    await saveEmailLog(log);
  }

  // Aviso por e-mail: há notícias a rever.
  const to = process.env.NEWS_ALERT_TO || process.env.ADMIN_EMAIL;
  if (result.pending > 0 && to && smtpConfigured()) {
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://entrecamposblog.com').replace(/\/$/, '');
    await sendMail({
      to,
      subject: `${result.pending} notícia(s) do e-mail à espera de revisão`,
      html: `<p>Foram criadas <strong>${result.pending}</strong> notícia(s) de documentos Word que precisam de revisão (foto, categoria ou remetente). Reveja e publique em <a href="${site}/admin/noticias/pendentes">Painel &rarr; Notícias Pendentes</a>.</p>`,
      text: `${result.pending} notícia(s) do e-mail à espera de revisão: ${site}/admin/noticias/pendentes`,
    }).catch(() => {});
  }
  return result;
}

/** Publica as agendadas cuja hora já chegou, junta-as à newsletter e partilha-as nas redes. */
export async function publishDue(): Promise<{ published: number }> {
  const { data } = await db().from('news').select('id,slug,category').eq('site_id', SITE_ID).eq('status', 'scheduled').lte('date', new Date().toISOString()).limit(20);
  const due = (data ?? []).map((r) => ({ id: String(r.id), slug: String(r.slug), category: String(r.category ?? '') }));
  if (!due.length) return { published: 0 };
  const { error } = await db().from('news').update({ status: 'published' }).eq('site_id', SITE_ID).in('id', due.map((d) => d.id));
  if (error) throw new Error(error.message);
  const settings = await loadEmailSettings();
  for (const d of due) {
    await afterPublish(d.slug, d.category);
    if (settings.share) await shareEverywhere(d.id);
  }
  return { published: due.length };
}
