import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { createFolder, deleteFolder, listFolders, updateFolder } from '@/lib/arquivo';

export const dynamic = 'force-dynamic';

const PERMS = ['usar_media', 'gerir_biblioteca', 'upload_imagens', 'publicar_artigos'] as const;

/** Pastas do arquivo de fotos, com contagem e capa. */
export async function GET() {
  const guard = await requireAuth(...PERMS);
  if ('error' in guard) return guard.error;
  try {
    return NextResponse.json({ folders: await listFolders() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível ler o arquivo.' }, { status: 500 });
  }
}

/** Nova pasta. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth(...PERMS);
  if ('error' in guard) return guard.error;
  const body = (await req.json().catch(() => null)) as { nome?: string } | null;
  try {
    return NextResponse.json({ folder: await createFolder(String(body?.nome ?? '')) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível criar a pasta.' }, { status: 400 });
  }
}

/** Mudar o nome (visível) e/ou a cor de destaque de uma pasta; a sua chave não muda. */
export async function PATCH(req: NextRequest) {
  const guard = await requireAuth(...PERMS);
  if ('error' in guard) return guard.error;
  const body = (await req.json().catch(() => null)) as { slug?: string; nome?: string; cor?: string | null } | null;
  try {
    await updateFolder(String(body?.slug ?? ''), { nome: body?.nome, cor: body?.cor });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível guardar.' }, { status: 400 });
  }
}

/** Eliminar uma pasta vazia. Só administrador e editor. */
export async function DELETE(req: NextRequest) {
  const guard = await requireAuth('gerir_biblioteca', 'publicar_artigos');
  if ('error' in guard) return guard.error;
  const body = (await req.json().catch(() => null)) as { slug?: string } | null;
  try {
    await deleteFolder(String(body?.slug ?? ''));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível eliminar a pasta.' }, { status: 400 });
  }
}
