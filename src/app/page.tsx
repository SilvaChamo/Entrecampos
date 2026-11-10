import React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import ExpShell from '@/components/Expnews/Shell';
import ExpSlider from '@/components/Expnews/ExpSlider';
import ShareLink from '@/components/Expnews/ShareLink';
import { CardTitle, ListItem, Meta, NewsCard, Tag, Thumb, longDate } from '@/components/Expnews/blocks';
import CategorySection, { type CategoryGroup } from '@/components/Expnews/CategorySection';
import SideSlides from '@/components/Expnews/SideSlides';
import ReadingSuggestions from '@/components/Expnews/ReadingSuggestions';
import WeatherCard from '@/components/Expnews/WeatherCard';
import OpportunityList from '@/components/Expnews/OpportunityList';
import NewsletterForm from '@/components/Forms/NewsletterForm';
import NewsTicker from '@/components/Expnews/NewsTicker';
import StickyColumn from '@/components/Expnews/StickyColumn';
import { getSuggestionSlugs } from '@/lib/suggestions';
import { getHomeLayout, type HomeZone } from '@/lib/home-layout';
import { getHomeCategories } from '@/lib/home-categories';
import { getHomeOptions } from '@/lib/home-options';
import { HOME_CATEGORY_SLOTS, baseId, isAdId, slotKey, slotsFor } from '@/lib/home-sections';
import CardsCarousel from '@/components/Expnews/CardsCarousel';
import HomeAd from '@/components/Expnews/HomeAd';
import HeroList from '@/components/Expnews/HeroList';
import HeroCarousel from '@/components/Expnews/HeroCarousel';
import { categoryLabel, getFeatured, getHomePosts, type Post } from '@/lib/news-data';

export const metadata = {
  title: 'EntreCAMPOS — Jornal',
  description: 'Jornal EntreCAMPOS',
};

export const revalidate = 604800; // 7 dias; gravar no painel limpa já o cache (lib/refresh-site.ts)

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
    <section className={`ec-reveal overflow-hidden bg-white p-5 shadow-sm ${className}`}>
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

