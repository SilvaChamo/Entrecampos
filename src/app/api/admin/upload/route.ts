import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Só imagens, só destes buckets e com limite de tamanho; a extensão e o tipo são decididos aqui.
const ALLOWED_BUCKETS = ['avatars', 'media', process.env.STORAGE_BUCKET, process.env.NEXT_PUBLIC_STORAGE_BUCKET].filter(Boolean) as string[];
const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_BYTES = 8 * 1024 * 1024;

// O nome do ficheiro é o da própria foto; sem nome útil (colar do ecrã, "image.png", câmara…) usa-se o título da notícia.
const GENERIC = /^(image|imagem|img|blob|untitled|sem-?titulo|unknown|upload|foto|photo|screenshot|captura[-_ ]de[-_ ]ecra)[-_ ]?\d*$/i;
const clean = (s: string, lower: boolean) => {
  const t = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(lower ? /[^a-zA-Z0-9]+/g : /[^\w.-]+/g, lower ? '-' : '_').replace(/^[-_.]+|[-_.]+$/g, '').slice(0, 90);
  return lower ? t.toLowerCase() : t;
};
function baseName(original: string, title: string) {
  const own = clean(original.replace(/\.[^.]+$/, ''), false);
  if (own && !GENERIC.test(own)) return own;
  return clean(title, true) || own || 'imagem';
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth('upload_imagens', 'usar_media', 'gerir_biblioteca', 'criar_artigos', 'editar_utilizadores');
  if ('error' in guard) return guard.error;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'avatars';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum ficheiro enviado' }, { status: 400 });
    }
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Destino não permitido' }, { status: 400 });
    }
    const fileExt = IMAGE_TYPES[file.type];
    if (!fileExt) {
      return NextResponse.json({ error: 'Só são aceites imagens JPG, PNG, WEBP ou GIF' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'A imagem excede 8 MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base = baseName(file.name || '', String(formData.get('title') || ''));
    let fileName = '';
    let error: { message: string } | null = null;
    // Nunca se substitui uma foto existente: se o nome já existe, acrescenta -2, -3…
    for (let n = 1; n <= 30; n++) {
      fileName = `${base}${n > 1 ? `-${n}` : ''}.${fileExt}`;
      const res = await supabaseAdmin.storage.from(bucket).upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '31536000'
      });
      error = res.error;
      if (!error || !/exist|duplicate|409/i.test(error.message)) break;
    }

    if (error) {
      console.error('Erro no upload Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Erro no servidor de upload:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
