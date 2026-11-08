import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { downloadMailFile, listMailForImport, mailConfigured } from '@/lib/redaccao-mail';
import { lerWord, type ItemWord } from '@/lib/importar-word';
import { toWebp100 } from '@/lib/image-optimize';
import { antivirusConfigured, scanBuffer } from '@/lib/antivirus';
import { applyCategoryNames, getCategoryOptions, slugify } from '@/lib/news-data';
import { guessCategory } from '@/lib/news-fetch';
import { attachToNextSchedule } from '@/lib/newsletter';
import { refreshNews } from '@/lib/refresh-site';
import { shareToEnabled } from '@/lib/social';
import { mailConfigured as smtpConfigured, sendMail } from '@/lib/mailer';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const SLUG = 'entrecampos_importacao';
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const DOCX = /\.docx$/i;
const IMG = /\.(jpe?g|png|webp)$/i;

export type Estado = 'publicada' | 'pendente' | 'repetida' | 'ignorado' | 'erro';
export type Registo = {
  at: string;
  email: string; // assunto
  de: string;
  titulo: string;
  estado: Estado;
  motivo: string;
  newsId?: string;
  slug?: string;
  /** Fotos sugeridas (só nas notícias sem foto): a primeira fica na notícia; as outras podem ser escolhidas no painel. */
  fotos?: string[];
  fotoSugerida?: boolean;
  redes?: string;
};
export type Definicoes = { remetentes: string[]; autoPublicar: boolean; processados: string[]; historico: Registo[]; ultimaVerificacao?: string; ultimoErro?: string };

const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

const vazio = (): Definicoes => ({ remetentes: [], autoPublicar: true, processados: [], historico: [] });

export async function loadDefinicoes(): Promise<Definicoes> {
  try {
    const { data } = await db().from('site_content').select('news').eq('site_slug', SLUG).maybeSingle();
    const n = (data?.news ?? {}) as Partial<Definicoes>;
    return {
      remetentes: Array.isArray(n.remetentes) ? n.remetentes.map((e) => String(e).toLowerCase()) : [],
      autoPublicar: n.autoPublicar !== false,
      processados: Array.isArray(n.processados) ? n.processados.map(String) : [],
      historico: Array.isArray(n.historico) ? n.historico : [],
      ultimaVerificacao: n.ultimaVerificacao,
      ultimoErro: n.ultimoErro,
    };
  } catch {
    return vazio();
  }
}

export async function saveDefinicoes(d: Definicoes) {
  const clean: Definicoes = { ...d, processados: d.processados.slice(-600), historico: d.historico.slice(-120) };
  const { error } = await db().from('site_content').upsert({ site_slug: SLUG, news: clean, categories: [], documents: [], updated_at: new Date().toISOString() }, { onConflict: 'site_slug' });
  if (error) throw new Error(error.message);
}

const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const palavras = (v: string) => new Set(norm(v).split(' ').filter((w) => w.length > 3));

/** O servidor de e-mail do remetente falhou a verificação (SPF/DKIM)? Sem cabeçalho não se rejeita: vale a lista de remetentes. */
export const verificacaoFalhou = (auth: string) => /\b(dkim|spf|dmarc)=(fail|softfail|permerror)\b/i.test(auth);

/** Até 5 fotos de notícias já publicadas, as que mais se parecem com esta (palavras do título e da descrição; mesma categoria pesa mais). */
async function sugerirFotos(item: { title: string; summary: string }, categoria: string): Promise<string[]> {
  const { data } = await db()
    .from('news')
    .select('title,summary,category,image_url')
    .eq('site_id', SITE_ID)
    .eq('status', 'published')
    .not('image_url', 'is', null)
    .order('date', { ascending: false })
    .limit(300);
  const alvo = palavras(`${item.title} ${item.summary}`);
  const pontos = (data ?? [])
    .filter((r) => r.image_url)
    .map((r) => {
      const w = palavras(`${r.title ?? ''} ${r.summary ?? ''}`);
      let score = 0;
      for (const p of alvo) if (w.has(p)) score += 1;
      if (String(r.category ?? '').toLowerCase() === categoria) score += 2;
      return { url: String(r.image_url), score };
    })
    .sort((a, b) => b.score - a.score);
  return [...new Set(pontos.filter((p) => p.score > 0).map((p) => p.url))].slice(0, 5);
}

