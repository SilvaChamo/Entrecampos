'use client';

import { Children, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Carrossel horizontal de cards: 1 / 2 / 3 por vista conforme o ecrã.
 * É infinito: os cards repetem-se em círculo (sem voltar ao início), avança sozinho e pára com o rato por cima.
 *
 * Por baixo há 3 cópias da lista; o scroll fica sempre na cópia do meio e, quando para,
 * é reposto de forma invisível (as cópias são iguais), por isso nunca chega a um fim.
 */
export default function CardCarousel({ children, interval = 5000 }: { children: React.ReactNode; interval?: number }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const items = Children.toArray(children);
  const count = items.length;
  const loop = count > 1;

  /** Largura de uma cópia inteira da lista. */
  const setWidth = useCallback(() => {
    const el = track.current;
    if (!el || !loop) return 0;
    const first = el.children[0] as HTMLElement | undefined;
    const second = el.children[count] as HTMLElement | undefined;
    return first && second ? second.offsetLeft - first.offsetLeft : 0;
  }, [count, loop]);

  /** Muda o scroll sem animação (a animação suave está ligada na pista). */
  const jumpTo = useCallback((left: number) => {
    const el = track.current;
    if (!el) return;
    const previous = el.style.scrollBehavior;
    el.style.scrollBehavior = 'auto';
    el.scrollLeft = left;
    el.style.scrollBehavior = previous;
  }, []);

  /** Mantém o scroll dentro da cópia do meio. */
  const recenter = useCallback(() => {
    const el = track.current;
    const width = setWidth();
    if (!el || !width) return;
    if (el.scrollLeft >= width * 2 - 4) jumpTo(el.scrollLeft - width);
    else if (el.scrollLeft < width - 4) jumpTo(el.scrollLeft + width);
  }, [setWidth, jumpTo]);

  // Começa na cópia do meio e volta a centrar quando o ecrã muda de tamanho.
  useEffect(() => {
    if (!loop) return;
    const start = () => {
      const width = setWidth();
      if (width) jumpTo(width);
    };
    start();
    window.addEventListener('resize', start);
    return () => window.removeEventListener('resize', start);
  }, [loop, setWidth, jumpTo]);

  // Quando o scroll pára, repõe o centro (sem se notar).
  useEffect(() => {
    const el = track.current;
    if (!el || !loop) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(recenter, 120);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
    };
  }, [loop, recenter]);

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 12 : el.clientWidth;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setInterval(() => scrollByCard(1), interval);
    return () => clearInterval(timer);
  }, [paused, interval, count, scrollByCard]);

  const sets = loop ? [0, 1, 2] : [0];

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div ref={track} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sets.flatMap((copy) =>
          items.map((item, i) => (
            <div
              key={`${copy}-${i}`}
              className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-12px)/2)] lg:w-[calc((100%-24px)/3)]"
              // As cópias só servem para o ciclo: não entram na navegação por teclado nem nos leitores de ecrã.
              aria-hidden={copy !== 1 && loop ? true : undefined}
              ref={(el) => {
                if (!el) return;
                if (copy !== 1 && loop) el.setAttribute('inert', '');
                else el.removeAttribute('inert');
              }}
            >
              {item}
            </div>
          )),
        )}
      </div>
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label="Anterior"
        className="absolute left-2 top-[90px] flex h-9 w-9 items-center justify-center bg-black/55 text-white hover:bg-[#d6101c]"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label="Seguinte"
        className="absolute right-2 top-[90px] flex h-9 w-9 items-center justify-center bg-black/55 text-white hover:bg-[#d6101c]"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
