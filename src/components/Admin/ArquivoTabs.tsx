import Link from 'next/link';
import type { ReactNode } from 'react';

/** Separadores do Arquivo de fotos (a janela principal é o arquivo); `right` fica à direita na mesma linha (ex.: pesquisa). */
export default function ArquivoTabs({ active, right }: { active: 'arquivo' | 'partilhadas'; right?: ReactNode }) {
  const tab = (on: boolean) =>
    `px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${on ? 'border-[#00a651] text-[#008f45]' : 'border-transparent text-[#50575e] hover:text-[#008f45]'}`;
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#ccd0d4]">
      <div className="flex">
        <Link href="/admin/arquivo" className={tab(active === 'arquivo')}>Arquivo</Link>
        <Link href="/admin/partilhado" className={tab(active === 'partilhadas')}>Fotos partilhadas</Link>
      </div>
      {right && <div className="pb-1.5">{right}</div>}
    </div>
  );
}
