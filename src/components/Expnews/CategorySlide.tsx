'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tag, Thumb, shortDate } from '@/components/Expnews/blocks';
import ShareLink from '@/components/Expnews/ShareLink';
import SlideStage from '@/components/Expnews/SlideStage';
import type { SlimPost } from '@/components/Expnews/CategorySection';

/**
 * Card ao lado do slide principal: as últimas notícias de uma categoria (até 5), uma de cada vez.
 * As setas pequenas ficam na linha do "Partilhar", à direita. Muda à mão (setas) ou, quando recebe `tick` novo, avança uma notícia
 * (é o que o SideSlides usa para os dois cards mudarem à vez).
 */
export default function CategorySlide({
  posts,
  label,
  flow = 'left',
  className = '',
  tick,
  onPause,
}: {
  posts: SlimPost[];
  label: string;
  /** Sentido em que as notícias deslizam ao avançar: para a esquerda ou para a direita. */
  flow?: 'left' | 'right';
  className?: string;
  /** Sobe de valor quando este card deve avançar sozinho. */
  tick?: number;
  /** Avisa que o rato entrou ou saiu do card. */
  onPause?: (paused: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const lastTick = useRef(tick);
  useEffect(() => {
    if (tick === undefined || tick === lastTick.current) return;
    lastTick.current = tick;
    if (posts.length > 1) {
      setDir(flow === 'left' ? 1 : -1);
      setIndex((i) => (i + 1) % posts.length);
    }
  }, [tick, flow, posts.length]);

  if (posts.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-300 px-4 text-center text-[12px] text-gray-500 ${className}`}>
        Ainda não há notícias de {label}.
      </div>
    );
  }

  // direction: 1 = seta "seguinte", -1 = seta "anterior". O deslize segue o sentido do card.
  const move = (direction: 1 | -1) => {
    setDir(flow === 'left' ? direction : ((-direction) as 1 | -1));
    setIndex((i) => (i + direction + posts.length) % posts.length);
  };
  const arrow =
    'flex h-5 w-5 items-center justify-center bg-white/20 text-white backdrop-blur-sm hover:bg-[#d6101c]';

  return (
    <div className={`group relative overflow-hidden bg-gray-300 ${className}`} onMouseEnter={() => onPause?.(true)} onMouseLeave={() => onPause?.(false)}>
      <SlideStage
        id={String(index)}
        dir={dir}
        className="absolute inset-0"
        render={(id) => {
          const post = posts[Number(id)];
          if (!post) return null;
          const href = `/noticias/${post.slug}`;
          return (
            <div className="relative h-full w-full overflow-hidden bg-gray-300">
              <Thumb src={post.image} className="transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <Link href={href} aria-label={post.title} className="absolute inset-0" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="pointer-events-auto mb-2 w-fit">
                  <Tag label={post.category} slug={post.categorySlug} />
                </div>
                <h4 className="line-clamp-3 text-[14px] font-bold leading-snug">{post.title}</h4>
                <div className="pointer-events-auto mt-2 flex h-5 items-center gap-3 text-[10px] font-medium">
                  {post.date && <span className="text-[#39ff14] [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">{shortDate(post.date)}</span>}
                  <ShareLink path={href} title={post.title} className="text-white/85 hover:text-white" />
                </div>
              </div>
            </div>
          );
        }}
      />
      {/* As setas ficam paradas, na linha do "Partilhar", à direita */}
      {posts.length > 1 && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1">
          <button type="button" onClick={() => move(-1)} aria-label="Notícia anterior" className={arrow}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Notícia seguinte" className={arrow}>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
