'use client';

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CardTitle, ListItem, Meta, NewsCard, Tag, Thumb, WideItem } from '@/components/Expnews/blocks';
import SlideStage from '@/components/Expnews/SlideStage';
import CardsCarousel from '@/components/Expnews/CardsCarousel';
import LoopCarousel from '@/components/Expnews/LoopCarousel';
import VerticalLoop from '@/components/Expnews/VerticalLoop';
import type { Post } from '@/lib/news-data';
import type { SectionLayout } from '@/lib/home-sections';

/** Dados mínimos de cada notícia (o conteúdo completo não vai para o browser). */
export type SlimPost = Pick<Post, 'slug' | 'title' | 'excerpt' | 'category' | 'categorySlug' | 'image' | 'date'>;
export type CategoryGroup = { slug: string; label: string; posts: SlimPost[] };

// Quantas notícias por vista: destaque = 1 grande + 4 ao lado; dois-cards = 2 grandes com 2 pequenas por baixo de cada; grelha = 6 cards iguais (3 por linha).
const pageSizeFor = (layout: SectionLayout, scroll: boolean, rows: number) =>
  layout === 'lista' && scroll ? 30 : layout === 'grelha' ? rows * 3 : layout === 'lista' || layout === 'dois-cards' ? 6 : 5;

function BigCard({ post, imageHeight, reveal = false, fill = false }: { post: SlimPost; imageHeight: string; reveal?: boolean; fill?: boolean }) {
  return (
    // Com `fill`, o card acompanha a altura da lista ao lado (ecrã largo): a imagem ocupa o que sobra depois do texto.
    <article className={`${reveal ? 'ec-reveal ' : ''}bg-white shadow-sm${fill ? ' md:flex md:h-full md:flex-col' : ''}`}>
      <Link href={`/noticias/${post.slug}`} className={`relative block overflow-hidden bg-gray-200 ${imageHeight}`}>
        <Thumb src={post.image} />
      </Link>
      <div className="p-4 md:shrink-0">
        <Tag label={post.category} slug={post.categorySlug} />
        <Link href={`/noticias/${post.slug}`}>
          <h4 className="mt-2 text-[18px] font-bold leading-snug hover:text-[#d6101c]">{post.title}</h4>
        </Link>
        <div className="mt-2">
          <Meta post={post as Post} />
        </div>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-gray-500">{post.excerpt}</p>}
      </div>
    </article>
  );
}

/**
 * Secção de uma família de categorias na home. O selector (canto superior direito) escolhe a categoria;
 * as setas (canto inferior esquerdo) mudam, à mão, o conjunto de 6 notícias para o seguinte.
 *
 * Layouts: lista numa coluna; card principal com a lista em baixo, à direita ou à esquerda; grelha de cards iguais, 3 por linha.
 */
