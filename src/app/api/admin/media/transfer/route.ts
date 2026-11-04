import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';
import { ARQUIVO_ROOT, BUCKET, folderExists } from '@/lib/arquivo';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Só se copia a partir do arquivo ou das fotos partilhadas (e-mail da redacção).
const SOURCE = /^(arquivo\/[a-z0-9-]+|partilhado\/imagens)\/[^/]+\.(jpe?g|png|gif|webp|avif)$/i;

/**
 * Copia fotos do arquivo ou das partilhadas para a galeria geral (`to: "galeria"`) ou para uma pasta do arquivo
 * (`to: "arquivo"`, com `pasta`). É uma cópia: o original fica onde estava. Repetir o pedido não duplica.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('usar_media', 'gerir_biblioteca', 'upload_imagens', 'publicar_artigos');
  if ('error' in guard) return guard.error;
  const body = (await req.json().catch(() => null)) as { names?: unknown; to?: string; pasta?: string } | null;
  const names = Array.isArray(body?.names) ? [...new Set(body!.names.map(String))] : [];
  if (names.some((n) => n.startsWith('partilhado/'))) {
    // Fotos do e-mail da redacção: só quem tem acesso à área Partilhado.
    const shared = await requireAuth('gerir_biblioteca', 'upload_imagens', 'publicar_artigos');
    if ('error' in shared) return shared.error;
  }
  if (names.length === 0 || names.length > 100 || names.some((n) => !SOURCE.test(n) || n.includes('..'))) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }
  if (body?.to !== 'galeria' && body?.to !== 'arquivo') return NextResponse.json({ error: 'Destino inválido.' }, { status: 400 });
  const pasta = String(body.pasta ?? '');
  if (body.to === 'arquivo' && !(await folderExists(pasta))) return NextResponse.json({ error: 'Essa pasta do arquivo não existe.' }, { status: 404 });

  const store = supabaseAdmin.storage.from(BUCKET());
  const done: { from: string; name: string; url: string }[] = [];
  for (const from of names) {
    const leaf = from.split('/').pop()!;
    const to = body.to === 'galeria' ? leaf : `${ARQUIVO_ROOT}/${pasta}/${leaf}`;
    if (to !== from) {
      const { error } = await store.copy(from, to);
      if (error && !/exists|duplicate/i.test(error.message)) return NextResponse.json({ error: error.message, done }, { status: 500 });
    }
    done.push({ from, name: to, url: store.getPublicUrl(to).data.publicUrl });
  }
  return NextResponse.json({ done });
}
