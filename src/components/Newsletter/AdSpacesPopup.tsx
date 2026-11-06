import type { ReactNode } from 'react';
import AdWireframe from '@/components/Newsletter/AdWireframe';
import SiteAdWireframe from '@/components/Newsletter/SiteAdWireframe';
import { BRAND } from '@/lib/newsletter-brand';

// Marca de água: o nome repetido na diagonal, por trás do conteúdo (dificulta cópias; não impede capturas de ecrã).
const MARK = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="170"><text x="130" y="85" text-anchor="middle" transform="rotate(-24 130 85)" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="bold" letter-spacing="3" fill="#1d2327" fill-opacity="0.07">ENTRECAMPOS</text></svg>`,
)}`;

/** Janela com os espaços de publicidade: cabeçalho do EntreCAMPOS e marca de água por trás do esquema. */
export default function AdSpacesPopup({ prices, className = '', headerAction, headerLink, footerAction, view = 'newsletter' }: { prices: Record<string, number>; className?: string; view?: 'newsletter' | 'site'; headerAction?: ReactNode; headerLink?: ReactNode; footerAction?: ReactNode }) {
  return (
    <div className={`relative select-none overflow-hidden bg-white text-[#2c3338] ${className}`}>
      <div className="border-b-4 border-[#d6101c] bg-white p-3 sm:p-4">
        <div className="mx-auto flex w-full max-w-[680px] flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/entrecampos-simbolo.png" alt={BRAND.name} className="block h-14 w-14 object-cover" draggable={false} />
          <div className="min-w-0">
            <div className="whitespace-nowrap text-[11.5px] font-bold leading-tight text-[#1d2327] sm:text-[17px]">Espaços de publicidade</div>
            <div className="text-[12px] text-[#50575e] max-sm:whitespace-nowrap max-sm:text-[5.5px]">{view === 'site' ? 'Site' : 'Newsletter'} {BRAND.name}<span className="max-sm:hidden"> ·</span> {BRAND.headline}</div>
          </div>
          {headerAction}
          {headerLink && <div className="max-sm:w-full sm:ml-auto">{headerLink}</div>}
        </div>
      </div>
      <div className="relative p-3 sm:p-4">
        <div className="relative z-10">{view === 'site' ? <SiteAdWireframe /> : <AdWireframe prices={prices} />}</div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" style={{ backgroundImage: `url("${MARK}")`, backgroundRepeat: 'repeat' }} />
      </div>
      <p className="border-t border-[#e5e5e5] p-3 text-center text-[12px] text-[#50575e] max-sm:whitespace-nowrap max-sm:text-[4.5px] sm:p-4">Para anunciar, fale connosco: {BRAND.emails.join(' · ')} · {BRAND.phones.join(' · ')}</p>
      {footerAction && <div className="border-t border-[#e5e5e5] p-3 sm:p-4">{footerAction}</div>}
    </div>
  );
}
