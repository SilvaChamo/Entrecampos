'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CardTitle, Meta, Tag, Thumb } from '@/components/Expnews/blocks';
import type { SlimPost } from '@/components/Expnews/CategorySection';
import type { Post } from '@/lib/news-data';

const GAP = 12; // = gap-3
const SLIDE_MS = 500;
const AUTOPLAY_MS = 5000;

/**
 * Carrossel de notícias de uma categoria, em toda a largura (atravessa a barra lateral). Cada card tem a imagem no
 * fundo e o texto por cima, sobre uma sobreposição escura que o deixa legível. Mostra 3 cards no ecrã largo, 2 no
 * médio e 1 no telemóvel; avança um card de cada vez (sozinho a cada 5 s, ou pelas setas e pelo toque), em loop infinito nos dois sentidos.
 */
export default function CategoryStrip({ posts, label }: { posts: SlimPost[]; label: string }) {
  const [items, setItems] = useState(posts);
  const track = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const touchX = useRef<number | null>(null);
  const paused = useRef(false);
  const moveRef = useRef<(direction: 1 | -1) => void>(() => {});

  // Play automático: avança um card a cada 5 s; para com o rato (ou o foco) em cima, com o separador escondido ou se o sistema pede menos movimento.
  useEffect(() => {
    if (posts.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!paused.current && document.visibilityState === 'visible') moveRef.current(1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [posts.length]);

  if (posts.length === 0) return null;

  const move = (direction: 1 | -1) => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first || busy.current) return;
    busy.current = true;
    const step = first.offsetWidth + GAP;
    const slide = (to: number, then: () => void) => {
      el.style.transition = `transform ${SLIDE_MS}ms ease`;
      el.style.transform = `translateX(${to}px)`;
      window.setTimeout(then, SLIDE_MS + 30);
    };
    // A fila roda e a posição volta ao início no mesmo instante (flushSync + sem transição): sem nenhum quadro intermédio, não pisca.
    if (direction === 1) {
      slide(-step, () => {
        flushSync(() => setItems((a) => [...a.slice(1), a[0]]));
        el.style.transition = 'none';
        el.style.transform = 'translateX(0)';
        busy.current = false;
      });
    } else {
      // O último passa para o início, já deslocado para fora, e desliza para o lugar.
      flushSync(() => setItems((a) => [a[a.length - 1], ...a.slice(0, -1)]));
      el.style.transition = 'none';
      el.style.transform = `translateX(${-step}px)`;
      void el.offsetWidth; // fixa a posição antes de animar
      slide(0, () => {
        busy.current = false;
      });
    }
  };
  moveRef.current = move;
  const arrow = 'flex h-8 w-8 items-center justify-center bg-black/55 text-white hover:bg-[#d6101c]';

  return (
    <section className="ec-reveal">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>{label}</CardTitle>
        </div>
        {posts.length > 1 && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={() => move(-1)} aria-label="Notícia anterior" className={arrow}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Notícia seguinte" className={arrow}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div
        className="overflow-hidden"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || posts.length < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
        }}
      >
        <div ref={track} className="flex gap-3">
          {items.map((post) => {
            const href = `/noticias/${post.slug}`;
            return (
              <article
                key={post.slug}
                className="group relative h-[220px] w-full shrink-0 overflow-hidden bg-gray-300 sm:w-[calc((100%-12px)/2)] lg:w-[calc((100%-24px)/3)]"
              >
                <Thumb src={post.image} eager className="transition-transform duration-500 group-hover:scale-105" />
                {/* Sobreposição escura: mais forte em baixo, onde está o texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                <Link href={href} aria-label={post.title} className="absolute inset-0" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3.5 text-white">
                  <div className="pointer-events-auto mb-1.5 w-fit">
                    <Tag label={post.category} slug={post.categorySlug} />
                  </div>
                  <h4 className="line-clamp-2 text-[14px] font-bold leading-snug">{post.title}</h4>
                  <div className="pointer-events-auto mt-1.5">
                    <Meta post={post as Post} light />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
