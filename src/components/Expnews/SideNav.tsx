'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
// Largura da gaveta de um item: ícone (64px) + o texto mais comprido + 25px de espaço.
const FLY_OPEN = 196;
const ACTIVE = 'bg-white/5 text-[#39ff14]';

/** Menu da barra lateral: o item da página actual fica com a cor do hover. */
export default function SideNav() {
  const pathname = usePathname() || '/';
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Com a barra recolhida (ecrã grande), ao apontar um item abre-se SÓ essa linha para a direita, como uma gaveta, com o fundo e a
  // linha vertical da barra, por cima do conteúdo. É "fixed" para não ser cortada pelo scroll da lista; as outras linhas ficam como estão.
  // Tudo é feito direto no elemento (sem estado do React): apontar um item não volta a desenhar a lista, por isso a gaveta arranca logo.
  const router = useRouter();
  const flyRef = useRef<HTMLAnchorElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const anim = useRef<Animation | null>(null);
  const hide = () => {
    const el = flyRef.current;
    if (!el || el.style.visibility !== 'visible') return;
    anim.current?.cancel();
    const a = el.animate([{ width: `${FLY_OPEN}px` }, { width: '64px' }], { duration: 350, easing: 'ease-out' });
    anim.current = a;
    a.onfinish = () => {
      if (anim.current === a) {
        el.style.visibility = 'hidden';
        el.style.width = '';
      }
    };
    el.style.width = '64px';
  };
  const show = (e: React.SyntheticEvent<HTMLElement>) => {
    const link = e.currentTarget;
    const el = flyRef.current;
    if (!el || link.closest('aside')?.getAttribute('data-open') === 'true') return hide();
    const svg = link.querySelector('svg');
    iconRef.current?.replaceChildren(...(svg ? [svg.cloneNode(true)] : []));
    if (labelRef.current) labelRef.current.textContent = link.getAttribute('aria-label');
    el.setAttribute('href', link.getAttribute('href') || '/');
    el.style.top = `${link.getBoundingClientRect().top}px`;
    el.style.visibility = 'visible';
    el.style.width = `${FLY_OPEN}px`;
    anim.current?.cancel();
    // Cada item começa sempre a deslizar do início, com um pequeno balanço no fim (flexível, sem ser rápido).
    anim.current = el.animate([{ width: '64px' }, { width: `${FLY_OPEN}px` }], { duration: 600, easing: 'cubic-bezier(0.25, 0.7, 0.3, 1.2)' });
  };
  const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    router.push(e.currentTarget.getAttribute('href') || '/');
  };

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
      <nav onScroll={hide} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-color:#2f5224_transparent] [scrollbar-width:thin]">
        {SIDE_NAV.map(({ label, href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              onMouseEnter={show}
              onFocus={show}
              onBlur={hide}
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
      <a
        ref={flyRef}
        href="/"
        tabIndex={-1}
        aria-hidden
        onClick={go}
        onMouseLeave={hide}
        className={`${ITEM} invisible fixed left-0 top-0 z-[60] h-[37px] w-16 items-center overflow-hidden whitespace-nowrap border-r-2 border-[#39ff14] bg-[#12290d] text-[#39ff14] shadow-[6px_0_16px_rgba(0,0,0,0.35)] will-change-[width] max-lg:hidden`}
      >
        <span ref={iconRef} className={ICON_BOX} />
        <span ref={labelRef} />
      </a>
    </>
  );
}
