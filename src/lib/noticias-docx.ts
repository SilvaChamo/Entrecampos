import mammoth from 'mammoth';
import sanitizeHtml from 'sanitize-html';

/**
 * Lê um Word (.docx) com uma ou várias notícias no modelo fixo:
 *   Título: …  Categoria: …  Descrição: …  Foto: (imagem no documento ou nome do ficheiro anexado)  Data: dd/mm/aaaa hh:mm  Texto: …
 * Cada «Título:» abre uma notícia nova. O texto pode ter vários parágrafos (tudo o que vem a seguir até ao próximo campo).
 */

export type DocPhoto = { buffer: Buffer; contentType: string };
export type ParsedNews = {
  title: string;
  category: string;
  summary: string;
  /** HTML limpo do corpo. */
  html: string;
  /** Foto metida dentro do Word. */
  photo: DocPhoto | null;
  /** Nome de um ficheiro anexado ao e-mail, quando o campo «Foto:» o indica. */
  photoName: string;
  /** Hora de publicação pedida (ISO) ou null para publicar já. */
  when: string | null;
  /** O que não se percebeu no documento: a notícia vai para os pendentes. */
  problems: string[];
};

const FIELDS: Record<string, 'title' | 'category' | 'summary' | 'photo' | 'when' | 'text'> = {
  titulo: 'title', categoria: 'category', descricao: 'summary', resumo: 'summary', foto: 'photo', imagem: 'photo',
  data: 'when', agendar: 'when', agendamento: 'when', 'publicar em': 'when', texto: 'text', noticia: 'text', corpo: 'text',
};
const LABEL = /^\s*(t[ií]tulo|categoria|descri[cç][aã]o|resumo|foto|imagem|data|agendar|agendamento|publicar em|texto|not[ií]cia|corpo)\s*:\s*([\s\S]*)$/i;
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s: string) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
  if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return entities[e.toLowerCase()] ?? m;
});
const plain = (html: string) => decode(html.replace(/<img[^>]*>/gi, '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const clean = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: ['p', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'br', 'blockquote'],
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: { h1: 'h2' },
  });

/** «dd/mm/aaaa [hh:mm]» ou «aaaa-mm-dd [hh:mm]», na hora de Maputo (UTC+2). */
export function parseWhen(text: string): string | null | 'invalid' {
  const t = text.trim();
  if (!t) return null;
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ T,]+(?:às\s*)?(\d{1,2})[:h](\d{2}))?$/i.exec(t);
  let y: number, mo: number, d: number, hh: number, mm: number;
  if (m) { d = +m[1]; mo = +m[2]; y = +m[3]; hh = +(m[4] ?? 8); mm = +(m[5] ?? 0); }
  else if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]+(\d{1,2}):(\d{2}))?$/.exec(t))) { y = +m[1]; mo = +m[2]; d = +m[3]; hh = +(m[4] ?? 8); mm = +(m[5] ?? 0); }
  else return 'invalid';
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) return 'invalid';
  const ms = Date.UTC(y, mo - 1, d, hh - 2, mm);
  const back = new Date(ms + 2 * 3600_000);
  return back.getUTCDate() === d && back.getUTCMonth() === mo - 1 ? new Date(ms).toISOString() : 'invalid';
}

export async function parseNewsDocx(buffer: Buffer): Promise<ParsedNews[]> {
  const images: DocPhoto[] = [];
  const { value } = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (img) => {
        const data = await img.read();
        images.push({ buffer: Buffer.from(data), contentType: img.contentType });
        return { src: `img:${images.length - 1}` };
      }),
    },
  );

  const elements = value.match(/<(p|h[1-6]|ul|ol|table)\b[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
  const out: (ParsedNews & { body: string[]; open: 'text' | null; whenText: string })[] = [];
  let cur: (typeof out)[number] | null = null;

  for (const el of elements) {
    const text = plain(el);
    const label = LABEL.exec(text);
    const field = label ? FIELDS[fold(label[1])] : undefined;

    if (field === 'title') {
      cur = { title: label![2].trim(), category: '', summary: '', html: '', photo: null, photoName: '', when: null, problems: [], body: [], open: null, whenText: '' };
      out.push(cur);
      continue;
    }
    if (!cur) continue;

    for (const m of el.matchAll(/<img[^>]*src="img:(\d+)"/gi)) {
      if (!cur.photo && images[+m[1]]) cur.photo = images[+m[1]];
    }

    if (field) {
      const v = label![2].trim();
      cur.open = null;
      if (field === 'category') cur.category = v;
      else if (field === 'summary') cur.summary = v;
      else if (field === 'photo') cur.photoName = v;
      else if (field === 'when') cur.whenText = v;
      else if (field === 'text') { cur.open = 'text'; if (v) cur.body.push(`<p>${esc(v)}</p>`); }
    } else if (text) {
      // Parágrafo sem campo: faz parte do texto da notícia (tira as imagens e deixa o resto).
      cur.body.push(el.replace(/<img[^>]*>/gi, ''));
    }
  }

  return out.map(({ body, open: _open, whenText, ...n }) => {
    const problems = [...n.problems];
    const html = clean(body.join('\n')).trim();
    const when = parseWhen(whenText);
    if (when === 'invalid') problems.push(`Data «${whenText}» não percebida (use dd/mm/aaaa hh:mm)`);
    if (!n.title) problems.push('Sem título');
    if (!plain(html)) problems.push('Sem texto');
    if (!n.category) problems.push('Sem categoria');
    return { ...n, html, when: when === 'invalid' ? null : when, problems };
  });
}

export const plainText = plain;
