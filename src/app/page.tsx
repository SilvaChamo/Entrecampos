import Link from 'next/link';
import { Clock, Play } from 'lucide-react';
import ExpShell from '@/components/Expnews/Shell';
import ExpSlider from '@/components/Expnews/ExpSlider';
import ShareLink from '@/components/Expnews/ShareLink';
import CategoryBadge from '@/components/Expnews/CategoryBadge';
import CardCarousel from '@/components/Expnews/CardCarousel';
import { getFeatured, getHomePosts, type Post } from '@/lib/news-data';

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

function longDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.14em] text-[#222]">
      <span className="h-[18px] w-[5px] bg-[#d6101c]" />
      {children}
      <span className="h-px flex-1 bg-gray-300" />
    </h3>
  );
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
    <section className={`overflow-hidden bg-white p-5 border border-gray-300 shadow-md ${className}`}>
      <div className="mb-4">
        <CardTitle>{title}</CardTitle>
      </div>
      {children}
    </section>
  );
}

function Tag({ label, slug, className = '' }: { label: string; slug?: string; className?: string }) {
  return (
    <CategoryBadge label={label} slug={slug} className={`text-[11px] ${className}`} />
  );
}

function Meta({ post, share = true, light = false }: { post: Post; share?: boolean; light?: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-[10px] italic ${light ? 'text-white/80' : 'text-[#d6101c]'}`}>
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Publicado a {longDate(post.date)}
      </span>
      {share && <ShareLink path={`/noticias/${post.slug}`} title={post.title} className={light ? 'text-white/80' : 'text-gray-500'} />}
    </div>
  );
}

function Thumb({ src, className = '' }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" className={`absolute inset-0 h-full w-full object-cover ${className}`} />
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

function ListItem({
  post,
  thumb = 'h-[62px] w-[90px]',
  card = false,
  bleed = false,
  as: Tag2 = 'li',
}: {
  post: Post;
  thumb?: string;
  card?: boolean;
  /** Card com a imagem encostada aos bordos (sem padding à volta da imagem). */
  bleed?: boolean;
  as?: 'li' | 'div';
}) {
  const href = `/noticias/${post.slug}`;
  if (bleed) {
    return (
      <Tag2 className="flex h-full overflow-hidden bg-white border border-gray-300 shadow-md">
        <Link href={href} className="relative w-[110px] shrink-0 self-stretch overflow-hidden bg-gray-200">
          <Thumb src={post.image} />
        </Link>
        <div className="flex min-w-0 flex-col justify-center p-3">
          <Link href={href} className="line-clamp-2 text-[12px] font-bold leading-snug hover:text-[#d6101c]">
            {post.title}
          </Link>
          <div className="mt-1">
            <Meta post={post} />
          </div>
        </div>
      </Tag2>
    );
  }
  return (
    <Tag2 className={`flex gap-3 ${card ? 'h-full items-center bg-white p-3 border border-gray-300 shadow-md' : 'py-3'}`}>
      <Link href={href} className={`relative shrink-0 overflow-hidden bg-gray-200 ${thumb}`}>
        <Thumb src={post.image} />
      </Link>
      <div className="min-w-0">
        <Link href={href} className="line-clamp-2 text-[12px] font-bold leading-snug hover:text-[#d6101c]">
          {post.title}
        </Link>
        <div className="mt-1">
          <Meta post={post} />
        </div>
      </div>
    </Tag2>
  );
}

function AdBand() {
  return (
    <div className="flex h-[88px] items-center justify-center border border-dashed border-gray-500 bg-[#c9cdd1] text-[15px] font-bold uppercase italic tracking-[0.25em] text-gray-500">
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
  const heroSide = pool.take(2);
  const lifestyle = pool.take(6, ['comunidade']);
  const world = pool.take(9, ['agricultura']);
  const hot = pool.take(4, ['agro-negocio']);
  const watch = pool.take(5);
  const food = pool.take(5, ['receitas', 'fruticultura', 'curiosidade']);
  const entertainment = pool.take(3, ['curiosidade', 'oportunidades']);
  const recent = pool.take(3);
  const newsletterBg = (slides[1] ?? slides[0] ?? posts[0]).image;

  return (
    <ExpShell backdrop={newsletterBg}>
        <main className="mx-3 space-y-3 pb-3">
          <div className="mx-auto max-w-[1240px] space-y-4">
            {/* Cabeçalho: slide das últimas notícias em destaque + 2 cards verticais à direita */}
            <div className="grid gap-4 md:auto-rows-[215px] md:grid-cols-[2fr_1fr]">
              <ExpSlider posts={slides} className="h-[280px] md:row-span-2 md:h-full" />
              {heroSide.map((p) => (
                <Overlay key={p.slug} post={p} className="h-[215px]" titleClass="text-[14px]" share />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              {/* Coluna principal */}
              <div className="min-w-0 space-y-4">
                <Card title="Comunidade" plain>
                  <div className="grid gap-4 md:grid-cols-[1.05fr_1fr]">
                    <article className="bg-white p-4 border border-gray-300 shadow-md">
                      <Link href={`/noticias/${lifestyle[0].slug}`} className="relative block h-[240px] overflow-hidden bg-gray-200">
                        <Thumb src={lifestyle[0].image} />
                      </Link>
                      <div className="pt-4">
                        <Tag label={lifestyle[0].category} slug={lifestyle[0].categorySlug} />
                        <Link href={`/noticias/${lifestyle[0].slug}`}>
                          <h4 className="mt-2 text-[16px] font-bold leading-snug hover:text-[#d6101c]">{lifestyle[0].title}</h4>
                        </Link>
                        <div className="mt-2">
                          <Meta post={lifestyle[0]} />
                        </div>
                        {lifestyle[0].excerpt && (
                          <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-gray-500">{lifestyle[0].excerpt}</p>
                        )}
                      </div>
                    </article>
                    {/* Mesma altura do card principal, independente do conteúdo */}
                    <div className="relative h-[540px] md:h-auto">
                      <div className="absolute inset-0 flex flex-col gap-4">
                        {lifestyle.slice(1).map((p) => (
                          <div key={p.slug} className="min-h-0 flex-1">
                            <ListItem as="div" post={p} bleed />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="Agricultura" plain>
                  <CardCarousel>
                    {world.map((p) => (
                      <article key={p.slug} className="h-full bg-white p-4 border border-gray-300 shadow-md">
                        <Link href={`/noticias/${p.slug}`} className="relative block h-[150px] overflow-hidden bg-gray-200">
                          <Thumb src={p.image} />
                        </Link>
                        <div className="pt-3">
                          <Tag label={p.category} slug={p.categorySlug} />
                          <Link href={`/noticias/${p.slug}`}>
                            <h4 className="mt-2 line-clamp-3 text-[12px] font-bold leading-snug hover:text-[#d6101c]">{p.title}</h4>
                          </Link>
                          <div className="mt-2">
                            <Meta post={p} />
                          </div>
                        </div>
                      </article>
                    ))}
                  </CardCarousel>
                </Card>

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
                  <ul className="space-y-4">
                    {entertainment.map((p) => (
                      <li key={p.slug} className="grid gap-4 bg-white p-4 border border-gray-300 shadow-md sm:grid-cols-[210px_1fr]">
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
              <div className="min-w-0 space-y-4">
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
                  <div className="grid grid-cols-2 gap-px bg-gray-200">
                    {food.slice(1).map((p) => (
                      <Link key={p.slug} href={`/noticias/${p.slug}`} className="group block bg-white py-3 pr-2">
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
              </div>
            </div>

            <AdBand />
          </div>
        </main>

    </ExpShell>
  );
}
