import { AD_LETTER, AD_POSITIONS, AD_SLOTS, EMAIL_WIDTH, adMeasure, formatPrice, type AdPosition } from '@/lib/newsletter-brand';

const GREY = 'bg-[#e4e6e8]';
const SCALE = 0.5; // a altura de cada espaço no esquema é metade da real, para se ver a diferença entre eles

/** Um espaço de publicidade, com a altura proporcional à real, a medida única, o peso máximo e o custo. */
function Space({ position, prices }: { position: AdPosition; prices: Record<string, number> }) {
  const s = AD_SLOTS.find((x) => x.position === position)!;
  return (
    <div className="flex items-center justify-center border border-dashed border-[#d6101c] bg-white px-3 text-[#1d2327]" style={{ minHeight: Math.max(44, s.h * SCALE) }}>
      <div className="flex min-w-0 flex-col items-center gap-1 py-2 text-center">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6101c] text-[11px] text-white">{AD_LETTER[position]}</span>
        <div className="min-w-0">
          <div className="text-[15px] max-sm:whitespace-nowrap max-sm:text-[14px] max-sm:leading-tight sm:leading-5"><span className="font-bold">{AD_POSITIONS[position]}</span><span className="block text-[14px] text-[#50575e] max-sm:whitespace-nowrap max-sm:text-[12.5px]">{adMeasure(s)}</span></div>
          <div className="shrink-0 text-[15px] font-bold text-[#d6101c] max-sm:whitespace-nowrap max-sm:text-[13px]">{formatPrice(prices[s.key])}</div>
        </div>
      </div>
    </div>
  );
}

/** Esquema da newsletter com os cinco espaços de publicidade (A a E): onde ficam, medida, peso máximo e custo. */
export default function AdWireframe({ prices }: { prices: Record<string, number> }) {
  const head = AD_SLOTS.find((x) => x.position === 'cabecalho')!;
  return (
    <div className="mx-auto w-full space-y-2" style={{ maxWidth: EMAIL_WIDTH }}>
      <Space position="topo" prices={prices} />

      {/* Cabeçalho: símbolo, dados da empresa e, à direita, o espaço B */}
      <div className="flex items-stretch gap-3 border-b-4 border-[#d6101c] bg-white p-3">
        <div className={`h-16 w-16 shrink-0 self-center ${GREY}`} />
        <div className="w-px bg-[#d5d8db]" />
        <div className="min-w-0 flex-1 space-y-1.5 self-center"><div className={`h-2.5 w-3/4 ${GREY}`} /><div className={`h-2 w-full ${GREY}`} /><div className={`h-2 w-2/3 ${GREY}`} /></div>
        <div className="flex shrink-0 flex-col items-center justify-center border border-dashed border-[#d6101c] px-1 text-center max-sm:w-[158px] max-sm:px-2 max-sm:text-center sm:w-[184px]" style={{ aspectRatio: `${head.w} / ${head.h}` }}>
          <div className="flex flex-col items-center">
            <span className="mb-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6101c] text-[11px] text-white max-sm:mb-0">{AD_LETTER.cabecalho}</span>
            <div className="flex flex-col items-center">
              <span className="text-[11px] leading-tight text-[#1d2327] max-sm:whitespace-nowrap max-sm:text-[11px] max-sm:leading-tight sm:text-[13px]"><span className="font-bold">{AD_POSITIONS.cabecalho}</span><span className="block whitespace-nowrap text-[#50575e] max-sm:text-[8px] sm:text-[10px]">{adMeasure(head)}</span></span>
              <span className="text-[11px] font-bold text-[#d6101c] max-sm:whitespace-nowrap max-sm:text-[12px] sm:text-[13px]">{formatPrice(prices[head.key])}</span>
            </div>
          </div>
        </div>
      </div>

      <Space position="depois" prices={prices} />

      <div className="space-y-2 bg-white p-3">
        <div className={`h-24 w-full ${GREY}`} />
        <div className={`h-3 w-2/3 ${GREY}`} />
        <div className={`h-2 w-full ${GREY}`} />
        <div className="h-6 w-20 bg-[#3e6611]/50" />
      </div>
      <div className="flex gap-3 bg-white p-3">
        <div className={`h-14 w-24 shrink-0 ${GREY}`} />
        <div className="flex-1 space-y-1.5 self-center"><div className={`h-2.5 w-3/4 ${GREY}`} /><div className={`h-2 w-1/3 ${GREY}`} /></div>
      </div>

      <Space position="meio" prices={prices} />

      <div className="flex gap-3 bg-white p-3">
        <div className={`h-14 w-24 shrink-0 ${GREY}`} />
        <div className="flex-1 space-y-1.5 self-center"><div className={`h-2.5 w-3/4 ${GREY}`} /><div className={`h-2 w-1/3 ${GREY}`} /></div>
      </div>

      <Space position="rodape" prices={prices} />

      <div className="bg-[#1d2327] p-3">
        <div className="space-y-1.5"><div className="h-2 w-32 bg-white/50" /><div className="h-2 w-24 bg-white/30" /></div>
      </div>
    </div>
  );
}
