import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const PAGE = 1000;

type StorageItem = { name: string; id: string | null; [key: string]: unknown };

/** Percorre o bucket todo, pastas incluídas (as fotos das notícias estão em `news/`); `name` passa a ser o caminho completo. */
async function walk(prefix = '', skipSpecial = true): Promise<StorageItem[]> {
  const out: StorageItem[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(prefix, {
      limit: PAGE,
      offset,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) throw new Error(error.message);
    for (const item of (data ?? []) as unknown as StorageItem[]) {
      if (item.name.startsWith('.') || item.name === '_pasta.json') continue; // marcadores internos
      if (item.id === null) {
        // A galeria geral não mistura o arquivo de fotos nem as fotos partilhadas (têm a sua própria biblioteca).
        if (skipSpecial && prefix === '' && ['_lixo', '_arquivo', 'arquivo', 'partilhado'].includes(item.name)) continue;
        out.push(...(await walk(`${prefix}${item.name}/`, skipSpecial)));
      }
      else out.push({ ...item, name: `${prefix}${item.name}` });
    }
    if (!data || data.length < PAGE) break;
  }
  return out;
}

/**
 * Todos os ficheiros da biblioteca do site (galeria geral): fotos, vídeos e documentos, em todas as pastas.
 * Só quem usa multimédia (administrador, editor, contribuidor) a vê; o visitante recebe 403.
 */
const IMAGE = /\.(jpe?g|png|gif|webp|avif|svg|bmp)$/i;

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const view = params.get('view'); // 'trash' | 'archive' | nada (galeria)
  const source = params.get('source') || 'galeria'; // 'galeria' | 'arquivo' (com `pasta`) | 'partilhado' (fotos do e-mail)
  const pasta = params.get('pasta') || '';
  const trash = view === 'trash' || view === 'archive';
  if (!['galeria', 'arquivo', 'partilhado'].includes(source) || (source === 'arquivo' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(pasta))) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }
  // O lixo e as arquivadas só as veem administrador e editor.
  // O lixo e as arquivadas: administrador e editor. As fotos partilhadas (e-mail da redacção) têm as mesmas regras da área Partilhado.
  const guard = trash
    ? await requireAuth('gerir_biblioteca', 'publicar_artigos')
    : source === 'partilhado'
      ? await requireAuth('gerir_biblioteca', 'upload_imagens', 'publicar_artigos')
      : await requireAuth('usar_media', 'gerir_biblioteca', 'upload_imagens');
  if ('error' in guard) return guard.error;
  try {
    const here = source === 'arquivo' ? `/arquivo/${pasta}/` : source === 'partilhado' ? '/partilhado/imagens/' : '';
    let files: StorageItem[];
    if (trash) {
      files = await walk(view === 'archive' ? '_arquivo/' : '_lixo/', false);
      // Cada biblioteca só vê o seu lixo e as suas arquivadas.
      files = files.filter((f) => (source === 'galeria' ? !/\/(arquivo|partilhado)\//.test(`/${f.name}`.replace(/^\/(_lixo|_arquivo)\/\d+/, '')) : f.name.includes(here)));
    } else if (source === 'arquivo') files = await walk(`arquivo/${pasta}/`, false);
    else if (source === 'partilhado') files = (await walk('partilhado/imagens/', false)).filter((f) => IMAGE.test(f.name));
    else files = await walk();
    files.sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao listar a biblioteca.' }, { status: 500 });
  }
}