export default async function HomePrincipal() {
  const [featured, { posts: homePosts }, suggestSlugs, layout, cats, options] = await Promise.all([getFeatured(), getHomePosts(), getSuggestionSlugs(), getHomeLayout(), getHomeCategories(), getHomeOptions()]);
  // Artigos de opinião (muitos sem foto) não se misturam com as notícias da home: só aparecem na categoria Opinião.
  const notOpinion = (p: Post) => p.categorySlug !== 'opiniao' && !p.extraCategories.some((c) => c.slug === 'opiniao');
  const slides = featured.filter(notOpinion);
  const posts = homePosts.filter(notOpinion);
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
  // "Mais quente" já está no slide principal: este card da barra lateral mostra outra categoria.
  const hot = pool.take(4, cats.internacional);
  const watch = pool.take(5);
  const food = pool.take(5, cats.sabores);
  // Publicações recentes da barra lateral: a Entrevista primeiro, depois as mais recentes.
  const recent = pool.take(3, cats.recentes);
  // Últimas notícias publicadas (carrossel), sem as do slide principal.
  // Últimas notícias: 6 cards parados (sem slide), sem as do slide principal.
  // Mais lidas: pelas leituras registadas; sem contagem (tudo a 0) ficam as mais recentes.
  // Sem as do "Mais quente": as duas listas nunca repetem notícias.
  const inHot = new Set(hot.map((p) => p.slug));
  const popular = posts
    .filter((p) => !inHot.has(p.slug))
    .sort((a, b) => b.views - a.views || b.date.localeCompare(a.date))
    .slice(0, 4);
  const tickerPosts = posts.slice(0, 12).map((p) => ({ slug: p.slug, title: p.title }));

  const slim = (p: Post) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt.slice(0, 220), category: p.category, categorySlug: p.categorySlug, image: p.image, date: p.date });
  // Cada categoria vive numa só secção: as famílias abaixo não se repetem entre si.
  const family = (slugs: string[]): CategoryGroup[] =>
    slugs.map((slug) => ({ slug, label: categoryLabel(slug), posts: posts.filter((p) => p.categorySlug === slug).map(slim) }));
  // Cards ao lado do slide principal: últimas notícias (até 5) de Comunidade e de Oportunidades que não estão no slide.
  const heroList = (slug: string) => posts.filter((p) => p.categorySlug === slug && !inSlides.has(p.slug)).slice(0, 12).map(slim);
  const heroLatest = (slug: string) => posts.filter((p) => p.categorySlug === slug && !inSlides.has(p.slug)).slice(0, 5).map(slim);
  // Categorias e opções de uma secção (ou da sua cópia): as escolhidas no painel ou, sem escolha, as de origem.
  const catsOf = (id: string) => cats[id] ?? slotsFor(id)[0]?.defaults ?? [];
  const settingsOf = (id: string) => options.sections[id] ?? {};
  const inCategory = (p: Post, slug: string) => p.categorySlug === slug || p.extraCategories.some((c) => c.slug === slug);
  // Sugestões de leitura (fim da página): as notícias activadas no painel; enquanto nenhuma estiver activada, as mais recentes. O navegador escolhe 8 à sorte.
  const activated = posts.filter((p) => suggestSlugs.has(p.slug));
  const suggestions = (activated.length > 0 ? activated : posts.slice(0, 60)).map(slim);
  const newsletterBg = (slides[1] ?? slides[0] ?? posts[0]).image;

  // Título das secções que mostram categorias à escolha: o de origem enquanto têm as categorias de origem; senão, os nomes das categorias.
  const titleOf = (key: string, original: string) => {
    const slot = HOME_CATEGORY_SLOTS.find((x) => x.key === key);
    return slot && cats[key].join() === slot.defaults.join() ? original : cats[key].map((c) => categoryLabel(c)).join(' e ');
  };

  // Cada secção da home, por nome. A zona e a ordem em que aparecem vêm do painel (Página inicial); ver lib/home-layout.ts.
  const sections: Record<string, React.ReactNode> = {
    clima: (
                <WeatherCard />
    ),
    sabores: (
                <Card title={titleOf('sabores', 'Sabores e curiosidades')}>
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
    ),
    recentes: (
                <Card title={titleOf('recentes', 'Publicações recentes')}>
                  <Overlay post={recent[0]} className="h-[170px]" titleClass="text-[12px]" />
                  <ul className="divide-y divide-gray-100">
                    {recent.slice(1).map((p) => (
                      <ListItem key={p.slug} post={p} thumb="h-[56px] w-[80px]" card={false} />
                    ))}
                  </ul>
                </Card>
    ),
    'ver-agora': (
                <Card title="Ver agora">
                  <div className="grid bg-black md:grid-cols-[1.75fr_1fr]">
                    <Link href={`/noticias/${watch[0].slug}`} className="group relative block h-[260px] md:h-auto md:min-h-[330px]">
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
    ),
    internacional: (
                <Card title={categoryLabel(cats.internacional[0])}>
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
    ),
    'mais-lidas': (
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
                            <span className="text-[10px] text-[#d6101c]">{longDate(p.date)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
    ),
    newsletter: (
                <Card title="Newsletter">
                  <p className="mb-3 text-[12px] leading-relaxed text-gray-600">
                    Receba no seu e-mail as notícias do dia, todas as noites às 20h.
                  </p>
                  <NewsletterForm variant="light" />
                </Card>
    ),
    sugestoes: (
            <ReadingSuggestions posts={suggestions} />
    ),
  };
  // Secções com categoria e opções próprias (as originais e as cópias feitas no painel): `id` é o da secção ou o da cópia.
  // O destaque são três peças independentes (slide, cards, lista): cada uma pode ser copiada e posta onde se quiser.
  // Se o slide vem logo a seguir aos cards (ou à lista), numa zona larga, ficam lado a lado como sempre foram.
  const WIDE: HomeZone[] = ['top', 'main', 'main2', 'bottom'];
  const carousel = options.heroStyle === 'carrossel' || options.heroStyle === 'carrossel-conteudo';
  const heroSideLeft = options.heroSide === 'cards-esquerda';
  const catAt = (id: string, key: string) => cats[slotKey(id, key)]?.[0] ?? HOME_CATEGORY_SLOTS.find((x) => x.key === key)?.defaults[0] ?? 'todas';
  // Cada card ao lado do slide é uma peça própria (cada um copia-se à parte): o de cima usa o lugar «hero1», o de baixo «hero2».
  const isCard = (id: string) => baseId(id).startsWith('destaque-card');
  const cardItem = (id: string) => {
    const key = baseId(id) === 'destaque-card1' ? 'hero1' : 'hero2';
    return { posts: heroLatest(catAt(id, key)), label: categoryLabel(catAt(id, key)) };
  };
  const listNode = (id: string, className: string) => <HeroList posts={heroList(catAt(id, 'herolista'))} label={categoryLabel(catAt(id, 'herolista'))} className={className} />;
  const slideNode = (className: string) =>
    carousel ? <HeroCarousel posts={slides} fullWidth={options.heroStyle === 'carrossel'} /> : <ExpSlider posts={slides} className={className} />;
  const factories: Record<string, (id: string, zone?: HomeZone) => React.ReactNode> = {
    destaque: () => slideNode('h-[340px] md:h-[442px]'),
    'destaque-card1': (id) => <SideSlides items={[cardItem(id)]} className="h-[215px]" />,
    'destaque-card2': (id) => <SideSlides items={[cardItem(id)]} className="h-[215px]" />,
    'destaque-lista': (id) => listNode(id, 'h-[420px]'),
    comunidade: (id) => <CategorySection groups={family(catsOf(id))} arrowsOnTop />,
    agro: (id) => <CategorySection groups={family(catsOf(id))} layout="grelha" arrowsOnTop reveal />,
    'agro-negocio': (id) => {
      const slug = catsOf(id)[0];
      return <CategorySection groups={[{ slug, label: categoryLabel(slug), posts: posts.filter((p) => inCategory(p, slug)).map(slim) }]} arrowsOnTop />;
    },
    oportunidades: (id) => {
      const slug = catsOf(id)[0];
      // Todas as notícias da categoria (fora do slide principal), até ao número escolhido no painel, 6 por página.
      const list = posts.filter((p) => p.categorySlug === slug && !inSlides.has(p.slug)).slice(0, settingsOf(id).count ?? 60).map(slim);
      return (
        <Card title={categoryLabel(slug)} plain>
          <OpportunityList posts={list} />
        </Card>
      );
    },
    ultimas: (id) => {
      const slug = catsOf(id)[0];
      const { rows = 2, carousel = false } = settingsOf(id);
      // Últimas notícias (de todas as categorias ou da escolhida), sem as do slide principal: 3 cards por linha, no número de linhas escolhido.
      const list = posts.filter((p) => !inSlides.has(p.slug) && (slug === 'todas' || inCategory(p, slug))).slice(0, rows * 3);
      return (
        <Card title={slug === 'todas' ? 'Últimas notícias' : categoryLabel(slug)} plain>
          {carousel ? (
            <CardsCarousel posts={list.map(slim)} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <NewsCard key={p.slug} post={p} />
              ))}
            </div>
          )}
        </Card>
      );
    },
  };
  const nodeOf = (id: string, zone?: HomeZone) => (baseId(id) in factories ? factories[baseId(id)](id, zone) : sections[id]);
  const adOf = (id: string) => options.ads.find((a) => a.id === id);
  // Secções desligadas no painel (olho) não aparecem.
  const visible = (zone: HomeZone) => layout[zone].filter((id) => !options.hidden.includes(id));
  const render = (zone: HomeZone) => {
    const list = visible(zone);
    const out: React.ReactNode[] = [];
    for (let i = 0; i < list.length; i++) {
      const id = list[i];
      const next = list[i + 1];
      // Slide seguido de um ou dois cards, ou de uma lista, numa zona larga: lado a lado (a disposição vem do painel).
      if (!carousel && baseId(id) === 'destaque' && next && WIDE.includes(zone) && (isCard(next) || baseId(next) === 'destaque-lista')) {
        const cols = heroSideLeft ? 'md:grid-cols-[1fr_2fr]' : 'md:grid-cols-[2fr_1fr]';
        const place = heroSideLeft ? ' md:col-start-2 md:row-start-1' : '';
        if (isCard(next)) {
          const cardIds = [next, ...(list[i + 2] && isCard(list[i + 2]) ? [list[i + 2]] : [])];
          out.push(
            <div key={`${id}+${cardIds.join('+')}`} className={`grid gap-3 md:auto-rows-[215px] ${cols}`}>
              <ExpSlider posts={slides} className={`h-[340px] md:row-span-2 md:h-full${place}`} />
              {cardIds.length === 1 ? (
                <div className="h-[215px] md:row-span-2 md:h-full">
                  <SideSlides items={[cardItem(cardIds[0])]} className="h-full" />
                </div>
              ) : (
                <SideSlides items={cardIds.map(cardItem)} className="h-[215px]" />
              )}
            </div>,
          );
          i += cardIds.length;
        } else {
          out.push(
            <div key={`${id}+${next}`} className={`grid gap-3 md:grid-rows-[420px] ${cols}`}>
              <ExpSlider posts={slides} className={`h-[340px] md:h-full${place}`} />
              {listNode(next, 'md:h-full')}
            </div>,
          );
          i++;
        }
        continue;
      }
      // Dois cards seguidos que não vêm depois do slide: lado a lado numa zona larga.
      if (isCard(id) && next && isCard(next) && WIDE.includes(zone)) {
        out.push(
          <div key={`${id}+${next}`} className="grid gap-3 md:grid-cols-2">
            <SideSlides items={[cardItem(id), cardItem(next)]} className="h-[215px]" />
          </div>,
        );
        i++;
        continue;
      }
      out.push(<React.Fragment key={id}>{isAdId(id) ? <HomeAd image={adOf(id)?.image} link={adOf(id)?.link} /> : nodeOf(id, zone)}</React.Fragment>);
    }
    return out;
  };
  // Duas secções de colunas (coluna principal + barra lateral), cada uma com a sua barra lateral fixa.
  const columns = (main: HomeZone, side: HomeZone) => {
    const hasMain = visible(main).length > 0;
    const hasSide = visible(side).length > 0;
    if (!hasMain && !hasSide) return null;
    return (
      <div className={`grid gap-3 ${hasMain && hasSide ? 'lg:grid-cols-[1fr_340px]' : ''}`}>
        {hasMain && <div className="min-w-0 space-y-3">{render(main)}</div>}
        {hasSide && <StickyColumn className="min-w-0 space-y-3">{render(side)}</StickyColumn>}
      </div>
    );
  };

  return (
    <ExpShell backdrop={newsletterBg}>
        <main className="space-y-3 pb-3">
          {/* -mt-3 anula o espaço do cabeçalho: a faixa fica colada à barra de menu, na largura toda; o conteúdo dela fica na largura do conteúdo. */}
          <div className="-mt-3">
            <NewsTicker posts={tickerPosts} />
          </div>
          {/* Com o carrossel na largura da página, esta caixa serve de referência (100cqw) para o carrossel sair do conteúdo até aos lados do ecrã. */}
          <div className={`mx-3${options.heroStyle === 'carrossel' ? ' [container-type:inline-size]' : ''}`}>
          <div className="mx-auto max-w-[1280px] space-y-3">
            {render('top')}

            {columns('main', 'side')}

            {columns('main2', 'side2')}

            {render('bottom')}
          </div>
          </div>
        </main>

    </ExpShell>
  );
}
