'use client';

import { useState } from 'react';
import { initialsOf } from '@/lib/display-name';

/**
 * Avatar: a foto (da conta ou do e-mail); se não há foto, ou não carrega (e-mail sem conta de avatar), as iniciais do nome.
 * `className` serve à foto e ao círculo das iniciais (tamanho, forma, cantos).
 */
export default function Avatar({ src, name, className = '', initialsClassName = '' }: { src?: string | null; name: string; className?: string; initialsClassName?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (src && failed !== src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(src)} className={className} />;
  }
  return (
    <span aria-hidden className={`${className} ${initialsClassName} flex items-center justify-center`}>
      {initialsOf(name)}
    </span>
  );
}
