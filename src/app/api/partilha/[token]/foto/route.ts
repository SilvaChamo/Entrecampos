import { NextRequest, NextResponse } from 'next/server';
import { folderPhotoFile } from '@/lib/arquivo';
import { verifyPartilha } from '@/lib/partilha-link';

export const dynamic = 'force-dynamic';

/** Descarga pública (sem login) de uma foto da pasta partilhada, enquanto a ligação estiver válida. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const check = verifyPartilha((await params).token);
  if (!check.ok) return NextResponse.json({ error: check.motivo === 'expirada' ? 'A ligação expirou.' : 'Ligação inválida.' }, { status: 410 });
  const file = await folderPhotoFile(check.pasta, req.nextUrl.searchParams.get('f') || '');
  if (!file) return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 });
  return new NextResponse(Buffer.from(file.data), {
    headers: { 'Content-Type': file.type, 'Content-Disposition': `attachment; filename="${file.nome.replace(/"/g, '')}"`, 'Cache-Control': 'private, no-store' },
  });
}
