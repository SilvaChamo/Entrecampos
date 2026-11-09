'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NewsCard } from '@/components/Expnews/blocks';
import type { SlimPost } from '@/components/Expnews/CategorySection';
import type { Post } from '@/lib/news-data';

/**
 * Cards de notícias em carrossel: 3 por vista no computador, 2 no tablet e 1 no telemóvel; as setas passam uma vista de cada vez
 * (também se pode deslizar com o dedo). Usada nas secções da home com o carrossel activado no painel.
 */
export default function CardsCarousel({ posts }: { posts: SlimPost[] }) {
  const track = useRef<HTMLDivElement>(null);
  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };
  const arrow = 'absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/90 text-[#1d2327] shadow hover:bg-[#d6101c] hover:text-white';
  return (
    <div className="relative">
      <div ref={track} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {posts.map((p) => (
          <div key={p.slug} className="shrink-0 snap-start basis-full sm:basis-[calc((100%-12px)/2)] lg:basis-[calc((100%-24px)/3)]">
            <NewsCard post={p as Post} />
          </div>
        ))}
      </div>
      {posts.length > 1 && (
        <>
          <button type="button" aria-label="Anteriores" onClick={() => go(-1)} className={`${arrow} left-1`}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Seguintes" onClick={() => go(1)} className={`${arrow} right-1`}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
