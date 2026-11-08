'use client';

import { useEffect, useRef, useState } from 'react';
import { ListItem } from '@/components/Expnews/blocks';
import type { Post } from '@/lib/news-data';
import type { SlimPost } from '@/components/Expnews/CategorySection';

const VISIBLE = 4; // notícias visíveis ao mesmo tempo
const STEP_MS = 4000; // tempo entre passos

/**
 * Lista vertical ao lado do slide principal: as últimas notícias de uma categoria. Em carrossel: a cada passo sobe uma
 * notícia e a primeira volta ao fim (ciclo sem fim). Pára quando o rato está por cima. Com poucas notícias fica parada.
 */
export default function HeroList({ posts, label, className = '' }: { posts: SlimPost[]; label: string; className?: string }) {
  const [paused, setPaused] = useState(false);
  const [idx, setIdx] = useState(0);
  const [jump, setJump] = useState(false); // volta ao início sem animação
  const [h, setH] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const roll = posts.length > VISIBLE;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    setH(el.clientHeight);
    return () => ro.disconnect();
  }, [posts.length]);

  useEffect(() => {
    if (!roll || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => { setJump(false); setIdx((n) => n + 1); }, STEP_MS);
    return () => clearTimeout(t);
  }, [roll, paused, idx]);

  if (posts.length === 0) {
    return <div className={`flex items-center justify-center bg-gray-300 px-4 text-center text-[12px] text-gray-500 ${className}`}>Ainda não há notícias de {label}.</div>;
  }
  // Cada passo = card + 8px de espaço; assim o último card visível acaba rente ao fim do slide, sem margem em baixo.
  const itemH = h > 0 ? (h + 8) / VISIBLE : 0;
  // Cópia das primeiras notícias no fim: ao chegar a ela salta, sem se notar, para o início.
  const items = roll ? [...posts, ...posts.slice(0, VISIBLE)] : posts;
  return (
    <div ref={box} className={`relative overflow-hidden max-md:h-[400px] ${className}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <ul
        style={roll && itemH ? { transform: `translateY(-${idx * itemH}px)`, transition: jump ? 'none' : 'transform 600ms ease-in-out' } : undefined}
        onTransitionEnd={() => { if (roll && idx >= posts.length) { setJump(true); setIdx(0); } }}
      >
        {items.map((p, i) => (
          <li key={`${p.slug}-${i}`} className="pb-2 last:pb-0" style={roll && itemH ? { height: itemH } : { height: 104 }} aria-hidden={i >= posts.length ? true : undefined}>
            <ListItem post={p as Post} bleed as="div" />
          </li>
        ))}
      </ul>
    </div>
  );
}
