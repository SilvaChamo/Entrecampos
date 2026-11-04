import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { countFolders, listFolder, syncMailbox } from '@/lib/partilhado';
import { isFolder } from '@/lib/partilhado-tipos';
import { antivirusConfigured } from '@/lib/antivirus';
import { mailAddress, mailConfigured } from '@/lib/redaccao-mail';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PERMS = ['gerir_biblioteca', 'upload_imagens', 'publicar_artigos'] as const;

/** Sem `pasta`: contagem de cada pasta. Com `?pasta=pdf`: ficheiros dessa pasta. */
export async function GET(req: NextRequest) {
  const guard = await requireAuth(...PERMS);
  if ('error' in guard) return guard.error;
  try {
    const pasta = req.nextUrl.searchParams.get('pasta');
    if (pasta) {
      if (!isFolder(pasta)) return NextResponse.json({ error: 'Pasta desconhecida.' }, { status: 404 });
      return NextResponse.json({ files: await listFolder(pasta) });
    }
    return NextResponse.json({ configured: mailConfigured(), antivirus: antivirusConfigured(), address: mailAddress(), counts: await countFolders() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao ler as pastas.' }, { status: 500 });
  }
}

/** "Sincronizar agora": traz os anexos novos do e-mail para as pastas. */
export async function POST() {
  const guard = await requireAuth(...PERMS);
  if ('error' in guard) return guard.error;
  try {
    return NextResponse.json(await syncMailbox());
  } catch (err) {
    console.error('Partilhado (sincronizar):', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Não foi possível ler o e-mail da redacção. Verifique as definições IMAP.' }, { status: 502 });
  }
}
