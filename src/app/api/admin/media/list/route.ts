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
      if (item.name === '.emptyFolderPlaceholder') continue;
      if (item.id === null) {
        if (skipSpecial && prefix === '' && (item.name === '_lixo' || item.name === '_arquivo')) continue;
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
export async function GET(req: Request) {
  const view = new URL(req.url).searchParams.get('view'); // 'trash' | 'archive' | nada (galeria)
  const trash = view === 'trash' || view === 'archive';
  // O lixo e as arquivadas só as veem administrador e editor.
  const guard = trash ? await requireAuth('gerir_biblioteca', 'publicar_artigos') : await requireAuth('usar_media', 'gerir_biblioteca', 'upload_imagens');
  if ('error' in guard) return guard.error;
  try {
    const files = trash ? await walk(view === 'archive' ? '_arquivo/' : '_lixo/', false) : await walk();
    files.sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao listar a biblioteca.' }, { status: 500 });
  }
}
