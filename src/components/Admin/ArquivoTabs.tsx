import Link from 'next/link';
import type { ReactNode } from 'react';

/** Separadores do Arquivo de fotos (a janela principal é o arquivo); `right` fica à direita na mesma linha (ex.: pesquisa). */
export default function ArquivoTabs({ active, right }: { active: 'arquivo' | 'partilhadas'; right?: ReactNode }) {
  // A linha verde do separador activo fica só por baixo das letras (com uma pequena folga nos lados).
  const tab = (on: boolean) =>
    `relative px-4 py-2 text-sm font-semibold ${on ? 'text-[#008f45]' : 'text-[#50575e] hover:text-[#008f45]'}`;
  const line = <span aria-hidden="true" className="absolute inset-x-[18px] -bottom-px h-[2px] bg-[#00a651]" />;
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#ccd0d4]">
      <div className="flex">
        <Link href="/admin/arquivo" className={tab(active === 'arquivo')}>Arquivo{active === 'arquivo' && line}</Link>
        <Link href="/admin/partilhado" className={tab(active === 'partilhadas')}>Fotos partilhadas{active === 'partilhadas' && line}</Link>
      </div>
      {right && <div className="pb-1.5">{right}</div>}
    </div>
  );
}
