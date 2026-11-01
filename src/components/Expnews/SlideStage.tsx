'use client';

import { useState } from 'react';

/**
 * Palco de um slide: quando o `id` muda, o conteúdo antigo sai a deslizar e o novo entra a deslizar
 * (dir 1 = para a esquerda, dir -1 = para a direita). Sem saltos, mesmo a dar a volta no fim da lista.
 * `render` recebe o id, por isso o conteúdo que sai continua a ser o que estava no ecrã.
 */
export default function SlideStage({
  id,
  dir,
  render,
  className = '',
}: {
  id: string;
  dir: 1 | -1;
  render: (id: string) => React.ReactNode;
  className?: string;
}) {
  const [shown, setShown] = useState(id);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);

  if (id !== shown) {
    setShown(id);
    setLeaving(shown);
    setAnimate(true);
  }

  return (
    <div className={`grid overflow-hidden ${className}`}>
      {leaving !== null && (
        <div
          key={`out-${leaving}`}
          aria-hidden="true"
          className={`pointer-events-none col-start-1 row-start-1 min-w-0 ${dir === 1 ? 'ec-out-left' : 'ec-out-right'}`}
          onAnimationEnd={() => setLeaving(null)}
        >
          {render(leaving)}
        </div>
      )}
      <div key={`in-${id}`} className={`col-start-1 row-start-1 min-w-0 ${animate ? (dir === 1 ? 'ec-in-right' : 'ec-in-left') : ''}`}>
        {render(id)}
      </div>
    </div>
  );
}
