import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_BYTES = 4 * 1024 * 1024; // limite do pedido na Vercel

/**
 * Grava a imagem editada na biblioteca (galeria, arquivo ou fotos partilhadas), no próprio servidor.
 * Substitui o ficheiro com o mesmo nome ou cria um novo (`name` = caminho de destino).
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const name = String(form?.get('name') ?? '');
  // As fotos partilhadas (e-mail da redacção) seguem as regras da área Partilhado.
  const guard = name.startsWith('partilhado/')
    ? await requireAuth('gerir_biblioteca', 'upload_imagens', 'publicar_artigos')
    : await requireAuth('usar_media', 'gerir_biblioteca', 'upload_imagens', 'publicar_artigos');
  if ('error' in guard) return guard.error;

  const file = form?.get('file') as File | null;
  if (!form || !file) return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 });
  if (!name || name.includes('..') || name.startsWith('/') || name.startsWith('_lixo/') || name.startsWith('_arquivo/') || !/\.(jpe?g|png|webp|gif)$/i.test(name)) {
    return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 });
  }
  if (!TYPES[file.type]) return NextResponse.json({ error: 'Só são aceites imagens JPG, PNG, WEBP ou GIF.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'A imagem editada excede 4 MB. Reduza as dimensões.' }, { status: 400 });

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(name, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: true,
    cacheControl: '31536000',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ name, url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(name).data.publicUrl });
}
