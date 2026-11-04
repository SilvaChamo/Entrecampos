import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { folderExists, isFolderSlug } from '@/lib/arquivo';
import { PARTILHA_HORAS, signPartilha } from '@/lib/partilha-link';

export const dynamic = 'force-dynamic';

/** Cria a ligação temporária (12 h) de uma pasta do arquivo, para enviar a quem não tem conta. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('usar_media', 'gerir_biblioteca', 'upload_imagens', 'publicar_artigos');
  if ('error' in guard) return guard.error;
  const body = (await req.json().catch(() => null)) as { slug?: string } | null;
  const slug = String(body?.slug ?? '');
  if (!isFolderSlug(slug) || !(await folderExists(slug))) return NextResponse.json({ error: 'Essa pasta não existe.' }, { status: 404 });
  const { token, expiraEm } = signPartilha(slug);
  return NextResponse.json({ path: `/partilha/${token}`, expiraEm, horas: PARTILHA_HORAS });
}
