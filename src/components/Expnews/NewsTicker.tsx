'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type TickerPost = { slug: string; title: string };

const SPEED = 0.35; // px por fotograma: devagar, para ler à vontade
const GAP = 25; // espaço entre notícias (px)

/**
 * Faixa "Actualidade": os títulos das notícias mais recentes, inteiros, a correr para a esquerda
 * por baixo da etiqueta vermelha. Pára com o rato por cima; as setas pequenas empurram uma notícia.
 */
export default function NewsTicker({ posts }: { posts: TickerPost[] }) {
  const track = useRef<HTMLDivElement>(null);
  const position = useRef(0);
  const boost = useRef(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  // Uma volta completa tem pelo menos 8 títulos; desenham-se duas voltas seguidas para o ciclo não ter buracos.
  const lap = posts.length ? Array.from({ length: Math.ceil(8 / posts.length) }, () => posts).flat() : [];
  const count = lap.length;
  const items = [...lap, ...lap];

  /** Largura de uma volta (inclui o espaço entre a última notícia e a primeira da volta seguinte). */
  const lapWidth = useCallback(() => {
    const el = track.current;
    if (!el) return 0;
    const first = el.children[0] as HTMLElement | undefined;
    const second = el.children[count] as HTMLElement | undefined;
    return first && second ? second.offsetLeft - first.offsetLeft : 0;
  }, [count]);

  useEffect(() => {
    const el = track.current;
    if (!el || !count) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const tick = () => {
      const width = lapWidth();
      if (width) {
        if (!pausedRef.current && !reduced) position.current += SPEED;
        if (Math.abs(boost.current) > 0.5) {
          const step = boost.current * 0.18;
          position.current += step;
          boost.current -= step;
        }
        position.current = ((position.current % width) + width) % width;
        el.style.transform = `translate3d(${-position.current}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count, lapWidth]);

  const nudge = (dir: 1 | -1) => {
    const first = track.current?.children[0] as HTMLElement | undefined;
    if (first) boost.current += dir * (first.offsetWidth + GAP);
  };

  if (!count) return null;

  return (
    <div
      className="relative h-9 overflow-hidden bg-white shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Títulos: começam depois da etiqueta e passam por baixo dela */}
      <div className="absolute inset-0">
        <div
          ref={track}
          className="flex h-full w-max items-center will-change-transform"
          style={{ gap: GAP, paddingLeft: 178 }}
        >
          {items.map((p, i) => (
            <Link
              key={`${i}-${p.slug}`}
              href={`/noticias/${p.slug}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[12px] font-bold text-[#222] hover:text-[#d6101c]"
            >
              <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-[#d6101c]" />
              {p.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Etiqueta: degradé, borda inclinada e uma bolinha com onda de pulso */}
      <div className="absolute inset-y-0 left-0 z-10 drop-shadow-[3px_0_3px_rgba(0,0,0,0.25)]">
        <div className="flex h-full items-center gap-2.5 bg-gradient-to-r from-[#a30c15] via-[#d6101c] to-[#e8323d] pl-4 pr-8 [clip-path:polygon(0_0,100%_0,calc(100%-14px)_100%,0_100%)]">
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white">Actualidade</span>
        </div>
      </div>

      <div className="absolute inset-y-0 right-0 z-10 flex items-center gap-1 bg-gradient-to-l from-white via-white to-transparent pl-10 pr-2">
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label="Notícia anterior"
          className="flex h-5 w-5 items-center justify-center border border-gray-300 bg-white text-[#d6101c] hover:border-[#d6101c] hover:bg-[#d6101c] hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label="Notícia seguinte"
          className="flex h-5 w-5 items-center justify-center border border-gray-300 bg-white text-[#d6101c] hover:border-[#d6101c] hover:bg-[#d6101c] hover:text-white"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
