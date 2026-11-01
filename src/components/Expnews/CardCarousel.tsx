'use client';

import { Children, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Carrossel horizontal de cards: 1 / 2 / 3 por vista conforme o ecrã.
 * Avança sozinho, pára com o rato por cima e volta ao início no fim.
 */
export default function CardCarousel({ children, interval = 5000 }: { children: React.ReactNode; interval?: number }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const items = Children.toArray(children);

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 12 : el.clientWidth;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
    else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    else el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = setInterval(() => scrollByCard(1), interval);
    return () => clearInterval(timer);
  }, [paused, interval, items.length, scrollByCard]);

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div ref={track} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
          <div key={i} className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-12px)/2)] lg:w-[calc((100%-24px)/3)]">
            {item}
          </div>
        ))}
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
