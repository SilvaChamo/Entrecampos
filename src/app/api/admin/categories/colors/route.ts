import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { setCategoryColor } from '@/lib/category-colors';
import { isHexColor } from '@/lib/category-palette';

/** Muda a cor da etiqueta de uma categoria no site público. `color: null` volta à cor de origem. */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('editar_artigos');
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => ({}));
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const color = body.color === null ? null : body.color;
  if (!/^[a-z0-9-]+$/.test(slug) || (color !== null && !isHexColor(color))) {
    return NextResponse.json({ error: 'Categoria ou cor inválida.' }, { status: 400 });
  }
  try {
    const colors = await setCategoryColor(slug, color);
    return NextResponse.json({ ok: true, colors });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível guardar a cor.' }, { status: 502 });
  }
}
