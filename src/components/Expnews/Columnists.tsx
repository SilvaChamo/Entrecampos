'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ChevronLeft, ChevronRight, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import { CardTitle } from '@/components/Expnews/blocks';
import Avatar from '@/components/Avatar';
import type { Columnist } from '@/lib/columnists';

export type ColumnistItem = { columnist: Columnist; post: { slug: string; title: string } | null };

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
  { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { key: 'x', label: 'X', Icon: Twitter },
] as const;

function Socials({ c, className = '' }: { c: Columnist; className?: string }) {
  const list = SOCIALS.filter((s) => c[s.key]);
  if (list.length === 0) return null;
  return (
    <div className={`items-center gap-1 ${className}`}>
      {list.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={c[key]}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={`${label} de ${c.nome}`}
          className="flex h-7 w-7 items-center justify-center text-[#222] transition-colors hover:text-[#d6101c]">
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

const GAP = 12; // = gap-3
const SLIDE_MS = 500;
const AUTOPLAY_MS = 6000;

/**
 * Colunistas da home: carrossel de cards numa única linha (3 no ecrã largo, 2 no médio, 1 no telemóvel), no desenho do
 * cartão de citação de referência: o cartão branco tem por cima a foto redonda (com o anel bege) a sobrepor o cartão
 * escuro do nome e do @; por baixo vêm o título do artigo e, na mesma linha, o botão "Ler artigo" e as redes sociais.
 * Avança um card de cada vez (sozinho, pelas setas ou pelo toque), em loop infinito, como a faixa de categoria.
 */
export default function Columnists({ items: initial, label = 'Colunistas' }: { items: ColumnistItem[]; label?: string }) {
  const [items, setItems] = useState(initial);
  const track = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const touchX = useRef<number | null>(null);
  const paused = useRef(false);
  const moveRef = useRef<(direction: 1 | -1) => void>(() => {});

  useEffect(() => {
    if (initial.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!paused.current && document.visibilityState === 'visible') moveRef.current(1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [initial.length]);

  if (initial.length === 0) return null;

  const move = (direction: 1 | -1) => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first || busy.current) return;
    busy.current = true;
    const step = first.offsetWidth + GAP;
    const slide = (to: number, then: () => void) => {
      el.style.transition = `transform ${SLIDE_MS}ms ease`;
      el.style.transform = `translateX(${to}px)`;
      window.setTimeout(then, SLIDE_MS + 30);
    };
    if (direction === 1) {
      slide(-step, () => {
        flushSync(() => setItems((a) => [...a.slice(1), a[0]]));
        el.style.transition = 'none';
        el.style.transform = 'translateX(0)';
        busy.current = false;
      });
    } else {
      flushSync(() => setItems((a) => [a[a.length - 1], ...a.slice(0, -1)]));
      el.style.transition = 'none';
      el.style.transform = `translateX(${-step}px)`;
      void el.offsetWidth;
      slide(0, () => {
        busy.current = false;
      });
    }
  };
  moveRef.current = move;
  const arrow = 'flex h-8 w-8 items-center justify-center bg-black/55 text-white hover:bg-[#d6101c]';

  return (
    <section className="ec-reveal">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>{label}</CardTitle>
        </div>
        {initial.length > 1 && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={() => move(-1)} aria-label="Colunista anterior" className={arrow}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Colunista seguinte" className={arrow}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div
        className="overflow-hidden"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || initial.length < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
        }}
      >
        <div ref={track} className="flex gap-3">
          {items.map(({ columnist: c, post }) => (
            <article key={c.id} className="flex w-full shrink-0 pt-9 sm:w-[calc((100%-12px)/2)] sm:pt-[44px] lg:w-[calc((100%-24px)/3)]">
              {/* Os cards da fila têm todos a mesma altura (a do mais alto), sem reservar espaço no título. */}
              <div className="relative flex flex-1 flex-col bg-white px-3 pb-3 pt-10 shadow-sm sm:px-5 sm:pt-12">
                {/* Cartão do nome: nasce por baixo da foto e passa a linha de cima do cartão. */}
                <div className="absolute -top-[26px] left-[56px] right-3 z-10 sm:-top-[30px] sm:left-[90px]">
                  <div className="flex h-11 w-fit max-w-full min-w-0 flex-col justify-center bg-[#231f20] pl-[40px] pr-5 sm:h-[51px] sm:pl-[30px]">
                    <div className="truncate text-[16px] leading-tight text-white sm:text-[18px]">{c.nome}</div>
                    {c.handle && <div className="truncate text-[11px] leading-tight text-gray-400">@{c.handle}</div>}
                  </div>
                </div>
                {/* Foto: dentro do cartão, afastada da esquerda, sobre o cartão do nome. */}
                <Avatar
                  src={c.foto}
                  name={c.nome}
                  className="absolute -top-9 left-3 z-20 h-16 w-16 border-2 border-[#231f20] object-cover ring-4 ring-[#d9cdbb] sm:-top-[44px] sm:left-5 sm:h-20 sm:w-20"
                  initialsClassName="bg-[#e7e0d4] text-[22px] text-[#231f20] sm:text-[26px]"
                />
                {post ? (
                  <Link href={`/noticias/${post.slug}`} className="block">
                    <h4 className="line-clamp-3 text-[16px] font-bold leading-snug text-[#222] hover:text-[#d6101c]">{post.title}</h4>
                  </Link>
                ) : (
                  <p className="text-[14px] leading-snug text-gray-500">Ainda sem artigos de opinião publicados.</p>
                )}
                {/* Linha que separa tudo; por baixo, na mesma linha, o botão (da largura da foto) e as redes sociais. Ficam sempre no fundo do card. */}
                {(post || SOCIALS.some((x) => c[x.key])) && (
                  <div className="mt-auto pt-3">
                    <div className="-mx-3 flex items-center gap-4 border-t border-gray-300 px-3 pt-3 sm:-mx-5 sm:px-5">
                      {post && (
                        <Link href={`/noticias/${post.slug}`} className="flex h-7 w-16 shrink-0 items-center justify-center bg-[#d6101c] text-[12px] text-white hover:bg-[#b50d17] sm:w-20">
                          Ler artigo
                        </Link>
                      )}
                      <Socials c={c} className="flex" />
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
