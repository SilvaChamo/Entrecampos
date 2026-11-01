'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type BarState = { loggedIn: boolean; canCreate?: boolean; canReview?: boolean; pending?: number };

const link = 'px-3.5 text-[11px] font-semibold uppercase tracking-wider text-green-100/80 transition-colors hover:text-white';

/**
 * Barra verde do topo: menu discreto de acesso rápido (adicionar notícia, pendentes, institucional, entrar).
 * As opções do painel dependem de quem está ligado.
 */
export default function GreenBar() {
  const [state, setState] = useState<BarState>({ loggedIn: false });

  useEffect(() => {
    let alive = true;
    fetch('/api/site/bar', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => alive && data && setState(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="h-9 bg-[#1a3d0c]">
      <div className="mx-3 h-full">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-3">
          <nav aria-label="Acesso rápido" className="flex h-full items-center divide-x divide-white/15">
            {(!state.loggedIn || state.canCreate) && (
              <Link href="/admin/noticias/nova" className={`${link} first:pl-0`}>
                Adicionar notícia
              </Link>
            )}
            {state.canReview && (
              <Link href="/admin/noticias/pendentes" className={`${link} flex items-center gap-1.5`}>
                Notícias pendentes
                {!!state.pending && <span className="text-[#ff8a8a]">({state.pending})</span>}
              </Link>
            )}
            <Link href="/pagina/inicio" className={link}>
              Sobre nós
            </Link>
            <Link href="/pagina/contactos" className={link}>
              Contactos
            </Link>
          </nav>

          {state.loggedIn ? (
            <Link href="/admin" className={`${link} pr-0`}>
              Painel
            </Link>
          ) : (
            <Link href="/login" className={`${link} pr-0`}>
              Entrar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
