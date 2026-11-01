'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/news-data';
import CategoryBadge from '@/components/Expnews/CategoryBadge';

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Janela principal da home: slide das últimas notícias em destaque. */
export default function ExpSlider({ posts, className = 'h-[320px] sm:h-[420px] lg:h-[500px]' }: { posts: Post[]; className?: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = posts.length;

  useEffect(() => {
    if (total < 2 || paused) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % total), 6000);
    return () => clearInterval(timer);
  }, [total, paused, active]);

  if (total === 0) return null;
  const go = (n: number) => setActive((n + total) % total);

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Notícias em destaque"
      className={`relative overflow-hidden bg-black ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {posts.map((p, i) => (
        <div
          key={p.slug}
          aria-hidden={i !== active}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-14 text-white sm:px-10 sm:pb-14 lg:px-14">
            <CategoryBadge label={p.category} slug={p.categorySlug} tabIndex={i === active ? 0 : -1} className="text-[13px]" />
            <Link href={`/noticias/${p.slug}`} tabIndex={i === active ? 0 : -1} className="block max-w-4xl">
              <h2 className="mt-3 line-clamp-3 text-[22px] font-bold leading-tight hover:underline sm:text-[24px] lg:text-[30px]">
                {p.title}
              </h2>
            </Link>
            {p.excerpt && <p className="mt-3 line-clamp-2 max-w-3xl text-[13px] leading-relaxed text-white/85">{p.excerpt}</p>}
            <span className="mt-3 flex items-center gap-2 text-[11px] italic text-white/80">
              <CalendarCheck className="h-3.5 w-3.5" />
              Publicado a {formatDate(p.date)}
            </span>
          </div>
        </div>
      ))}

      {total > 1 && (
        // Controlo: seta, pontos (o activo alonga-se) e seta, por baixo da data de publicação
        <div className="absolute bottom-4 left-6 flex items-center gap-2.5 sm:left-10 lg:left-14">
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Notícia anterior"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-black/50 text-white hover:border-[#d6101c] hover:bg-[#d6101c]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {posts.map((p, i) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ir para a notícia ${i + 1}`}
                aria-current={i === active}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 bg-[#d6101c]' : 'w-2 bg-white/55 hover:bg-white'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Notícia seguinte"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-black/50 text-white hover:border-[#d6101c] hover:bg-[#d6101c]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
