import Link from 'next/link';
import { Play } from 'lucide-react';
import ExpShell from '@/components/Expnews/Shell';
import ExpSlider from '@/components/Expnews/ExpSlider';
import ShareLink from '@/components/Expnews/ShareLink';
import CardCarousel from '@/components/Expnews/CardCarousel';
import { CardTitle, ListItem, Meta, NewsCard, Tag, Thumb, longDate } from '@/components/Expnews/blocks';
import CategorySection, { type CategoryGroup } from '@/components/Expnews/CategorySection';
import CategorySlide from '@/components/Expnews/CategorySlide';
import NewsTicker from '@/components/Expnews/NewsTicker';
import StickyColumn from '@/components/Expnews/StickyColumn';
import { categoryLabel, getFeatured, getHomePosts, type Post } from '@/lib/news-data';

export const metadata = {
  title: 'EntreCAMPOS — Jornal',
  description: 'Jornal EntreCAMPOS',
};

export const revalidate = 60;

const RED = 'bg-[#d6101c]';

/** Reparte as notícias pelas secções sem repetir, preferindo as categorias indicadas. */
function makePool(posts: Post[]) {
  const rest = [...posts];
  return {
    take(count: number, prefer: string[] = []) {
      const chosen: Post[] = [];
      for (const slug of prefer) {
        for (let i = 0; i < rest.length && chosen.length < count; ) {
          if (rest[i].categorySlug === slug) chosen.push(...rest.splice(i, 1));
          else i++;
        }
      }
      while (chosen.length < count && rest.length) chosen.push(rest.shift() as Post);
      // Se houver menos notícias do que lugares, reutiliza as já escolhidas.
      for (let i = 0; chosen.length < count && posts.length; i++) chosen.push(posts[i % posts.length]);
      return chosen;
    },
  };
}