async function enviarFoto(buffer: Buffer, titulo: string): Promise<string> {
  const webp = await toWebp100(buffer);
  const base = slugify(titulo).slice(0, 80) || 'noticia';
  const storage = db().storage.from(BUCKET());
  for (let n = 1; n <= 30; n++) {
    const nome = `${base}${n > 1 ? `-${n}` : ''}.webp`;
    const { error } = await storage.upload(nome, webp, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' });
    if (!error) return storage.getPublicUrl(nome).data.publicUrl;
    if (!/exist|duplicate|409/i.test(error.message)) throw new Error(error.message);
  }
  throw new Error('Não foi possível guardar a foto.');
}

type Anexo = { filename: string; buffer: Buffer; contentType: string };

function categoriaDoItem(item: ItemWord, opcoes: { slug: string; label: string }[]): { slug: string; certa: boolean } {
  const dita = norm(item.category);
  if (dita) {
    const hit = opcoes.find((o) => norm(o.label) === dita || o.slug === slugify(item.category) || norm(o.slug.replace(/-/g, ' ')) === dita);
    if (hit) return { slug: hit.slug, certa: true };
  }
  return { slug: guessCategory(`${item.title} ${item.summary}`), certa: false };
}

async function criarNoticia(item: ItemWord, anexos: Anexo[], def: Definicoes, de: string, assunto: string): Promise<Registo> {
  const base = { at: new Date().toISOString(), email: assunto, de, titulo: item.title };
  const supabase = db();
  const { data: existentes, error: erroLer } = await supabase.from('news').select('slug,title').eq('site_id', SITE_ID);
  if (erroLer) throw new Error(erroLer.message);
  const titulos = new Set((existentes ?? []).map((r) => norm(String(r.title ?? ''))));
  const slugs = new Set((existentes ?? []).map((r) => String(r.slug)));
  if (titulos.has(norm(item.title))) return { ...base, estado: 'repetida', motivo: 'Já existe uma notícia com este título.' };

  await applyCategoryNames();
  const { slug: categoria, certa } = categoriaDoItem(item, await getCategoryOptions());

  // Foto: a que está no próprio Word ou o anexo com o nome indicado em "Foto:".
  let foto: Buffer | null = item.photo?.buffer ?? null;
  if (!foto && item.photoRef) {
    const quer = item.photoRef.toLowerCase().replace(/\.[a-z]+$/, '').trim();
    const achado = anexos.find((a) => IMG.test(a.filename) && a.filename.toLowerCase().replace(/\.[a-z]+$/, '') === quer);
    if (achado) foto = achado.buffer;
  }
  let imagem: string | null = null;
  if (foto) {
    try {
      imagem = await enviarFoto(foto, item.title);
    } catch (e) {
      console.error('[importar] foto não guardada:', e instanceof Error ? e.message : e);
    }
  }
  let fotos: string[] = [];
  if (!imagem) {
    fotos = await sugerirFotos(item, categoria).catch(() => []);
    imagem = fotos[0] ?? null;
  }
  // Só publica sozinha com foto de verdade e categoria indicada no Word; sem foto fica nos pendentes, para rever e publicar à mão.
  const publicar = def.autoPublicar && Boolean(foto && imagem && !fotos.length) && certa;

  let slug = slugify(item.title).slice(0, 120) || `noticia-${Date.now()}`;
  for (let n = 2; slugs.has(slug); n++) slug = `${slugify(item.title).slice(0, 110)}-${n}`;
  const texto = item.paragraphs.length ? item.paragraphs : [item.summary];
  let linha: Record<string, unknown> = {
    site_id: SITE_ID,
    title: item.title,
    slug,
    summary: item.summary.slice(0, 300),
    content: texto.map((p) => `<p>${esc(p)}</p>`).join('\n'),
    image_url: imagem,
    category: categoria,
    date: new Date().toISOString(),
    author_name: 'Redacção',
    status: publicar ? 'published' : 'pending',
  };
  let id = '';
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase.from('news').insert([linha]).select('id');
    if (!error) { id = String(data?.[0]?.id ?? ''); break; }
    const coluna = /Could not find the '([^']+)' column/i.exec(error.message)?.[1];
    if (!coluna || !(coluna in linha)) throw new Error(error.message);
    const { [coluna]: _drop, ...resto } = linha;
    void _drop;
    linha = resto;
  }
  if (!id) throw new Error('A notícia não foi gravada.');

  const motivo = publicar
    ? 'Tinha foto: publicada.'
    : !foto
      ? fotos.length ? 'Sem foto: ficou nos pendentes com foto sugerida, para rever e publicar.' : 'Sem foto: ficou nos pendentes, sem foto sugerida.'
      : !certa ? 'Categoria não reconhecida: ficou nos pendentes para rever.' : 'Publicação automática desligada: ficou nos pendentes.';
  let redes = '';
  if (publicar) {
    await attachToNextSchedule(slug); // entra no próximo envio da newsletter
    refreshNews([{ slug, category: categoria }]);
    const r = await shareToEnabled(id);
    redes = r.length ? r.map((x) => `${x.network}: ${x.status}`).join(', ') : 'nenhuma rede ligada';
  }
  return { ...base, estado: publicar ? 'publicada' : 'pendente', motivo, newsId: id, slug, fotos: fotos.length ? fotos : undefined, fotoSugerida: fotos.length > 0 || undefined, redes: redes || undefined };
}

export type Resultado = { configurado: boolean; verificadas: number; criadas: number; publicadas: number; pendentes: number; ignoradas: number; erros: number; avisos: string[] };

