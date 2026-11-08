'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/news-data';
import CategoryBadge from '@/components/Expnews/CategoryBadge';

const SLIDE_MS = 6000;
const GAP = '12px';
const INSET = '24px'; // seta a 12px da borda da imagem (o espaço entre imagens + 12px)

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Destaque em carrossel de largura total: a notícia do meio inteira, com o texto, e nas laterais metade da anterior e da
 * seguinte. A cada passo a do meio sai cortada para a esquerda e a da direita ocupa o meio, e o texto aparece. Ciclo sem fim.
 */
export default function HeroCarousel({ posts }: { posts: Post[] }) {
  // Com poucas notícias repete-as, para haver sempre as duas laterais.
  const list = posts.length === 0 ? [] : Array.from({ length: Math.max(5, posts.length) }, (_, i) => posts[i % posts.length]);
  const total = list.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (!ready || total < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setActive((n) => (n + 1) % total), SLIDE_MS);
    return () => clearTimeout(t);
  }, [ready, total, paused, active]);

  // Posição de cada notícia em relação à do meio (-2 a 2); quem dá a volta ao ciclo salta sem animação.
  const rels = list.map((_, i) => {
    let r = (i - active + total) % total;
    if (r > total / 2) r -= total;
    return Math.max(-2, Math.min(2, r));
  });
  const prev = useRef<number[]>([]);
  useEffect(() => { prev.current = rels; });

  if (total === 0) return null;
  const go = (n: number) => setActive((n + total) % total);

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Notícias em destaque"
      className="group relative h-[340px] overflow-hidden bg-white [--sw:80cqw] [container-type:inline-size] md:h-[442px] md:[--sw:60cqw]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {list.map((p, i) => {
        const rel = rels[i];
        const centre = rel === 0;
        const near = Math.abs(rel) <= 1;
        const jumped = prev.current[i] !== undefined && Math.abs(rel - prev.current[i]) > 2;
        return (
          <div
            key={`${p.slug}-${i}`}
            aria-hidden={!centre}
            onClick={!centre && near ? () => go(i) : undefined}
            className={`absolute inset-y-0 left-0 w-[var(--sw)] overflow-hidden ${!centre && near ? 'cursor-pointer' : ''}`}
            style={{
              transform: `translateX(calc((100cqw - var(--sw)) / 2 + ${rel} * (var(--sw) + ${GAP})))`,
              transition: jumped ? 'none' : 'transform 700ms ease-in-out',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={Math.abs(rel) <= 2 ? p.image : undefined} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            <div className={`absolute inset-0 bg-black transition-opacity duration-700 ${centre ? 'opacity-0' : 'opacity-50'}`} />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent transition-opacity duration-700 ${centre ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute inset-0 flex flex-col justify-end p-3 text-white transition-opacity duration-700 sm:p-[30px] ${centre ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
              <CategoryBadge label={p.category} slug={p.categorySlug} tabIndex={centre ? 0 : -1} className="self-start text-[11px]" />
              <Link href={`/noticias/${p.slug}`} tabIndex={centre ? 0 : -1} className="block max-w-3xl">
                <h2 className="mt-3 line-clamp-3 text-[22px] font-bold leading-tight hover:underline sm:text-[24px] lg:text-[30px]">{p.title}</h2>
              </Link>
              {p.excerpt && <p className="mt-3 line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-white/85">{p.excerpt}</p>}
              <span className="mt-2 flex h-7 items-center gap-2 text-[13px] font-normal text-[#39ff14] [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
                <CalendarCheck className="h-4 w-4" />
                Publicado a {formatDate(p.date)}
              </span>
            </div>
          </div>
        );
      })}
      {/* Controlo: uma seta em cada lateral, centrada na vertical, junto ao meio (direita da imagem da esquerda e esquerda da imagem da direita). */}
      {posts.length > 1 && <button
        type="button"
        onClick={() => go(active - 1)}
        aria-label="Notícia anterior"
        style={{ right: `calc(100cqw - (100cqw - var(--sw)) / 2 + ${INSET})` }}
        className="absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-none border border-white/50 bg-black/50 text-white opacity-0 transition-opacity hover:border-[#d6101c] hover:bg-[#d6101c] focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>}
      {posts.length > 1 && <button
        type="button"
        onClick={() => go(active + 1)}
        aria-label="Notícia seguinte"
        style={{ left: `calc((100cqw + var(--sw)) / 2 + ${INSET})` }}
        className="absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-none border border-white/50 bg-black/50 text-white opacity-0 transition-opacity hover:border-[#d6101c] hover:bg-[#d6101c] focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <ChevronRight className="h-5 w-5" />
      </button>}
    </section>
  );
}
