import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const TRASH = '_lixo/';
const SHARED_KEY = /(?:^|\/)partilhado\/[a-z]+\/(\d+-[\d_]+)-/;

/** Uma foto das partilhadas que se tira do sítio não pode voltar a ser importada do e-mail: fica uma marca. */
async function markRemoved(names: string[]) {
  const keys = [...new Set(names.map((n) => SHARED_KEY.exec(n)?.[1]).filter((k): k is string => !!k))];
  for (const key of keys) {
    await supabaseAdmin.storage.from(BUCKET).upload(`partilhado/_removidos/${key}`, Buffer.from(''), { contentType: 'text/plain', upsert: true });
  }
}
const ARCHIVE = '_arquivo/';

/**
 * Lixo da galeria. Corre no servidor porque eliminar a partir do browser (chave pública) falha sem avisar.
 *  - action "trash" (por defeito): manda para o lixo (`_lixo/<hora>/<caminho original>`). Quem usa multimédia pode
 *    (administrador, editor, contribuidor). Recusa fotos que ainda são a imagem de uma notícia.
 *  - action "archive": manda para as arquivadas (`_arquivo/<hora>/<caminho>`). Só administrador e editor.
 *  - action "restore": tira do lixo ou das arquivadas. Só administrador e editor.
 *  - action "purge": elimina para sempre, só do lixo. Só administrador e editor.
 */
export async function POST(req: NextRequest) {
  const { action = 'trash', names } = (await req.json().catch(() => ({}))) as { action?: string; names?: unknown };
  // Fotos partilhadas (e-mail da redacção): eliminar = quem tem acesso a essa área; a reciclagem (restaurar e eliminar para sempre) é só do administrador.
  const nameList = Array.isArray(names) ? names.map(String) : [];
  const isShared = (n: string) => n.startsWith('partilhado/') || /^_(lixo|arquivo)\/\d+\/partilhado\//.test(n);
  const shared = nameList.some(isShared);
  // Um pedido não mistura fotos partilhadas com as outras: cada grupo tem as suas permissões.
  if (shared && !nameList.every(isShared)) return NextResponse.json({ error: 'Não misture fotos partilhadas com outras no mesmo pedido.' }, { status: 400 });
  const guard = shared
    ? action === 'trash' || action === 'archive'
      ? await requireAuth('gerir_biblioteca', 'upload_imagens', 'publicar_artigos')
      : await requireAuth('acesso_total')
    : action === 'trash'
      ? await requireAuth('usar_media', 'gerir_biblioteca', 'upload_imagens')
      : await requireAuth('gerir_biblioteca', 'publicar_artigos');
  if ('error' in guard) return guard.error;

  try {
    const list = Array.isArray(names) ? [...new Set(names.map(String))] : [];
    if (!['trash', 'archive', 'restore', 'purge'].includes(action) || list.length === 0 || list.length > 500 || list.some((n) => !n || n.includes('..') || n.startsWith('/'))) {
      return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
    }
    const store = supabaseAdmin.storage.from(BUCKET);

    if (action === 'trash' || action === 'archive') {
      if (list.some((n) => n.startsWith(TRASH) || n.startsWith(ARCHIVE))) return NextResponse.json({ error: 'Esse ficheiro já está no lixo ou nas arquivadas.' }, { status: 400 });
      // Fotos ainda usadas por notícias deste site.
      const { data: news } = await supabaseAdmin.from('news').select('image_url').eq('site_id', SITE_ID).not('image_url', 'is', null);
      const inUse = list.filter((name) => (news ?? []).some((n) => String(n.image_url).includes(`/${BUCKET}/${encodeURI(name)}`) || String(n.image_url).includes(`/${BUCKET}/${name}`)));
      if (inUse.length > 0) {
        return NextResponse.json(
          { error: `Não foi movido: ${inUse.length === 1 ? 'este ficheiro é' : 'estes ficheiros são'} a foto de uma notícia (${inUse.slice(0, 3).join(', ')}${inUse.length > 3 ? '…' : ''}). Mude primeiro a foto da notícia.` },
          { status: 409 },
        );
      }
      const stamp = Date.now();
      let moved = 0;
      for (const name of list) {
        const { error } = await store.move(name, `${action === 'archive' ? ARCHIVE : TRASH}${stamp}/${name}`);
        if (error) return NextResponse.json({ error: error.message, moved }, { status: 500 });
        moved++;
      }
      await markRemoved(list);
      return NextResponse.json({ moved });
    }

    if (list.some((n) => !n.startsWith(action === 'purge' ? TRASH : (n.startsWith(ARCHIVE) ? ARCHIVE : TRASH)))) return NextResponse.json({ error: 'Só ficheiros do lixo ou das arquivadas.' }, { status: 400 });

    if (action === 'restore') {
      let restored = 0;
      for (const name of list) {
        const original = name.slice((name.startsWith(ARCHIVE) ? ARCHIVE : TRASH).length).replace(/^\d+\//, '');
        const { error } = await store.move(name, original);
        if (error) return NextResponse.json({ error: `${original}: ${error.message}`, restored }, { status: 409 });
        restored++;
      }
      return NextResponse.json({ restored });
    }

    const { data, error } = await store.remove(list);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'Nenhum ficheiro foi eliminado.' }, { status: 404 });
    await supabaseAdmin.from('media_details').delete().in('file_name', list);
    await markRemoved(list);
    return NextResponse.json({ deleted: data.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro.' }, { status: 500 });
  }
}
