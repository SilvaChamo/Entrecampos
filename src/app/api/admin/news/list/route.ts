import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';
import { getAllPosts } from '@/lib/news-data';

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Lista de notícias do painel. Lê do Supabase no servidor (com a sessão do painel a decidir
 * quem pode ver); se o Supabase recusar ou estiver inacessível, mostra a cópia local do site.
 */
export async function GET() {
  const guard = await requireAuth('ler_artigos');
  if ('error' in guard) return guard.error;

  try {
    // Tabela base (mais rápida que a vista `news`). Colunas opcionais que ainda possam não existir na tabela
    // (autor, estado) vão caindo uma a uma; sem `status`, todas contam como publicadas.
    const base = 'id,title,slug,category,date,image_url,summary,views';
    let data: any[] | null = null;
    let error: { message: string } | null = null;
    for (const extra of [',status,author_name', ',status', '']) {
      const res = await supabaseAdmin.from('news').select(`${base}${extra}`).eq('site_id', SITE_ID).order('date', { ascending: false });
      data = res.data as any[] | null;
      error = res.error;
      if (!error || !/status|author_name/i.test(error.message)) break;
    }
    if (!error && data) {
      const items = (data as any[]).map((r) => ({ ...r, status: r.status || 'Published' }));
      return NextResponse.json({ items, source: 'supabase' });
    }
    console.warn('[admin/news/list] Supabase recusou:', error?.message);
  } catch (err) {
    console.warn('[admin/news/list] Supabase inacessível:', err instanceof Error ? err.message : err);
  }

  const { posts } = await getAllPosts();
  const items = posts.map((p) => ({
    id: p.slug,
    title: p.title,
    slug: p.slug,
    category: p.category,
    date: p.date,
    image_url: p.image,
    status: 'Published',
    summary: p.excerpt,
    views: 0,
  }));
  return NextResponse.json({ items, source: 'local' });
}
