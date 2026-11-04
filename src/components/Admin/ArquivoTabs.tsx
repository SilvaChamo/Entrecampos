import Link from 'next/link';
import type { ReactNode } from 'react';

/** Separadores do Arquivo de fotos (a janela principal é o arquivo); `right` fica à direita na mesma linha (ex.: pesquisa). */
export default function ArquivoTabs({ active, right, onPartilhadasClick, onArquivoClick, slots }: { active: 'arquivo' | 'partilhadas'; right?: ReactNode; onPartilhadasClick?: () => void; onArquivoClick?: () => void; slots?: boolean }) {
  const withSlots = slots ?? active === 'partilhadas'; // caixa de seleção antes e contador depois dos separadores
  // A linha verde do separador activo fica só por baixo das letras (com uma pequena folga nos lados).
  const tab = (on: boolean, first = false) =>
    `relative ${first ? 'pl-0 pr-3' : 'px-3'} py-2 text-sm font-semibold ${on ? 'text-[#008f45]' : 'text-[#50575e] hover:text-[#008f45]'}`;
  const line = (first = false) => <span aria-hidden="true" className={`absolute -bottom-px h-[2px] bg-[#00a651] ${first ? 'left-0 right-[10px]' : 'inset-x-[10px]'}`} />;
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-[#ccd0d4]">
      <div className="flex items-end">
        {withSlots && <div id="ec-bulk-check" className="mr-3 flex items-center self-center empty:hidden" />}
        <Link href="/admin/arquivo" onClick={(e) => { if (onArquivoClick) { e.preventDefault(); onArquivoClick(); } }} className={tab(active === 'arquivo', true)}>Arquivo{active === 'arquivo' && line(true)}</Link>
        <Link href="/admin/partilhado" onClick={(e) => { if (onPartilhadasClick) { e.preventDefault(); onPartilhadasClick(); } }} className={tab(active === 'partilhadas')}>Arquivos partilhados{active === 'partilhadas' && line()}</Link>
        {withSlots && <div id="ec-bulk-slot" className="ml-3 flex items-center gap-3 self-center" />}
      </div>
      {right && <div className="pb-1.5">{right}</div>}
    </div>
  );
}
