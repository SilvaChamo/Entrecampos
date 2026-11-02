import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { HOME_PAGES } from '@/lib/home-pages';

interface Props {
  label: string;
  /** Abre para baixo (barras horizontais) ou para a direita (barra lateral). */
  direction?: 'down' | 'right';
  triggerClassName?: string;
  href?: string;
  icon?: React.ReactNode;
  /** Classes do texto e da seta (ex.: esconder quando a barra lateral está recolhida). */
  labelClassName?: string;
  /** Ícone e texto deslizam juntos para a direita ao passar o rato (menu lateral). */
  slide?: boolean;
}

/** Item de menu "Início" com a lista de todas as homes. Só CSS (hover / foco), sem estado. */
export default function HomesMenu({ label, direction = 'down', triggerClassName = '', href = '/', icon, labelClassName = '', slide = false }: Props) {
  const panel =
    direction === 'right'
      ? 'left-full top-0 pl-1'
      : 'left-0 top-full pt-1';

  return (
    <div className="group relative">
      <Link href={href} className={`${slide ? 'group/slide ' : ''}flex items-center ${triggerClassName.includes('gap-') ? '' : 'gap-1'} ${triggerClassName}`}>
        {/* Com `slide`, ícone e texto deslizam juntos ao passar o rato. */}
        <span className={`flex items-center ${triggerClassName.includes('gap-') ? '' : 'gap-1'}${slide ? ' transition-transform duration-300 ease-out group-hover/slide:translate-x-1.5 motion-reduce:group-hover/slide:translate-x-0' : ''}`}>
          {icon}
          <span className={labelClassName}>{label}</span>
        </span>
        {direction === 'right' ? (
          <ChevronRight className={`ml-auto mr-4 h-3 w-3 ${labelClassName || 'opacity-70'}`} />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-70" />
        )}
      </Link>
      <div className={`invisible absolute z-[60] min-w-[210px] opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${panel}`}>
        <ul className="border border-gray-200 bg-white py-1 text-left shadow-xl">
          {HOME_PAGES.map((h) => (
            <li key={h.href}>
              <Link
                href={h.href}
                className="block whitespace-nowrap px-4 py-2 text-[12px] font-medium normal-case tracking-normal text-gray-800 hover:bg-gray-100 hover:text-red-600"
              >
                {h.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