/** Lê o e-mail da redacção (só leitura), importa os Word de remetentes autorizados e regista tudo. */
export async function importarDoEmail(): Promise<Resultado> {
  const r: Resultado = { configurado: mailConfigured(), verificadas: 0, criadas: 0, publicadas: 0, pendentes: 0, ignoradas: 0, erros: 0, avisos: [] };
  if (!r.configurado) return r;
  const def = await loadDefinicoes();
  const novos: Registo[] = [];
  try {
    if (def.remetentes.length === 0) r.avisos.push('Defina os remetentes autorizados: sem eles nenhum e-mail é importado.');
    const mensagens = await listMailForImport(40);
    for (const m of mensagens) {
      const chave = `${m.messageId}`;
      if (def.processados.includes(chave)) continue;
      const docs = m.files.filter((f) => DOCX.test(f.filename));
      if (docs.length === 0) continue; // e-mails sem Word não são para importar (nem se registam)
      r.verificadas++;
      const base = { at: new Date().toISOString(), email: m.subject, de: m.fromAddress || m.from, titulo: '' };
      if (def.remetentes.length === 0) { r.avisos.push(`"${m.subject}" à espera de remetentes autorizados.`); continue; }
      def.processados.push(chave);
      if (!def.remetentes.includes(m.fromAddress)) { novos.push({ ...base, estado: 'ignorado', motivo: 'Remetente não autorizado.' }); r.ignoradas++; continue; }
      if (verificacaoFalhou(m.auth)) { novos.push({ ...base, estado: 'ignorado', motivo: 'O servidor de e-mail não confirmou o remetente (SPF/DKIM).' }); r.ignoradas++; continue; }
      const anexos: Anexo[] = [];
      for (const f of m.files.filter((x) => DOCX.test(x.filename) || IMG.test(x.filename))) {
        try {
          const d = await downloadMailFile(m.uid, f.part);
          anexos.push({ filename: f.filename, buffer: d.buffer, contentType: d.contentType });
        } catch (e) {
          r.avisos.push(`Anexo ${f.filename}: ${e instanceof Error ? e.message : 'falhou'}`);
        }
      }
      for (const doc of anexos.filter((a) => DOCX.test(a.filename))) {
        if (antivirusConfigured()) {
          const scan = await scanBuffer(doc.buffer).catch(() => ({ status: 'unavailable' as const, reason: '' }));
          if (scan.status === 'infected') { novos.push({ ...base, titulo: doc.filename, estado: 'ignorado', motivo: 'Ficheiro bloqueado pelo antivírus.' }); r.ignoradas++; continue; }
        }
        let itens: ItemWord[] = [];
        try {
          itens = await lerWord(doc.buffer);
        } catch (e) {
          novos.push({ ...base, titulo: doc.filename, estado: 'erro', motivo: `Não foi possível ler o Word: ${e instanceof Error ? e.message : 'erro'}` });
          r.erros++;
          continue;
        }
        if (itens.length === 0) { novos.push({ ...base, titulo: doc.filename, estado: 'erro', motivo: 'Não encontrei notícias: use "Título:", "Categoria:", "Descrição:", "Texto:" e "Foto:".' }); r.erros++; continue; }
        for (const item of itens.slice(0, 40)) {
          try {
            const reg = await criarNoticia(item, anexos, def, m.fromAddress || m.from, m.subject);
            novos.push(reg);
            if (reg.estado === 'publicada') { r.publicadas++; r.criadas++; }
            else if (reg.estado === 'pendente') { r.pendentes++; r.criadas++; }
            else r.ignoradas++;
          } catch (e) {
            novos.push({ ...base, titulo: item.title, estado: 'erro', motivo: e instanceof Error ? e.message : 'Erro ao criar a notícia.' });
            r.erros++;
          }
        }
      }
    }
    def.ultimoErro = undefined;
  } catch (e) {
    def.ultimoErro = e instanceof Error ? e.message : 'Erro ao ler o e-mail.';
    r.avisos.push(def.ultimoErro);
  }
  def.ultimaVerificacao = new Date().toISOString();
  def.historico = [...def.historico, ...novos];
  await saveDefinicoes(def).catch((e) => r.avisos.push(`Registo não guardado: ${e instanceof Error ? e.message : 'erro'}`));

  // Aviso por e-mail: há notícias a rever.
  const para = process.env.NEWS_ALERT_TO || process.env.ADMIN_EMAIL;
  if (r.pendentes > 0 && para && smtpConfigured()) {
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://entrecamposblog.com').replace(/\/$/, '');
    await sendMail({
      to: para,
      subject: `${r.pendentes} notícia(s) do e-mail à espera de revisão`,
      html: `<p>Foram importadas <strong>${r.pendentes}</strong> notícia(s) de documentos Word que precisam de revisão (foto ou categoria). Reveja e publique em <a href="${site}/admin/noticias">Painel &rarr; Notícias</a> (estado pendente).</p>`,
      text: `${r.pendentes} notícia(s) importadas do e-mail à espera de revisão: ${site}/admin/noticias`,
    }).catch(() => {});
  }
  return r;
}
