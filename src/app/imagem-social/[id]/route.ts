import sharp from 'sharp';
import { isUuid } from '@/lib/api-guard';
import { db, siteOrigin } from '@/lib/social';

export const dynamic = 'force-dynamic';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';

/** Servidores de onde se aceitam fotos: o próprio site, o domínio antigo e o armazenamento de ficheiros. */
function allowedHosts() {
  const hosts = new Set(['entrecampos.co.mz', 'www.entrecampos.co.mz', 'entrecamposblog.com', 'www.entrecamposblog.com']);
  for (const v of [siteOrigin(), process.env.NEXT_PUBLIC_SUPABASE_URL || '']) {
    try {
      hosts.add(new URL(v).hostname.toLowerCase());
    } catch {
      /* variável por definir */
    }
  }
  return hosts;
}

/**
 * Imagem da notícia em JPEG, para a Meta a ir buscar (o Instagram não aceita WebP, que é o formato das fotos da galeria,
 * e só aceita proporções entre 4:5 e 1,91:1). Só serve imagens de notícias publicadas; o endereço vem da base de dados, nunca do pedido.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return new Response('Não encontrada', { status: 404 });
  try {
    const { data } = await db().from('news').select('image_url,status').eq('id', id).eq('site_id', SITE_ID).maybeSingle();
    const src = String(data?.image_url || '');
    if (!src || String(data?.status).toLowerCase() !== 'published') return new Response('Não encontrada', { status: 404 });
    // Fotos do próprio site vêm com caminho relativo: buscam-se ao endereço público do site (nunca ao Host do pedido).
    // Só se vai buscar a servidores conhecidos (o site e o armazenamento de ficheiros), sem seguir redireccionamentos.
    let url: URL;
    try {
      url = new URL(src, `${siteOrigin()}/`);
    } catch {
      return new Response('Não encontrada', { status: 404 });
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return new Response('Não encontrada', { status: 404 });
    if (!allowedHosts().has(url.hostname.toLowerCase())) return new Response('Não encontrada', { status: 404 });
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: 'manual' });
    if (!res.ok) return new Response('Imagem indisponível', { status: 502 });

    const rotated = await sharp(Buffer.from(await res.arrayBuffer())).rotate().toBuffer({ resolveWithObject: true });
    let img = sharp(rotated.data);
    const { width, height } = rotated.info;
    const ratio = width / height;
    if (ratio > 1.91) img = img.extract({ left: Math.round((width - height * 1.91) / 2), top: 0, width: Math.round(height * 1.91), height });
    else if (ratio < 0.8) img = img.extract({ left: 0, top: Math.round((height - width / 0.8) / 2), width, height: Math.round(width / 0.8) });
    const jpeg = await img.resize({ width: 1440, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return new Response('Erro ao preparar a imagem', { status: 500 });
  }
}
