import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/api-guard';
import { loadExclusivas, saveExclusivas } from '@/lib/assinaturas';
import { getAllPosts } from '@/lib/news-data';

const PERMISSIONS = ['publicar_artigos'];

/** Notícias publicadas, com a indicação de quais são exclusivas para assinantes. */
export async function GET() {
  const guard = await requireAuth(...PERMISSIONS);
  if ('error' in guard) return guard.error;
  const [{ posts }, slugs] = await Promise.all([getAllPosts(), loadExclusivas()]);
  return NextResponse.json({
    posts: posts.slice(0, 200).map((p) => ({ slug: p.slug, title: p.title, date: p.date, category: p.category, exclusive: slugs.includes(p.slug) })),
    total: slugs.length,
  });
}

/** Marca ou desmarca uma notícia como exclusiva. */
export async function PUT(req: NextRequest) {
  const guard = await requireAuth(...PERMISSIONS);
  if ('error' in guard) return guard.error;
  try {
    const { slug, exclusive } = (await req.json()) as { slug?: unknown; exclusive?: unknown };
    const s = String(slug ?? '').slice(0, 200);
    if (!s) return NextResponse.json({ error: 'Notícia inválida.' }, { status: 400 });
    const { posts } = await getAllPosts();
    if (!posts.some((p) => p.slug === s)) return NextResponse.json({ error: 'Notícia inexistente.' }, { status: 404 });
    const actuais = (await loadExclusivas()).filter((x) => x !== s);
    const novos = exclusive === true ? [...actuais, s] : actuais;
    await saveExclusivas(novos);
    try {
      revalidatePath('/', 'layout');
    } catch {
      /* a página actualiza-se na revalidação seguinte */
    }
    return NextResponse.json({ ok: true, total: novos.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao guardar.' }, { status: 500 });
  }
}
