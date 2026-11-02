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

const SLIDE_MS = 6000; // tempo de cada notícia

/** Janela principal da home: slide das últimas notícias em destaque (as notícias dissolvem-se umas nas outras). */
export default function ExpSlider({ posts, className = 'h-[320px] sm:h-[420px] lg:h-[500px]' }: { posts: Post[]; className?: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  useEffect(() => setSeen((s) => (s.has(active) ? s : new Set(s).add(active))), [active]);
  // O enchimento só começa depois de a página estar pronta; antes disso o fim do tempo não seria detectado.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const total = posts.length;

  if (total === 0) return null;
  const go = (n: number) => setActive((n + total) % total);
  // Só a notícia activa, a seguinte e as já vistas carregam a imagem (as outras esperam a sua vez).
  const near = (i: number) => seen.has(i) || i === active || i === (active + 1) % total;

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
          <img
            src={near(i) ? p.image : undefined}
            alt=""
            decoding="async"
            fetchPriority={i === 0 ? 'high' : 'low'}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-[30px] text-white max-sm:pb-[70px]">
            <CategoryBadge label={p.category} slug={p.categorySlug} tabIndex={i === active ? 0 : -1} className="self-start text-[11px]" />
            <Link href={`/noticias/${p.slug}`} tabIndex={i === active ? 0 : -1} className="block max-w-4xl">
              <h2 className="mt-3 line-clamp-3 text-[22px] font-bold leading-tight hover:underline sm:text-[24px] lg:text-[30px]">
                {p.title}
              </h2>
            </Link>
            {p.excerpt && <p className="mt-3 line-clamp-2 max-w-3xl text-[13px] leading-relaxed text-white/85">{p.excerpt}</p>}
            <span className="mt-2 flex h-7 items-center gap-2 text-[13px] font-normal text-[#39ff14] [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
              <CalendarCheck className="h-4 w-4" />
              Publicado a {formatDate(p.date)}
            </span>
          </div>
        </div>
      ))}

      {total > 1 && (
        // Controlo: seta, pontos (o activo alonga-se) e seta. Ecrã grande: canto direito, na linha da data.
        // Telemóvel: em coluna, por baixo da data (o texto sobe para lhe dar lugar), tudo na horizontal.
        <div className="absolute bottom-[30px] left-[30px] flex items-center gap-2.5 sm:left-auto sm:right-[30px]">
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
                className={`relative overflow-hidden rounded-full transition-all duration-300 ${
                  i === active ? 'h-1.5 w-12 bg-white/40' : 'h-2 w-2 bg-white/55 hover:bg-white'
                }`}
              >
                {/* O ponto activo enche durante o tempo do slide; quando enche, passa para a notícia seguinte */}
                {i === active && total > 1 && ready && (
                  <span
                    key={active}
                    className="ec-dot-fill absolute inset-y-0 left-0 w-full origin-left bg-[#d6101c]"
                    style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                    onAnimationEnd={() => go(active + 1)}
                  />
                )}
                {i === active && total <= 1 && <span className="absolute inset-0 bg-[#d6101c]" />}
              </button>
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
