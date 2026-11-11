'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carrossel em ciclo sem fim, um item de cada vez. A lista desenha-se com os primeiros `visible` itens repetidos no fim:
 * quando chega a essa cópia, salta (sem animação) para o início e o ciclo continua sem se notar o salto.
 * `index` é a posição (em itens) para onde o carrossel deve deslizar; `anim` diz se esse deslize é animado.
 */
export function useLoop(count: number, visible: number, auto: boolean, ms = 4000) {
  const loop = count > visible;
  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState(true);
  const [paused, setPaused] = useState(false);
  const after = useRef<number | null>(null);

  const next = useCallback(() => setIndex((x) => Math.min(x + 1, count)), [count]);
  const prev = useCallback(() => {
    if (index === 0) {
      // Volta ao fim (à cópia) sem animação e só depois desliza para trás.
      after.current = count - 1;
      setAnim(false);
      setIndex(count);
    } else setIndex((x) => x - 1);
  }, [index, count]);

  // Depois de um salto sem animação, volta a ligar a animação (e termina o recuo, se era isso).
  useEffect(() => {
    if (anim) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => {
      setAnim(true);
      if (after.current !== null) {
        setIndex(after.current);
        after.current = null;
      }
    }));
    return () => cancelAnimationFrame(id);
  }, [anim]);

  // Passa sozinho; pára com o rato por cima (ou se a pessoa pediu menos movimento).
  useEffect(() => {
    if (!loop || !auto || paused || !anim || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(next, ms);
    return () => clearTimeout(t);
  }, [loop, auto, paused, anim, index, next, ms]);

  const onEnd = (e: React.TransitionEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    if (index >= count) {
      setAnim(false);
      setIndex(index - count);
    }
  };
  return { loop, index, anim, next, prev, onEnd, hover: { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), onFocus: () => setPaused(true), onBlur: () => setPaused(false) } };
}
