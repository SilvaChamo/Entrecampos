'use client';

import { useState } from 'react';
import { ListItem } from '@/components/Expnews/blocks';
import type { Post } from '@/lib/news-data';
import type { SlimPost } from '@/components/Expnews/CategorySection';

/**
 * Lista vertical ao lado do slide principal: as últimas notícias de uma categoria, a deslizar sem parar para cima
 * (em roda: depois da última volta a primeira). Pára quando o rato está por cima. Com poucas notícias fica parada.
 */
export default function HeroList({ posts, label, className = '' }: { posts: SlimPost[]; label: string; className?: string }) {
  const [paused, setPaused] = useState(false);
  if (posts.length === 0) {
    return <div className={`flex items-center justify-center bg-gray-300 px-4 text-center text-[12px] text-gray-500 ${className}`}>Ainda não há notícias de {label}.</div>;
  }
  const roll = posts.length > 3;
  const items = roll ? [...posts, ...posts] : posts;
  return (
    <div className={`relative overflow-hidden max-md:h-[400px] ${className}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <ul className={roll ? 'ec-roll-up' : ''} style={roll ? { animationDuration: `${posts.length * 4}s`, animationPlayState: paused ? 'paused' : 'running' } : undefined}>
        {items.map((p, i) => (
          <li key={`${p.slug}-${i}`} className="h-[104px] pb-2" aria-hidden={i >= posts.length ? true : undefined}>
            <ListItem post={p as Post} bleed as="div" />
          </li>
        ))}
      </ul>
    </div>
  );
}