/** Cartão de secção com padding interior. Com `plain`, só o título fica no fundo da página e os itens são cards soltos. */
function Card({ title, children, className = '', plain = false }: { title: string; children: React.ReactNode; className?: string; plain?: boolean }) {
  if (plain) {
    return (
      <section className={className}>
        <div className="mb-3">
          <CardTitle>{title}</CardTitle>
        </div>
        {children}
      </section>
    );
  }
  return (
    <section className={`overflow-hidden bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <CardTitle>{title}</CardTitle>
      </div>
      {children}
    </section>
  );
}

/** Imagem com título sobreposto e etiqueta vermelha. */
function Overlay({
  post,
  className = '',
  titleClass = 'text-[13px]',
  share = false,
}: {
  post: Post;
  className?: string;
  titleClass?: string;
  share?: boolean;
}) {
  const href = `/noticias/${post.slug}`;
  // A ligação cobre o card; a etiqueta e o botão de partilha ficam por cima (um <a>/<button> não pode estar dentro de outro <a>).
  return (
    <div className={`group relative overflow-hidden bg-gray-300 ${className}`}>
      <Thumb src={post.image} className="transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <Link href={href} aria-label={post.title} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white">
        <div className="pointer-events-auto mb-2 w-fit">
          <Tag label={post.category} slug={post.categorySlug} />
        </div>
        <h4 className={`line-clamp-3 font-bold leading-snug ${titleClass}`}>{post.title}</h4>
        {share && (
          <div className="pointer-events-auto mt-2 w-fit text-[10px] font-medium">
            <ShareLink path={href} title={post.title} className="text-white/85 hover:text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

function AdBand() {
  return (
    <div className="flex h-[88px] items-center justify-center bg-[#dcdcdc] text-[15px] font-bold uppercase italic tracking-[0.25em] text-gray-400">
      Espaço publicitário
    </div>
  );
}

export default async function HomePrincipal() {
  const [slides, { posts }] = await Promise.all([getFeatured(), getHomePosts()]);

  if (posts.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center text-gray-500">
        Sem notícias disponíveis de momento.
      </main>
    );
  }

  // As notícias do slide não se repetem nas secções abaixo.
  const inSlides = new Set(slides.map((p) => p.slug));
  const pool = makePool(posts.filter((p) => !inSlides.has(p.slug)));
  const hot = pool.take(4);
  const watch = pool.take(5);
  const food = pool.take(5, ['receitas', 'curiosidade']);
  const entertainment = pool.take(3, ['curiosidade', 'oportunidades']);
  const recent = pool.take(3);
  // Últimas notícias publicadas (carrossel), sem as do slide principal.
  const latest = posts.filter((p) => !inSlides.has(p.slug)).slice(0, 9);
  // Mais lidas: pelas leituras registadas; sem contagem (tudo a 0) ficam as mais recentes.
  const popular = [...posts].sort((a, b) => b.views - a.views || b.date.localeCompare(a.date)).slice(0, 4);
  const tickerPosts = posts.slice(0, 12).map((p) => ({ slug: p.slug, title: p.title }));

  const slim = (p: Post) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt.slice(0, 220), category: p.category, categorySlug: p.categorySlug, image: p.image, date: p.date });
  // Cada categoria vive numa só secção: as famílias abaixo não se repetem entre si.
  const family = (slugs: string[]): CategoryGroup[] =>
    slugs.map((slug) => ({ slug, label: categoryLabel(slug), posts: posts.filter((p) => p.categorySlug === slug).map(slim) }));
  const communityGroups = family(['comunidade', 'ambiente', 'desenvolvimento-local', 'apoio-comunitario', 'turismo-rural', 'meios-de-vida']);
  const agroGroups = family(['agricultura', 'fruticultura', 'agro-negocio', 'mulher-agrario', 'sector-agrario']);
  // Cards ao lado do slide principal: últimas notícias (até 5) de Comunidade e de Agricultura que não estão no slide.
  const heroLatest = (slug: string) => posts.filter((p) => p.categorySlug === slug && !inSlides.has(p.slug)).slice(0, 5).map(slim);
  const newsletterBg = (slides[1] ?? slides[0] ?? posts[0]).image;

  return (
    <ExpShell backdrop={newsletterBg}>
        <main className="mx-3 space-y-3 pb-3">
          <div className="mx-auto max-w-[1280px] space-y-3">
            <NewsTicker posts={tickerPosts} />

            {/* Cabeçalho: slide das últimas notícias em destaque + 2 cards à direita (Comunidade e Agricultura) */}
            <div className="grid gap-3 md:auto-rows-[215px] md:grid-cols-[2fr_1fr]">
              <ExpSlider posts={slides} className="h-[280px] md:row-span-2 md:h-full" />
              <CategorySlide posts={heroLatest('comunidade')} label="Comunidade" className="h-[215px]" />
              <CategorySlide posts={heroLatest('agricultura')} label="Agricultura" className="h-[215px]" />
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
              {/* Coluna principal */}
              <div className="min-w-0 space-y-3">
                <CategorySection groups={communityGroups} />

                <Card title="Últimas notícias" plain>
                  <CardCarousel>
                    {latest.map((p) => (
                      <NewsCard key={p.slug} post={p} />
                    ))}
                  </CardCarousel>
                </Card>

                <CategorySection groups={agroGroups} layout="grelha" />

                <AdBand />

                <Card title="Ver agora">
                  <div className="grid bg-black md:grid-cols-[1.75fr_1fr]">
                    <Link href={`/noticias/${watch[0].slug}`} className="group relative block h-[260px] md:h-[330px]">
                      <Thumb src={watch[0].image} />
                      <div className="absolute inset-0 bg-black/25" />
                      <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#d6101c] text-white transition-transform group-hover:scale-110">
                        <Play className="ml-0.5 h-6 w-6 fill-white" />
                      </span>
                    </Link>
                    <div className="flex flex-col bg-[#1a1a1a] text-white">
                      <Link href={`/noticias/${watch[0].slug}`} className={`${RED} flex items-start gap-3 p-4 text-[11px] font-bold leading-snug`}>
                        <Play className="mt-0.5 h-4 w-4 shrink-0 fill-white" />
                        <span className="line-clamp-3">{watch[0].title}</span>
                      </Link>
                      <ul className="flex-1 divide-y divide-white/10">
                        {watch.slice(1).map((p) => (
                          <li key={p.slug}>
                            <Link href={`/noticias/${p.slug}`} className="flex gap-3 p-3 hover:bg-white/5">
                              <span className="relative h-[46px] w-[60px] shrink-0 overflow-hidden bg-gray-700">
                                <Thumb src={p.image} />
                              </span>
                              <span className="min-w-0">
                                <span className="line-clamp-2 text-[10px] font-bold leading-snug">{p.title}</span>
                                <span className="mt-1 block text-[9px] text-gray-400">{p.category}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card title="Curiosidades" plain>
                  <ul className="space-y-3">
                    {entertainment.map((p) => (
                      <li key={p.slug} className="grid gap-4 bg-white p-4 shadow-sm sm:grid-cols-[210px_1fr]">
                        <Link href={`/noticias/${p.slug}`} className="relative block h-[150px] overflow-hidden bg-gray-200 sm:h-auto sm:min-h-[140px]">
                          <Thumb src={p.image} />
                        </Link>
                        <div>
                          <Tag label={p.category} slug={p.categorySlug} />
                          <Link href={`/noticias/${p.slug}`}>
                            <h4 className="mt-2 text-[14px] font-bold leading-snug hover:text-[#d6101c]">{p.title}</h4>
                          </Link>
                          <div className="mt-2">
                            <Meta post={p} />
                          </div>
                          {p.excerpt && <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{p.excerpt}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Coluna secundária */}
              <StickyColumn className="min-w-0 space-y-3">
                <Card title="Mais quente">
                  <Overlay post={hot[0]} className="h-[200px]" titleClass="text-[13px]" />
                  <ul className="divide-y divide-gray-100">
                    {hot.slice(1).map((p) => (
                      <li key={p.slug} className="py-3">
                        <Link href={`/noticias/${p.slug}`} className="line-clamp-2 text-[11px] font-bold leading-snug hover:text-[#d6101c]">
                          {p.title}
                        </Link>
                        <div className="mt-1">
                          <Meta post={p} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card title="Sabores e receitas">
                  <Overlay post={food[0]} className="h-[170px]" titleClass="text-[12px]" />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {food.slice(1).map((p) => (
                      <Link key={p.slug} href={`/noticias/${p.slug}`} className="group block bg-white">
                        <span className="relative block h-[80px] overflow-hidden bg-gray-200">
                          <Thumb src={p.image} className="transition-transform group-hover:scale-105" />
                        </span>
                        <span className="line-clamp-3 block pt-2 text-[10px] font-bold leading-snug group-hover:text-[#d6101c]">
                          {p.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </Card>

                <Card title="Publicações recentes">
                  <Overlay post={recent[0]} className="h-[170px]" titleClass="text-[12px]" />
                  <ul className="divide-y divide-gray-100">
                    {recent.slice(1).map((p) => (
                      <ListItem key={p.slug} post={p} thumb="h-[56px] w-[80px]" card={false} />
                    ))}
                  </ul>
                </Card>

                <Card title="Mais lidas">
                  <ul className="space-y-3">
                    {popular.map((p) => (
                      <li key={p.slug} className="flex gap-3">
                        <Link href={`/noticias/${p.slug}`} className="relative block h-[75px] w-[100px] shrink-0 overflow-hidden bg-gray-200">
                          <Thumb src={p.image} />
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/noticias/${p.slug}`} className="line-clamp-3 text-[12px] font-bold leading-snug hover:text-[#d6101c]">
                            {p.title}
                          </Link>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Tag label={p.category} slug={p.categorySlug} className="!text-[9px]" />
                            <span className="text-[10px] italic text-[#d6101c]">{longDate(p.date)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </StickyColumn>
            </div>

            <AdBand />
          </div>
        </main>

    </ExpShell>
  );
}
