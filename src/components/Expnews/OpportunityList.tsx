'use client';

import React, { useRef, useState } from 'react';
import { WideItem } from '@/components/Expnews/blocks';
import type { SlimPost } from '@/components/Expnews/CategorySection';

const PAGE_SIZE = 6;
/** Com rolagem, cada página traz mais notícias e só 3 ficam à vista (as outras numa barra de rolagem). */
const SCROLL_PAGE_SIZE = 30;

/** Lista de Oportunidades: 6 cards por página, com paginação (mesmo estilo da paginação das categorias). */
export default function OpportunityList({ posts, scroll = false, inView = 3 }: { posts: SlimPost[]; scroll?: boolean; inView?: number }) {
  const [page, setPage] = useState(1);
  const top = useRef<HTMLUListElement>(null);
  const size = scroll ? SCROLL_PAGE_SIZE : PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(posts.length / size));
  const visible = posts.slice((page - 1) * size, page * size);

  const go = (n: number) => {
    setPage(n);
    // Ao mudar de página, a lista volta a aparecer desde o início.
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const base = 'flex h-9 min-w-9 items-center justify-center border px-3 text-sm';

  return (
    <>
      <ul ref={top} className={`scroll-mt-20 space-y-3${scroll ? ' max-h-[640px] overflow-y-auto pr-1 sm:max-h-[calc(var(--n)*180px+(var(--n)-1)*12px)]' : ''}`} style={scroll ? ({ '--n': inView } as React.CSSProperties) : undefined}>
        {visible.map((p) => (
          <WideItem key={p.slug} post={p} fixed={scroll} />
        ))}
      </ul>

      {pages > 1 && (
        <nav aria-label="Paginação das oportunidades" className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {page > 1 && (
            <button type="button" onClick={() => go(page - 1)} className={`${base} border-gray-300 bg-white hover:bg-[#008000] hover:text-white`}>
              ‹ Anterior
            </button>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => go(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`${base} ${n === page ? 'border-[#008000] bg-[#008000] text-white' : 'border-gray-300 bg-white hover:bg-[#008000] hover:text-white'}`}
            >
              {n}
            </button>
          ))}
          {page < pages && (
            <button type="button" onClick={() => go(page + 1)} className={`${base} border-gray-300 bg-white hover:bg-[#008000] hover:text-white`}>
              Seguinte ›
            </button>
          )}
        </nav>
      )}
    </>
  );
}
