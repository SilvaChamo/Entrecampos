import { NextRequest, NextResponse } from 'next/server';
import { cleanText, clientIp, guardForm, hashIp, isEmail, serverDb, tooManyLinks } from '@/lib/antispam';
import { getAllPosts } from '@/lib/news-data';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';

/** Comentário numa notícia: validado, protegido contra spam e guardado "pendente" até o painel o aprovar. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const guard = await guardForm(req, body, 'comentario');
    if (!guard.ok) return guard.silent ? NextResponse.json({ ok: true }) : NextResponse.json({ error: guard.error }, { status: guard.status });

    const slug = cleanText(body.slug, 300);
    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 254).toLowerCase();
    const content = cleanText(body.content, 3000);
    let website = cleanText(body.website, 200);
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;

    if (!name || !isEmail(email) || content.length < 2) {
      return NextResponse.json({ error: 'Preencha o nome, um e-mail válido e o comentário.' }, { status: 400 });
    }
    if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) website = '';
    if (tooManyLinks(content)) {
      return NextResponse.json({ error: 'O comentário tem demasiadas ligações.' }, { status: 400 });
    }

    const { posts } = await getAllPosts();
    if (!posts.some((p) => p.slug === slug)) return NextResponse.json({ error: 'Notícia não encontrada.' }, { status: 404 });

    const { error } = await serverDb().from('comments').insert({
      site_id: SITE_ID,
      news_slug: slug,
      name,
      email,
      website: website || null,
      content,
      status: 'pending',
      ip_hash: hashIp(clientIp(req)),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, message: 'Comentário recebido. Fica visível depois de aprovado.' });
  } catch {
    return NextResponse.json({ error: 'Não foi possível enviar o comentário. Tente mais tarde.' }, { status: 500 });
  }
}
