'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';

const SidebarContext = createContext<{ open: boolean; toggle: () => void }>({ open: false, toggle: () => {} });

/**
 * Estrutura da home: barra lateral escura + conteúdo.
 * A barra entra sempre fechada (em ecrã grande só ícones, 64px). Se o utilizador a abrir com o botão Menu (220px),
 * a escolha fica guardada e ela só volta a fechar quando ele a fechar. No telemóvel abre só com um clique em "Menu" e desliza da esquerda.
 */
const STORAGE_KEY = 'ec-sidebar-v2';
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

/** Estado inicial da barra: fechada, a não ser que o utilizador a tenha aberto. */
function wantedOpen() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* sem armazenamento */
  }
  return isDesktop() && saved === 'open';
}

// Na primeira carga da página o HTML do servidor não sabe qual é a preferência. Este script corre antes de a página
// ser pintada e põe a barra já no estado certo (sem a ver abrir ou fechar). Nas navegações dentro do site
// o estado já nasce certo (ver `booted`).
const INIT_SCRIPT = `(function(s){try{var a=s.previousElementSibling,f=a&&a.closest('[data-ec-frame]');
var o=window.matchMedia('(min-width: 1024px)').matches&&localStorage.getItem('${STORAGE_KEY}')==='open';
if(a)a.setAttribute('data-open',o);if(f)f.setAttribute('data-open',o)}catch(e){}})(document.currentScript)`;
let booted = false;

export default function ExpFrame({ sidebar, topBar, children }: { sidebar: React.ReactNode; topBar?: React.ReactNode; children: React.ReactNode }) {
  // 1.ª carga: começa fechada para coincidir com o HTML do servidor (o script acima acerta o aspecto). Depois: já certa.
  const [open, setOpen] = useState(() => booted && wantedOpen());

  // Escolha do utilizador (só em ecrã grande, onde a barra é fixa): guarda-se para as páginas seguintes.
  const choose = useCallback((value: boolean) => {
    setOpen(value);
    if (isDesktop()) {
      try {
        localStorage.setItem(STORAGE_KEY, value ? 'open' : 'closed');
      } catch {
        /* sem armazenamento */
      }
    }
  }, []);

  const toggle = useCallback(() => choose(!open), [choose, open]);

  // Ecrã grande: fechada, a não ser que o utilizador a tenha aberto. Ecrã pequeno: sempre fechada
  // (abre por cima do conteúdo). Acompanha também o redimensionamento da janela.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setOpen(wantedOpen());
    apply();
    booted = true;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Esc fecha.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && choose(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, choose]);

  const ease = 'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]';

  return (
    <SidebarContext.Provider value={{ open, toggle }}>
      <div data-open={open} data-ec-frame suppressHydrationWarning className="group/frame">
        {/* Barra verde: atravessa toda a largura, por cima da barra lateral */}
        {topBar}
        <div className="flex">
          {/* Em ecrã grande a barra fica colada ao topo (sticky) logo abaixo da barra verde; no telemóvel abre por cima. */}
          <aside
            data-open={open}
            suppressHydrationWarning
            className={`group/side z-40 flex flex-col bg-[#0c1f08] text-white border-r-2 border-[#39ff14] transition-[width] max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:h-[100dvh] max-lg:w-[220px] max-lg:pb-4 max-lg:transition-[transform,visibility] ${ease} ${
              open ? 'max-lg:translate-x-0' : 'max-lg:invisible max-lg:-translate-x-full'
            } lg:sticky lg:top-0 lg:h-screen lg:pb-9 lg:w-16 lg:shrink-0 lg:self-start lg:data-[open=true]:w-[220px]`}
          >
            {sidebar}
          </aside>
          {!booted && <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />}
          {/* No telemóvel a barra desliza por cima do conteúdo (sem saltar), por isso há um fundo, que aparece e some suavemente, para a fechar. */}
          <button
            type="button"
            aria-label="Fechar menu"
            tabIndex={open ? 0 : -1}
            onClick={() => choose(false)}
            className={`fixed inset-0 z-30 bg-black/50 transition-opacity ${ease} lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

/** Botão "MENU" do cabeçalho: abre/fecha a barra lateral. */
export function MenuToggle() {
  const { toggle } = useContext(SidebarContext);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Abrir ou fechar o menu lateral"
      className="flex shrink-0 flex-col items-center gap-0.5 pl-0 pr-3 text-gray-700 hover:text-[#d6101c]"
    >
      <Menu className="h-5 w-5" />
      <span className="text-[10px] font-bold uppercase tracking-wide">Menu</span>
    </button>
  );
}
