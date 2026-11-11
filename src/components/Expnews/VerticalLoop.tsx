'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { WideItem } from '@/components/Expnews/blocks';
import { useLoop } from '@/components/Expnews/useLoop';
import type { SlimPost } from '@/components/Expnews/CategorySection';

const GAP = 12;

/**
 * Lista vertical numa coluna, em carrossel: mostra `visible` notícias de cada vez (cada uma com o título grande, como as
 * Oportunidades) e passa uma de cada vez para cima; no fim volta ao princípio sem parar. Leva TODAS as notícias que receber.
 */
export default function VerticalLoop({ posts, visible = 3 }: { posts: SlimPost[]; visible?: number }) {
  const v = Math.max(1, Math.min(visible, posts.length || 1));
  const { loop, index, anim, next, prev, onEnd, hover } = useLoop(posts.length, v, true);
  const items = loop ? [...posts, ...posts.slice(0, v)] : posts;
  const arrow = 'absolute right-2 z-10 flex h-8 w-8 items-center justify-center bg-white/90 text-[#1d2327] shadow hover:bg-[#d6101c] hover:text-white';
  return (
    // --h: altura de cada notícia (mais alta no telemóvel, onde a imagem fica por cima do texto).
    <div className="relative [--h:380px] sm:[--h:180px]" {...hover}>
      <div className="overflow-hidden" style={{ height: `calc(${v} * var(--h) + ${(v - 1) * GAP}px)` }}>
        <ul
          className="flex flex-col"
          style={{ gap: GAP, transform: `translateY(calc(${-index} * (var(--h) + ${GAP}px)))`, transition: anim ? 'transform 500ms ease' : 'none' }}
          onTransitionEnd={onEnd}
        >
          {items.map((p, i) => (
            <WideItem key={`${p.slug}-${i}`} post={p} className="h-[var(--h)] shrink-0 overflow-hidden" />
          ))}
        </ul>
      </div>
      {loop && (
        <>
          <button type="button" aria-label="Notícias anteriores" onClick={prev} className={`${arrow} top-2`}>
            <ChevronUp className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Notícias seguintes" onClick={next} className={`${arrow} bottom-2`}>
            <ChevronDown className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
