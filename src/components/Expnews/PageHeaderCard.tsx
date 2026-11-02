import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export type Crumb = { label: string; href?: string };

/**
 * Card de topo das páginas interiores (categorias e pesquisa): título da página e o caminho até ela,
 * na largura do conteúdo, colado ao cabeçalho (ao entrar na página desliza de baixo da barra de menu): título à esquerda e caminho à direita, na mesma linha. O último item do caminho é a página actual.
 */
export default function PageHeaderCard({ title, trail }: { title: string; trail: Crumb[] }) {
  return (
    // -mt-3 anula o espaço (mb-3) do cabeçalho: o card fica colado à barra de menu.
    <header className="ec-drop relative z-10 -mt-3 mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-[#0c1f08] px-5 py-2.5 sm:px-6">
      <h1 className="flex min-w-0 items-center gap-3 text-[17px] font-extrabold uppercase leading-tight tracking-[0.08em] text-white sm:text-[19px]">
        <span className="h-[18px] w-[5px] shrink-0 bg-[#d6101c] sm:h-[20px]" />
        <span className="min-w-0 break-words">{title}</span>
      </h1>
      <nav aria-label="Caminho" className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-white/90">
        <Link href="/" className="flex items-center gap-1 font-bold text-[#39ff14] hover:brightness-90">
          <Home className="h-3 w-3" />
          Início
        </Link>
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="h-3 w-3 shrink-0 text-white/60" />
              {crumb.href && !last ? (
                <Link href={crumb.href} className="hover:text-[#39ff14]">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={`truncate ${last ? 'font-semibold text-white' : ''}`}>
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </header>
  );
}
