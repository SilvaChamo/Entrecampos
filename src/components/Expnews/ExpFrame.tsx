'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';

const SidebarContext = createContext<{ open: boolean; toggle: () => void }>({ open: false, toggle: () => {} });

/**
 * Estrutura da home: barra lateral escura + conteúdo.
 * Por defeito a barra está recolhida (só ícones, 64px). Abre só com um clique em "Menu" (220px) e o conteúdo
 * acompanha-a, sem nunca ficar tapado.
 */
export default function ExpFrame({ sidebar, topBar, children }: { sidebar: React.ReactNode; topBar?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  // Esc fecha.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const ease = 'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]';

  return (
    <SidebarContext.Provider value={{ open, toggle }}>
      <div data-open={open} className="group/frame">
        {/* Barra verde: atravessa toda a largura, por cima da barra lateral */}
        {topBar}
        <div className="flex">
          {/* Em ecrã grande a barra fica colada ao topo (sticky) logo abaixo da barra verde; no telemóvel abre por cima. */}
          <aside
            data-open={open}
            className={`group/side z-40 flex-col bg-[#0c1f08] text-white border-r-2 border-[#39ff14] transition-[width] ${ease} ${
              open ? 'flex w-[220px] max-lg:fixed max-lg:inset-y-0 max-lg:left-0' : 'hidden'
            } lg:sticky lg:top-0 lg:flex lg:h-screen lg:pb-9 lg:w-16 lg:shrink-0 lg:self-start lg:data-[open=true]:w-[220px]`}
          >
            {sidebar}
          </aside>
          {/* No telemóvel a barra abre por cima, por isso há um fundo para fechar. */}
          {open && (
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            />
          )}
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
