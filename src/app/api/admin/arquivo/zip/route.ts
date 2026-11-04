import { NextRequest, NextResponse } from 'next/server';
import { zipSync } from 'fflate';
import { requireAuth } from '@/lib/api-guard';
import { folderFiles, isFolderSlug } from '@/lib/arquivo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** "Transferir pasta": todas as fotos da pasta num zip. */
export async function GET(req: NextRequest) {
  const guard = await requireAuth('usar_media', 'gerir_biblioteca', 'upload_imagens', 'publicar_artigos');
  if ('error' in guard) return guard.error;
  const pasta = req.nextUrl.searchParams.get('pasta') || '';
  if (!isFolderSlug(pasta)) return NextResponse.json({ error: 'Pasta inválida.' }, { status: 400 });
  try {
    const files = await folderFiles(pasta);
    if (files.length === 0) return NextResponse.json({ error: 'A pasta está vazia.' }, { status: 404 });
    const entries: Record<string, Uint8Array> = {};
    files.forEach((f, i) => { entries[`${String(i + 1).padStart(3, '0')}-${f.name}`] = f.data; });
    const zip = zipSync(entries, { level: 0 }); // fotos já vão comprimidas
    return new NextResponse(Buffer.from(zip), {
      headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${pasta}.zip"` },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível criar o zip.' }, { status: 500 });
  }
}
