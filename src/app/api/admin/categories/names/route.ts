import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { setCategoryName } from '@/lib/category-names';
import { refreshSite } from '@/lib/refresh-site';

/** Muda o nome de uma categoria no site e no painel (o endereço não muda). `name: null` volta ao nome de origem. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('editar_artigos');
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => ({}));
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const name = body.name === null ? null : typeof body.name === 'string' ? body.name.trim() : undefined;
  if (!/^[a-z0-9-]+$/.test(slug) || name === undefined || (name !== null && (name.length < 2 || name.length > 60 || /[<>]/.test(name)))) {
    return NextResponse.json({ error: 'Categoria ou nome inválido (2 a 60 letras).' }, { status: 400 });
  }
  try {
    const saved = await setCategoryName(slug, name);
    refreshSite(); // as páginas já feitas com o nome antigo refazem-se
    return NextResponse.json({ ok: true, ...saved });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível guardar o nome.' }, { status: 502 });
  }
}
