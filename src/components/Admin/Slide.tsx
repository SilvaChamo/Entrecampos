'use client';

import { useRef, type ReactNode } from 'react';

/**
 * Bloco que se abre a deslizar para baixo, empurrando o que está por baixo (como um dropdown), e fecha a encolher. Nunca salta.
 * Fica sempre no sítio: `open` abre/fecha e o conteúdo mantém-se montado até acabar de encolher.
 */
export default function Slide({ open, children }: { open: boolean; children?: ReactNode }) {
  // Guarda o último conteúdo com que esteve aberto, para não mudar (nem desaparecer) enquanto encolhe.
  const last = useRef<ReactNode>(null);
  if (open) last.current = children;
  return (
    <div
      aria-hidden={!open}
      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'}`}
    >
      <div className="min-h-0 overflow-hidden">{open ? children : last.current}</div>
    </div>
  );
}
