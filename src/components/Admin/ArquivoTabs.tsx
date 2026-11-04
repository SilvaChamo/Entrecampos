import Link from 'next/link';

/** Separadores do Arquivo de fotos: a janela principal é o arquivo; as fotos que chegam ao e-mail têm o seu separador. */
export default function ArquivoTabs({ active }: { active: 'arquivo' | 'partilhadas' }) {
  const tab = (on: boolean) =>
    `px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${on ? 'border-[#00a651] text-[#008f45]' : 'border-transparent text-[#50575e] hover:text-[#008f45]'}`;
  return (
    <div className="mb-5 flex border-b border-[#ccd0d4]">
      <Link href="/admin/arquivo" className={tab(active === 'arquivo')}>Arquivo</Link>
      <Link href="/admin/partilhado" className={tab(active === 'partilhadas')}>Fotos partilhadas</Link>
    </div>
  );
}
