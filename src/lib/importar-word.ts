import mammoth from 'mammoth';

/**
 * Lê um documento Word com uma lista de notícias. Cada notícia começa em "Título:" e pode ter "Categoria:", "Descrição:" (resumo),
 * "Texto:" e "Foto:" (nome do ficheiro de imagem enviado no mesmo e-mail). Uma imagem metida no próprio Word, dentro da notícia, também conta.
 * Sem rótulos, cada título (estilo Título/Heading) abre uma notícia: o primeiro parágrafo é a descrição e o resto o texto.
 */
export type ItemWord = {
  title: string;
  category: string;
  summary: string;
  paragraphs: string[];
  photoRef: string;
  photo: { buffer: Buffer; contentType: string } | null;
};

const LABELS: Record<string, 'title' | 'category' | 'summary' | 'text' | 'photo'> = {
  titulo: 'title', categoria: 'category', descricao: 'summary', resumo: 'summary', texto: 'text', foto: 'photo', imagem: 'photo',
};
const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const decode = (t: string) =>
  t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

type Block = { heading: boolean; text: string; images: number[] };

async function blocksOf(buffer: Buffer): Promise<{ blocks: Block[]; images: { buffer: Buffer; contentType: string }[] }> {
  const images: { buffer: Buffer; contentType: string }[] = [];
  const { value } = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        images.push({ buffer: await image.readAsBuffer(), contentType: image.contentType });
        return { src: `img:${images.length - 1}` };
      }),
    },
  );
  const blocks: Block[] = [];
  for (const m of value.matchAll(/<(p|h[1-6]|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const inner = m[2];
    const imgs = [...inner.matchAll(/<img[^>]*src="img:(\d+)"/gi)].map((x) => Number(x[1]));
    const text = decode(inner.replace(/<img[^>]*>/gi, '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (text || imgs.length) blocks.push({ heading: /^h[1-6]$/i.test(m[1]), text, images: imgs });
  }
  return { blocks, images };
}

export async function lerWord(buffer: Buffer): Promise<ItemWord[]> {
  const { blocks, images } = await blocksOf(buffer);
  const labelled = blocks.some((b) => /^t[ií]tulo\s*[:\-–]/i.test(b.text));
  const items: ItemWord[] = [];
  const ref: { cur: ItemWord | null } = { cur: null };
  let field: 'summary' | 'text' | 'category' | 'photo' | 'title' = 'text';
  const open = (title: string) => {
    ref.cur = { title, category: '', summary: '', paragraphs: [], photoRef: '', photo: null };
    items.push(ref.cur);
  };
  const takeImages = (b: Block) => { const c = ref.cur; if (c && !c.photo) for (const n of b.images) if (images[n] && /^image\/(jpeg|png|webp)$/i.test(images[n].contentType)) { c.photo = images[n]; break; } };

  for (const b of blocks) {
    if (labelled) {
      const m = /^([A-Za-zÀ-ÿ]+)\s*[:\-–]\s*(.*)$/.exec(b.text);
      const key = m ? LABELS[norm(m[1])] : undefined;
      if (key === 'title') { open(m![2].trim()); field = 'text'; takeImages(b); continue; }
      const cur = ref.cur;
      if (!cur) continue;
      if (key) {
        field = key;
        const v = m![2].trim();
        if (key === 'category') cur.category = v;
        else if (key === 'photo') cur.photoRef = v;
        else if (key === 'summary') cur.summary = v;
        else if (key === 'text' && v) cur.paragraphs.push(v);
        takeImages(b);
        continue;
      }
      takeImages(b);
      if (!b.text) continue;
      if (field === 'summary') cur.summary = `${cur.summary} ${b.text}`.trim();
      else if (field === 'category') cur.category = `${cur.category} ${b.text}`.trim();
      else if (field === 'photo') cur.photoRef = `${cur.photoRef} ${b.text}`.trim();
      else cur.paragraphs.push(b.text);
    } else {
      if (b.heading && b.text) { open(b.text); continue; }
      if (!ref.cur) continue;
      takeImages(b);
      if (b.text) ref.cur.paragraphs.push(b.text);
    }
  }
  if (!labelled) for (const it of items) if (!it.summary && it.paragraphs.length > 1) it.summary = it.paragraphs.shift()!;
  for (const it of items) {
    if (!it.summary && it.paragraphs[0]) it.summary = it.paragraphs[0].length > 180 ? `${it.paragraphs[0].slice(0, 177).trimEnd()}…` : it.paragraphs[0];
  }
  return items.filter((i) => i.title.length >= 5);
}
