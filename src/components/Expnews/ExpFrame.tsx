'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';

const STORAGE_KEY = 'ec-side-collapsed';

/** Lê o estado guardado e marca a barra e o conteúdo antes do primeiro desenho. */
const INIT_SCRIPT = `try{if(localStorage.getItem('${STORAGE_KEY}')==='1'){document.querySelectorAll('[data-ec-side]').forEach(function(e){e.setAttribute('data-collapsed','true')})}}catch(e){}`;

const SidebarContext = createContext<{ toggle: () => void }>({ toggle: () => {} });

/**
 * Estrutura da home: barra lateral escura (recolhível) + conteúdo.
 * Recolhida, só mostram os ícones; ao passar o rato aparece o popup do menu.
 */
export default function ExpFrame({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      /* sem localStorage: fica expandida */
    }
  }, []);

  const toggle = useCallback(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setCollapsed((c) => {
        try {
          localStorage.setItem(STORAGE_KEY, c ? '0' : '1');
        } catch {
          /* ignora */
        }
        return !c;
      });
    } else {
      setMobileOpen((o) => !o);
    }
  }, []);

  // No telemóvel a barra aparece sempre expandida (com rótulos).
  const iconsOnly = collapsed && !mobileOpen;

  return (
    <SidebarContext.Provider value={{ toggle }}>
      <aside
        data-ec-side
        data-collapsed={iconsOnly}
        suppressHydrationWarning
        className={`group/side fixed left-0 top-0 z-40 h-screen flex-col overflow-visible bg-[#0b0b0b] text-white transition-[width] duration-200 ${
          mobileOpen ? 'flex w-[220px]' : 'hidden lg:flex'
        } lg:w-[220px] lg:data-[collapsed=true]:w-[64px]`}
      >
        {sidebar}
      </aside>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}
      <div
        data-ec-side
        data-collapsed={collapsed}
        suppressHydrationWarning
        className="transition-[margin] duration-200 lg:ml-[220px] lg:data-[collapsed=true]:ml-[64px]"
      >
        {/* Corre antes de pintar: aplica já o estado guardado, sem a barra "piscar" expandida ao abrir a página. */}
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

/** Botão "MENU" do cabeçalho: recolhe/expande a barra lateral. */
export function MenuToggle() {
  const { toggle } = useContext(SidebarContext);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Recolher ou expandir o menu lateral"
      className="flex shrink-0 flex-col items-center gap-0.5 px-3 text-gray-700 hover:text-[#d6101c]"
    >
      <Menu className="h-5 w-5" />
      <span className="text-[10px] font-bold uppercase tracking-wide">Menu</span>
    </button>
  );
}
