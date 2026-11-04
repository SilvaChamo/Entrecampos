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

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
const MAX_BYTES = 4 * 1024 * 1024; // o browser já reduz as fotos antes de enviar (limite do pedido na Vercel)

const slug = (name: string) =>
  name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'foto';

/** Uma foto para uma pasta do arquivo (o browser envia uma de cada vez, já reduzida). */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const shared = form?.get('destino') === 'partilhado';
  // Fotos partilhadas: as mesmas regras da área Partilhado; pastas do arquivo: quem usa multimédia.
  const guard = shared
    ? await requireAuth('gerir_biblioteca', 'upload_imagens', 'publicar_artigos')
    : await requireAuth('usar_media', 'gerir_biblioteca', 'upload_imagens', 'publicar_artigos');
  if ('error' in guard) return guard.error;
  try {
    if (!form) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
    const file = form.get('file') as File | null;
    const pasta = String(form.get('pasta') ?? '');
    if (!file) return NextResponse.json({ error: 'Nenhum ficheiro enviado.' }, { status: 400 });
    if (!shared && !(await folderExists(pasta))) return NextResponse.json({ error: 'Essa pasta não existe.' }, { status: 404 });
    const ext = TYPES[file.type];
    if (!ext) return NextResponse.json({ error: 'O arquivo só aceita fotos (JPG, PNG, WEBP, GIF).' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'A foto é demasiado grande depois de reduzida (máx. 4 MB).' }, { status: 400 });

    const path = shared
      ? `partilhado/imagens/${Date.now()}-0-${slug(file.name)}.${ext}` // o "0" marca que não veio do e-mail
      : `${ARQUIVO_ROOT}/${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${slug(file.name)}.${ext}`;
    const { error } = await supabaseAdmin.storage.from(BUCKET()).upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
      cacheControl: '31536000',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ name: path, url: supabaseAdmin.storage.from(BUCKET()).getPublicUrl(path).data.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao enviar a foto.' }, { status: 500 });
  }
}
