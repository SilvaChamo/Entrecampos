import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PERMS = ['gerir_biblioteca', 'upload_imagens', 'publicar_artigos'] as const;
const BUCKET = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';

const supabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/** Ficheiro partilhado servido pelo próprio painel: abre dentro do painel (inline) ou baixa (`?download=1`). */
export async function GET(req: NextRequest) {
  const guard = await requireAuth(...PERMS);
  if ('error' in guard) return guard.error;

  const path = req.nextUrl.searchParams.get('path') || '';
  if (!path.startsWith('partilhado/') || path.includes('..')) return NextResponse.json({ error: 'Ficheiro inválido.' }, { status: 400 });

  let res = await supabase().storage.from(BUCKET()).download(path);
  for (let attempt = 1; res.error && /fetch failed/i.test(res.error.message) && attempt <= 3; attempt++) {
    await new Promise((r) => setTimeout(r, 400 * attempt));
    res = await supabase().storage.from(BUCKET()).download(path);
  }
  if (res.error || !res.data) return NextResponse.json({ error: 'Não foi possível ler o ficheiro.' }, { status: 502 });

  const name = (path.split('/').pop() || 'ficheiro').replace(/^\d+-[\d_]+-(z\d+-)?/, '');
  const ext = (name.split('.').pop() || '').toLowerCase();
  const download = req.nextUrl.searchParams.get('download') === '1';
  return new NextResponse(await res.data.arrayBuffer(), {
    headers: {
      'Content-Type': download ? 'application/octet-stream' : TYPES[ext] || 'application/octet-stream',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(name)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}
