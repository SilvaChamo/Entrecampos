'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Pesquisa do cabeçalho. Computador: o campo ao lado do ícone, como sempre. Telemóvel: o ícone abre um popup com o campo;
 * ao carregar em «Pesquisar» o popup fecha e abre a página de resultados.
 */
export default function HeaderSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <form action="/noticias" className="hidden items-center gap-2 border-l border-gray-200 pl-4 md:flex">
        <button type="submit" aria-label="Pesquisar" className="hover:text-[#d6101c]">
          <Search className="h-4 w-4" />
        </button>
        <input
          name="q"
          placeholder="Pesquisar"
          className="w-40 border-0 bg-transparent text-[13px] font-normal normal-case outline-none placeholder:font-normal placeholder:normal-case placeholder:text-gray-500 lg:w-52 xl:w-56"
        />
      </form>

      <div className="flex items-center border-l border-gray-200 pl-4 md:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Pesquisar" aria-haspopup="dialog" className="hover:text-[#d6101c]">
          <Search className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/50 md:hidden" onClick={() => setOpen(false)}>
          <form
            action="/noticias"
            role="dialog"
            aria-label="Pesquisar notícias"
            onClick={(e) => e.stopPropagation()}
            onSubmit={() => setOpen(false)}
            className="w-full bg-white p-3 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-bold uppercase tracking-wide text-[#1d2327]">Pesquisar</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-gray-500 hover:text-[#d6101c]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              name="q"
              autoFocus
              placeholder="Escreva o que procura"
              className="h-10 w-full border border-gray-300 px-3 text-[16px] font-normal normal-case text-[#1d2327] outline-none placeholder:font-normal placeholder:normal-case placeholder:text-gray-500 focus:border-[#d6101c]"
            />
            <button type="submit" className="mt-2 flex h-10 w-full items-center justify-center gap-2 bg-[#d6101c] text-[13px] font-bold uppercase tracking-wide text-white hover:bg-[#a30c15]">
              <Search className="h-4 w-4" />
              Pesquisar
            </button>
          </form>
        </div>
      )}
    </>
  );
}
