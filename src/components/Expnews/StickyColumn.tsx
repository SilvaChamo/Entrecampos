'use client';

import { useEffect, useRef } from 'react';

const GAP = 12;
const HEADER = 64; // altura do cabeçalho fixo

/**
 * Coluna que fica fixa ao fazer scroll. Se for mais alta do que o ecrã, o topo acompanha a página
 * e a coluna só prende quando o fundo chega ao fim do ecrã (assim nada fica por ver).
 */
export default function StickyColumn({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      el.style.top = `${Math.min(HEADER + GAP, window.innerHeight - el.offsetHeight - GAP)}px`;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div ref={ref} className={`sticky self-start ${className}`} style={{ top: HEADER + GAP }}>
      {children}
    </div>
  );
}
