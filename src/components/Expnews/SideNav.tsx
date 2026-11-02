'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Apple,
  BookOpen,
  Briefcase,
  CalendarDays,
  Compass,
  Globe,
  Home,
  Leaf,
  Lightbulb,
  Newspaper,
  Sprout,
  Users,
  Utensils,
} from 'lucide-react';
import HomesMenu from '@/components/Home/HomesMenu';

const SIDE_NAV = [
  { label: 'Notícias', href: '/noticias', Icon: Newspaper },
  { label: 'Agricultura', href: '/categoria/agricultura', Icon: Sprout },
  { label: 'Comunidade', href: '/categoria/comunidade', Icon: Users },
  { label: 'Agro-negócio', href: '/categoria/agro-negocio', Icon: Briefcase },
  { label: 'Curiosidade', href: '/categoria/curiosidade', Icon: Lightbulb },
  { label: 'Fruticultura', href: '/categoria/fruticultura', Icon: Apple },
  { label: 'Oportunidades', href: '/categoria/oportunidades', Icon: Briefcase },
  { label: 'Ambiente', href: '/categoria/ambiente', Icon: Leaf },
  { label: 'Receitas', href: '/categoria/receitas', Icon: Utensils },
  { label: 'Internacional', href: '/categoria/internacional', Icon: Globe },
  { label: 'Recursos', href: '/categoria/recursos', Icon: BookOpen },
  { label: 'Evento', href: '/categoria/evento', Icon: CalendarDays },
  { label: 'Guia', href: '/categoria/guia', Icon: Compass },
];

// Barra recolhida por defeito (só ícones, 64px); ao abrir os rótulos surgem com fade + largura, sem saltos.
const OPEN = 'group-data-[open=true]/side:opacity-100';
const LABEL = `block w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[width,opacity] duration-300 group-data-[open=true]/side:w-[140px] ${OPEN}`;
// Mesmas medidas do menu do painel: ícones de 20px e linhas de 37px.
const ICON_BOX = 'flex h-[37px] w-16 shrink-0 items-center justify-center';
const ITEM = 'flex items-center text-[12px] font-medium uppercase tracking-wide';
// Cor do hover. O item da página em que está usa a mesma.
const HOVER = 'hover:bg-white/5 hover:text-[#39ff14]';
// Ao passar o rato, o ícone e o texto deslizam JUNTOS (um só bloco) um pouco para a direita; desligado com "reduzir movimento".
const SLIDE = 'flex items-center transition-transform duration-300 ease-out group-hover/slide:translate-x-1.5 motion-reduce:group-hover/slide:translate-x-0';
const ACTIVE = 'bg-white/5 text-[#39ff14]';

/** Menu da barra lateral: o item da página actual fica com a cor do hover. */
export default function SideNav() {
  const pathname = usePathname() || '/';
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Com a barra compacta mostra-se o nome do item ao passar o rato. É "fixed" para não ser cortado pelo scroll da lista.
  const [tip, setTip] = useState<{ label: string; left: number; top: number } | null>(null);
  const showTip = (label: string) => (e: React.MouseEvent<HTMLElement>) => {
    if (e.currentTarget.closest('aside')?.getAttribute('data-open') === 'true') return setTip(null);
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, left: r.right + 6, top: r.top + r.height / 2 });
  };
  const hideTip = () => setTip(null);

  return (
    <>
      {/* "Início" fica fora da lista com scroll para o seu popup não ser cortado. */}
      <div className="shrink-0">
        <HomesMenu
          label="Início"
          direction="right"
          slide
          icon={
            <span className={ICON_BOX}>
              <Home className="h-5 w-5" />
            </span>
          }
          labelClassName={`pointer-events-none opacity-0 transition-opacity duration-300 group-data-[open=true]/side:pointer-events-auto ${OPEN}`}
          triggerClassName={`gap-0 ${ITEM} ${pathname === '/' ? ACTIVE : `text-gray-200 ${HOVER}`}`}
        />
      </div>
      {/* Só esta lista tem scroll vertical (quando o ecrã é baixo). */}
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-color:#2f5224_transparent] [scrollbar-width:thin]">
        {SIDE_NAV.map(({ label, href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              onMouseEnter={showTip(label)}
              onMouseLeave={hideTip}
              onFocus={showTip(label) as unknown as React.FocusEventHandler<HTMLElement>}
              onBlur={hideTip}
              className={`group/slide ${ITEM} ${active ? ACTIVE : `text-gray-200 ${HOVER}`}`}
            >
              <span className={SLIDE}>
                <span className={ICON_BOX}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={LABEL}>{label}</span>
              </span>
            </Link>
          );
        })}
      </nav>
      {tip && (
        <span
          role="tooltip"
          style={{ left: tip.left, top: tip.top }}
          className="pointer-events-none fixed z-[70] -translate-y-1/2 whitespace-nowrap bg-white px-3 py-1.5 text-[12px] font-medium text-gray-800 shadow-xl"
        >
          {tip.label}
        </span>
      )}
    </>
  );
}
