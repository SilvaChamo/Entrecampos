'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NewsCard } from '@/components/Expnews/blocks';
import { useLoop } from '@/components/Expnews/useLoop';
import type { SlimPost } from '@/components/Expnews/CategorySection';
import type { Post } from '@/lib/news-data';

const GAP = 12;

/**
 * Uma única linha de cards (3 por vista no computador, 2 no tablet, 1 no telemóvel) com TODAS as notícias:
 * passa um card de cada vez, sozinha, e quando chega ao fim volta ao princípio sem parar (ciclo sem fim).
 */
export default function LoopCarousel({ posts }: { posts: SlimPost[] }) {
  const [visible, setVisible] = useState(3);
  useEffect(() => {
    const pick = () => setVisible(window.matchMedia('(min-width: 1024px)').matches ? 3 : window.matchMedia('(min-width: 640px)').matches ? 2 : 1);
    pick();
    window.addEventListener('resize', pick);
    return () => window.removeEventListener('resize', pick);
  }, []);
  const { loop, index, anim, next, prev, onEnd, hover } = useLoop(posts.length, visible, true);
  const items = loop ? [...posts, ...posts.slice(0, visible)] : posts;
  const arrow = 'absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/90 text-[#1d2327] shadow hover:bg-[#d6101c] hover:text-white';
  return (
    <div className="relative" {...hover}>
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{ gap: GAP, transform: `translateX(calc(${-index} * (100% + ${GAP}px) / ${visible}))`, transition: anim ? 'transform 500ms ease' : 'none' }}
          onTransitionEnd={onEnd}
        >
          {items.map((p, i) => (
            <div key={`${p.slug}-${i}`} className="shrink-0" style={{ flexBasis: `calc((100% - ${(visible - 1) * GAP}px) / ${visible})` }}>
              <NewsCard post={p as Post} />
            </div>
          ))}
        </div>
      </div>
      {loop && (
        <>
          <button type="button" aria-label="Anterior" onClick={prev} className={`${arrow} left-1`}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Seguinte" onClick={next} className={`${arrow} right-1`}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
