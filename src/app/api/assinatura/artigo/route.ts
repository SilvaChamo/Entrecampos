import { NextRequest, NextResponse } from 'next/server';
import { leitorActual, loadExclusivas, podeLerExclusivas } from '@/lib/assinaturas';
import { getPost } from '@/lib/news-data';

/** Texto completo de uma notícia exclusiva, só para a redacção e para assinantes com subscrição activa. */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || '';
  const post = slug ? await getPost(slug) : null;
  if (!post) return NextResponse.json({ error: 'Notícia inexistente.' }, { status: 404 });
  const noStore = { 'Cache-Control': 'private, no-store' };

  if (!(await loadExclusivas()).includes(slug)) return NextResponse.json({ access: true, html: post.content }, { headers: noStore });

  const session = await leitorActual();
  if (!session) return NextResponse.json({ access: false, reason: 'login' }, { headers: noStore });
  if (!(await podeLerExclusivas(session))) return NextResponse.json({ access: false, reason: 'plano' }, { headers: noStore });
  return NextResponse.json({ access: true, html: post.content }, { headers: noStore });
}
