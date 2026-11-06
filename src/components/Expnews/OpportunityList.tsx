'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Meta, Tag, Thumb } from '@/components/Expnews/blocks';
import type { SlimPost } from '@/components/Expnews/CategorySection';
import type { Post } from '@/lib/news-data';

const PAGE_SIZE = 6;

/** Lista de Oportunidades: 6 cards por página, com paginação (mesmo estilo da paginação das categorias). */
export default function OpportunityList({ posts }: { posts: SlimPost[] }) {
  const [page, setPage] = useState(1);
  const top = useRef<HTMLUListElement>(null);
  const pages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const visible = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const go = (n: number) => {
    setPage(n);
    // Ao mudar de página, a lista volta a aparecer desde o início.
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const base = 'flex h-9 min-w-9 items-center justify-center border px-3 text-sm';

  return (
    <>
      <ul ref={top} className="scroll-mt-20 space-y-3">
        {visible.map((p) => (
          <li key={p.slug} className="grid gap-4 bg-white p-4 shadow-sm sm:grid-cols-[210px_1fr]">
            <Link href={`/noticias/${p.slug}`} className="relative block h-[150px] overflow-hidden bg-gray-200 sm:h-auto sm:min-h-[140px]">
              <Thumb src={p.image} />
            </Link>
            <div>
              <Tag label={p.category} slug={p.categorySlug} />
              <Link href={`/noticias/${p.slug}`}>
                <h4 className="mt-2 text-[19px] font-bold leading-snug hover:text-[#d6101c]">{p.title}</h4>
              </Link>
              <div className="mt-2">
                <Meta post={p as Post} />
              </div>
              {p.excerpt && <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{p.excerpt}</p>}
            </div>
          </li>
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