export default function CategorySection({
  groups,
  layout = 'principal-direita',
  listScroll = false,
  listCarousel = false,
  listVisible = 3,
  rows = 2,
  carousel = false,
  arrowsOnTop = false,
  reveal = false,
}: {
  groups: CategoryGroup[];
  layout?: SectionLayout;
  /** Grelha: linhas de 3 cards (2 por omissão). */
  rows?: number;
  /** Grelha: com 1 linha, todas as notícias da categoria numa só linha em carrossel sem fim, um card de cada vez; com mais linhas, as notícias da grelha passam por vistas. */
  carousel?: boolean;
  /** Lista de uma coluna em carrossel vertical: todas as notícias da categoria, em ciclo sem fim. */
  listCarousel?: boolean;
  /** Lista com rolagem ou em carrossel: quantas notícias ficam à vista. */
  listVisible?: number;
  /** Lista de uma coluna com só 3 notícias à vista e as outras numa barra de rolagem (sem setas). */
  listScroll?: boolean;
  /** Setas do slide no canto superior direito, depois do selector (em vez de por baixo da secção). */
  arrowsOnTop?: boolean;
  /** Entra com o mesmo efeito de subida dos outros cards quando chega ao ecrã. */
  reveal?: boolean;
}) {
  const [selected, setSelected] = useState(groups[0]?.slug);
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [open, setOpen] = useState(false);
  // Entrada dos cards (slide up, um a seguir ao outro): só na primeira vez; ao mexer nas setas ou no selector deixa de correr.
  const [revealing, setRevealing] = useState(reveal);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const group = groups.find((g) => g.slug === selected) ?? groups[0];
  if (!group) return null;

  const PAGE = pageSizeFor(layout, listScroll, rows);
  // Os carrosséis levam todas as notícias da categoria e não têm páginas.
  const loopGrid = layout === 'grelha' && carousel && rows === 1;
  const loopList = layout === 'lista' && listCarousel;
  const rollGrid = layout === 'grelha' && carousel && rows > 1;
  const pages = loopGrid || loopList || rollGrid ? 1 : Math.max(1, Math.ceil(group.posts.length / PAGE));
  const go = (direction: 1 | -1) => {
    setDir(direction);
    setRevealing(false);
    setPage((p) => (p + direction + pages) % pages);
  };

  const renderSet = (id: string) => {
    const cut = id.lastIndexOf(':');
    const g = groups.find((x) => x.slug === id.slice(0, cut));
    const visible = (g?.posts ?? []).slice(Number(id.slice(cut + 1)) * PAGE, Number(id.slice(cut + 1)) * PAGE + PAGE);
    if (visible.length === 0) {
      return <p className="bg-white py-14 text-center text-[12px] text-gray-500 shadow-sm">Ainda não há notícias em {g?.label}.</p>;
    }
    if (layout === 'grelha') {
      // Igual à grelha das «Últimas notícias»: cards todos iguais, 3 por linha (2 em ecrãs médios, 1 no telemóvel).
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <NewsCard key={p.slug} post={p as Post} />
          ))}
        </div>
      );
    }
    if (layout === 'dois-cards') {
      // Duas colunas: cada uma com um card e, por baixo dele, duas notícias em lista vertical.
      const columns = [visible.filter((_, i) => i % 2 === 0), visible.filter((_, i) => i % 2 === 1)].filter((c) => c.length > 0);
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {columns.map((col) => (
            <div key={col[0].slug} className="space-y-3">
              <BigCard post={col[0]} imageHeight="h-[195px]" reveal={revealing} />
              {col.slice(1).map((p) => (
                <div key={p.slug} className={`${revealing ? 'ec-reveal ' : ''}h-[96px]`}>
                  <ListItem as="div" post={p as Post} bleed />
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    if (layout === 'lista') {
      return (
        <ul className={`space-y-3${listScroll ? ' max-h-[640px] overflow-y-auto pr-1 sm:max-h-[calc(var(--n)*180px+(var(--n)-1)*12px)]' : ''}`} style={listScroll ? ({ '--n': listVisible } as React.CSSProperties) : undefined}>
          {visible.map((p) => (
            <WideItem key={p.slug} post={p} reveal={revealing} fixed={listScroll} />
          ))}
        </ul>
      );
    }
    if (layout === 'principal-baixo') {
      return (
        <div className="space-y-3">
          <BigCard post={visible[0]} imageHeight="h-[240px]" />
          {visible.length > 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.slice(1, 5).map((p) => (
                <div key={p.slug} className="h-[94px]">
                  <ListItem as="div" post={p as Post} bleed />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    const left = layout === 'principal-esquerda';
    return (
      <div className={`grid gap-3 ${left ? 'md:grid-cols-[1fr_1.05fr]' : 'md:grid-cols-[1.05fr_1fr]'}`}>
        <div className={`flex flex-col md:h-full${left ? ' md:order-2' : ''}`}>
          <BigCard post={visible[0]} imageHeight="h-[240px] md:h-auto md:min-h-[160px] md:flex-1" fill />
        </div>
        {/* Lista junto ao topo do card, cada notícia com a sua altura (nunca esticada ao card todo) */}
        <div className="flex flex-col gap-3 self-start">
          {visible.slice(1, 5).map((p) => (
            <div key={p.slug} className="h-[94px] shrink-0">
              <ListItem as="div" post={p as Post} bleed />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>{group.label}</CardTitle>
        </div>

        {/* Selector de categorias */}
        {groups.length > 1 && (
        <div ref={box} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#d6101c] hover:border-[#d6101c]"
          >
            {group.label}
            <ChevronDown className={`h-3.5 w-3.5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <ul role="listbox" className="absolute right-0 top-full z-30 mt-1 max-h-[320px] w-max min-w-[120px] overflow-y-auto border border-gray-200 bg-white py-1 shadow-xl">
              {groups.map((g) => (
                <li key={g.slug} role="option" aria-selected={g.slug === group.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setDir(1);
                      setRevealing(false);
                      setSelected(g.slug);
                      setPage(0);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[12px] hover:bg-gray-100 hover:text-[#d6101c] ${
                      g.slug === group.slug ? 'font-bold text-[#d6101c]' : 'text-gray-700'
                    }`}
                  >
                    {g.label}
                    {g.slug === group.slug && <Check className="h-3.5 w-3.5" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        )}

        {arrowsOnTop && pages > 1 && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={`Conjunto anterior (${page + 1} de ${pages})`}
              className="flex h-8 w-8 items-center justify-center bg-black/55 text-white hover:bg-[#d6101c]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={`Conjunto seguinte (${page + 1} de ${pages})`}
              className="flex h-8 w-8 items-center justify-center bg-black/55 text-white hover:bg-[#d6101c]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* O conjunto de notícias desliza para a esquerda (ou direita) ao mudar */}
      {loopGrid ? (
        <LoopCarousel posts={group.posts} />
      ) : rollGrid ? (
        <CardsCarousel posts={group.posts.slice(0, rows * 3)} />
      ) : loopList ? (
        <VerticalLoop posts={group.posts} visible={listVisible} />
      ) : (
        <SlideStage id={`${group.slug}:${page}`} dir={dir} render={renderSet} />
      )}

      {/* Setas de controlo (manuais): mudam todo o conjunto */}
      {!arrowsOnTop && pages > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Conjunto anterior"
            className="flex h-8 w-8 items-center justify-center bg-black/55 text-white hover:bg-[#d6101c]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Conjunto seguinte"
            className="flex h-8 w-8 items-center justify-center bg-black/55 text-white hover:bg-[#d6101c]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <span className="ml-1 text-[11px] font-semibold text-gray-500">
            {page + 1} / {pages}
          </span>
        </div>
      )}
    </section>
  );
}
