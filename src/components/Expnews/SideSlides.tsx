'use client';

import { useEffect, useRef, useState } from 'react';
import CategorySlide from '@/components/Expnews/CategorySlide';
import type { SlimPost } from '@/components/Expnews/CategorySection';

const TURN_MS = 5000; // de 5 em 5 segundos muda um dos cards, à vez: cada card muda de 10 em 10

/**
 * Os dois cards ao lado do slide principal, a deslizar sozinhos mas à vez: quando um muda, o outro fica parado, e nunca
 * mudam os dois ao mesmo tempo. Correm sem parar, em roda infinita (depois da última notícia volta a primeira); as setas
 * continuam a mudar à mão.
 * Devolve os dois cards soltos (fragmento) para continuarem a ser células da grelha da página.
 */
export default function SideSlides({ items, className = '' }: { items: { posts: SlimPost[]; label: string }[]; className?: string }) {
  const [ticks, setTicks] = useState<number[]>(() => items.map(() => 0));
  const turn = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      // Próximo card com mais do que uma notícia, começando pelo que tem a vez.
      for (let k = 0; k < items.length; k++) {
        const i = (turn.current + k) % items.length;
        if (items[i].posts.length < 2) continue;
        turn.current = (i + 1) % items.length;
        setTicks((t) => t.map((v, n) => (n === i ? v + 1 : v)));
        return;
      }
    }, TURN_MS);
    return () => window.clearInterval(timer);
  }, [items]);

  return (
    <>
      {items.map((it, i) => (
        <CategorySlide
          key={it.label}
          posts={it.posts}
          label={it.label}
          className={className}
          tick={ticks[i]}
        />
      ))}
    </>
  );
}
