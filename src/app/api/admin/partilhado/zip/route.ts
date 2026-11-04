import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { openStoredZip, unzipStored } from '@/lib/partilhado';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PERMS = ['gerir_biblioteca', 'upload_imagens', 'publicar_artigos'] as const;

/** "Abrir": lista o que o zip contém, sem descompactar. */
export async function GET(req: NextRequest) {
  const guard = await requireAuth(...PERMS);
  if ('error' in guard) return guard.error;
  try {
    return NextResponse.json({ entries: await openStoredZip(req.nextUrl.searchParams.get('path') || '') });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível abrir o zip.' }, { status: 400 });
  }
}

/** "Descompactar": cada ficheiro do zip vai para a pasta do seu tipo. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth(...PERMS);
  if ('error' in guard) return guard.error;
  const body = (await req.json().catch(() => null)) as { path?: string } | null;
  try {
    return NextResponse.json(await unzipStored(body?.path || ''));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível descompactar.' }, { status: 400 });
  }
}
