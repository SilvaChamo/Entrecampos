'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarCheck, ChevronDown, ChevronUp } from 'lucide-react';
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
          <div className="absolute inset-0 flex items-end p-[30px] text-white">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex min-w-0 flex-col">
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
              {/* Controlo à direita, em coluna: seta, quadrados (o activo alonga-se e enche) e seta, centrado na vertical com o título e a descrição */}
              {total > 1 && i === active && (
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => go(active - 1)}
                    aria-label="Notícia anterior"
                    className="flex h-6 w-6 items-center justify-center border border-white/50 bg-black/50 text-white hover:border-[#d6101c] hover:bg-[#d6101c]"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <div className="flex flex-col items-center gap-2">
                    {posts.map((q, k) => (
                      <button
                        key={q.slug}
                        type="button"
                        onClick={() => setActive(k)}
                        aria-label={`Ir para a notícia ${k + 1}`}
                        aria-current={k === active}
                        className={`relative overflow-hidden transition-all duration-300 ${k === active ? 'h-10 w-2 bg-white/40' : 'h-2 w-2 bg-white/55 hover:bg-white'}`}
                      >
                        {/* O quadrado activo enche durante o tempo do slide; quando enche, passa para a notícia seguinte */}
                        {k === active && ready && (
                          <span
                            key={active}
                            className="ec-dot-fill-y absolute inset-x-0 top-0 h-full origin-top bg-[#d6101c]"
                            style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                            onAnimationEnd={() => go(active + 1)}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => go(active + 1)}
                    aria-label="Notícia seguinte"
                    className="flex h-6 w-6 items-center justify-center border border-white/50 bg-black/50 text-white hover:border-[#d6101c] hover:bg-[#d6101c]"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

    </section>
  );
}
