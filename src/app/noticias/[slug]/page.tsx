import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarCheck, Mail, Share2, User } from 'lucide-react';
import { getAllPosts, getPost, getRelated, longDatePt } from '@/lib/news-data';
import { shareNetworks } from '@/lib/share';
import { CategoryTag, SectionHeading, SiteSidebar } from '@/components/Site/parts';
import { NewsCard } from '@/components/Expnews/blocks';
import ExpShell from '@/components/Expnews/Shell';
import PageHeaderCard from '@/components/Expnews/PageHeaderCard';
import PrintButton from '@/components/Site/PrintButton';
import CommentsSection from '@/components/Comments/CommentsSection';
import { InnerSidebar } from '@/components/Expnews/InnerPage';

export const revalidate = 60;

/** Origem usada nos links de partilha. Fixa (sem ler os cabeçalhos do pedido) para a página poder ficar em cache. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://entrecamposblog.com').replace(/\/$/, '');

/** As notícias mais recentes ficam geradas no deploy; as restantes geram-se no primeiro acesso e ficam em cache. */
export async function generateStaticParams() {
  const { posts } = await getAllPosts();
  return posts.slice(0, 20).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) return { title: 'Notícia não encontrada — EntreCAMPOS' };
  return {
    title: `${post.title} — EntreCAMPOS`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: post.image ? [post.image] : [] },
  };
}

/** Modelo único de leitura: serve todas as notícias (/noticias/<slug>). */
export default async function PaginaDeLeitura({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  const related = await getRelated(post, 4);
  const url = encodeURIComponent(`${SITE_URL}/noticias/${post.slug}`);
  const text = encodeURIComponent(post.title);

  const shares = shareNetworks(url, text);

  return (
    <ExpShell backdrop={post.image}>
    <main className="mx-3 pb-6">
    <div className="mx-auto max-w-[1280px]">
      <PageHeaderCard
        title={post.category}
        trail={[{ label: 'Notícias', href: '/noticias' }, { label: post.category, href: `/categoria/${post.categorySlug}` }, { label: post.title }]}
      />
      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <article className="min-w-0 bg-white">
          {post.image && (
            <div className="border-b-[6px] border-red-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image} alt={post.title} className="max-h-[420px] w-full object-cover" />
            </div>
          )}
          <div className="px-5 pb-8 pt-6 sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryTag label={post.category} slug={post.categorySlug} className="text-[13px]" />
              {post.extraCategories.map((c) => (
                <CategoryTag key={c.slug} label={c.label} slug={c.slug} className="text-[13px]" />
              ))}
            </div>
            <h1 className="mt-3 text-[28px] font-bold leading-tight text-gray-800 sm:text-[34px]">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-5 border-b border-gray-200 pb-3 text-[13px] text-gray-600">
              <span className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-red-600" />
                {post.edited ? 'Editado a' : 'Publicado a'}{' '}
                {new Date(post.edited || post.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-red-600" />
                {post.author}
              </span>
            </div>

            <div
              className="blog-details mt-6 text-[15px] leading-7 text-gray-500 [&_a]:text-[#008000] [&_a]:underline [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-8">
              <h3 className="flex items-center gap-2 border-b border-gray-200 pb-3 text-[18px] font-bold uppercase text-[#1a3d0c]">
                <Share2 className="h-5 w-5" />
                Partilhar
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {shares.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Partilhar no ${s.label}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${s.bg} text-white hover:opacity-90`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d={s.icon} />
                    </svg>
                  </a>
                ))}
                <a
                  href={`mailto:?subject=${text}&body=${url}`}
                  aria-label="Partilhar por email"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ea4335] text-white hover:opacity-90"
                >
                  <Mail className="h-4 w-4" />
                </a>
                <PrintButton />
              </div>
            </div>

            <CommentsSection slug={post.slug} title={post.title} />
          </div>
        </article>

        <InnerSidebar />
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-4">
            <SectionHeading>Também pode ler</SectionHeading>
            <span className="h-px flex-1 bg-white/70" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <NewsCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
    </main>
    </ExpShell>
  );
}
