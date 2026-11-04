import { NextRequest, NextResponse } from 'next/server';
import { zipSync } from 'fflate';
import { folderFiles } from '@/lib/arquivo';
import { verifyPartilha } from '@/lib/partilha-link';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Descarga pública (sem login) da pasta partilhada, em zip, enquanto a ligação estiver válida. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const check = verifyPartilha((await params).token);
  if (!check.ok) return NextResponse.json({ error: check.motivo === 'expirada' ? 'A ligação expirou.' : 'Ligação inválida.' }, { status: 410 });
  try {
    const files = await folderFiles(check.pasta);
    if (files.length === 0) return NextResponse.json({ error: 'A pasta está vazia.' }, { status: 404 });
    const entries: Record<string, Uint8Array> = {};
    files.forEach((f, i) => { entries[`${String(i + 1).padStart(3, '0')}-${f.name}`] = f.data; });
    return new NextResponse(Buffer.from(zipSync(entries, { level: 0 })), {
      headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${check.pasta}.zip"`, 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível criar o zip.' }, { status: 500 });
  }
}
