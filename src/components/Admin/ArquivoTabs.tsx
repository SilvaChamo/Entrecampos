'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

/** Separadores do Arquivo de fotos (a janela principal é o arquivo); `right` fica à direita na mesma linha (ex.: pesquisa). */
/** No telemóvel, `mobileAction` fica ao lado do selector e `mobileBelow` ocupa a linha de baixo (a largura toda); `right` só se vê no computador. */
export default function ArquivoTabs({ active, right, mobileAction, mobileBelow, onPartilhadasClick, onArquivoClick, slots }: { active: 'arquivo' | 'partilhadas'; right?: ReactNode; mobileAction?: ReactNode; mobileBelow?: ReactNode; onPartilhadasClick?: () => void; onArquivoClick?: () => void; slots?: boolean }) {
  const router = useRouter();
  const withSlots = slots ?? active === 'partilhadas'; // caixa de selecção antes e contador depois dos separadores
  // A linha verde do separador activo fica só por baixo das letras (com uma pequena folga nos lados).
  const tab = (on: boolean, first = false) =>
    `relative ${first ? 'pl-0 pr-3' : 'px-3'} py-2 text-sm ${on ? 'text-[#008f45]' : 'text-[#50575e] hover:text-[#008f45]'}`;
  const line = (first = false) => <span aria-hidden="true" className={`absolute -bottom-px h-[2px] bg-[#00a651] ${first ? 'left-0 right-[10px]' : 'inset-x-[10px]'}`} />;
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-[#ccd0d4]">
      <div className={`flex items-end ${mobileAction ? 'max-md:w-full max-md:items-center max-md:gap-2' : ''}`}>
        {withSlots && <div id="ec-bulk-check" className="mr-3 flex items-center self-center empty:hidden" />}
        {/* Telemóvel: os separadores passam a um selector */}
        <select
          value={active}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'arquivo') { if (onArquivoClick) onArquivoClick(); else router.push('/admin/arquivo'); }
            else if (onPartilhadasClick) onPartilhadasClick(); else router.push('/admin/partilhado');
          }}
          className={`${mobileAction ? 'min-w-0 flex-1' : 'mb-2'} h-9 w-full border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none md:hidden`}
        >
          <option value="arquivo">Arquivo</option>
          <option value="partilhadas">Arquivos partilhados</option>
        </select>
        <Link href="/admin/arquivo" onClick={(e) => { if (onArquivoClick) { e.preventDefault(); onArquivoClick(); } }} className={`${tab(active === 'arquivo', true)} max-md:hidden`}>Arquivo{active === 'arquivo' && line(true)}</Link>
        <Link href="/admin/partilhado" onClick={(e) => { if (onPartilhadasClick) { e.preventDefault(); onPartilhadasClick(); } }} className={`${tab(active === 'partilhadas')} max-md:hidden`}>Arquivos partilhados{active === 'partilhadas' && line()}</Link>
        {mobileAction && <div className="shrink-0 md:hidden">{mobileAction}</div>}
        {withSlots && <div id="ec-bulk-slot" className="ml-3 flex items-center gap-3 self-center" />}
      </div>
      {mobileBelow && <div className="w-full pb-3 md:hidden">{mobileBelow}</div>}
      {right && <div className={`pb-1.5 ${mobileAction || mobileBelow ? 'max-md:hidden' : ''}`}>{right}</div>}
    </div>
  );
}
