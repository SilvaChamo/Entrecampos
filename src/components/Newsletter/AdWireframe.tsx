import { AD_LETTER, AD_POSITIONS, AD_SLOTS, EMAIL_WIDTH, adSizeName, formatPrice, type AdPosition } from '@/lib/newsletter-brand';

const GREY = 'bg-[#dcdfe2]';

/** Caixa de um espaço de publicidade: a posição, os tamanhos disponíveis e o custo de cada um. */
function Space({ position }: { position: AdPosition }) {
  const letter = AD_LETTER[position];
  const options = AD_SLOTS.filter((s) => s.position === position);
  return (
    <div className="flex min-h-[64px] flex-col justify-center border-2 border-dashed border-[#d6101c] bg-[#fdecee] px-3 py-2 text-[12px] leading-snug text-[#1d2327]">
      <div className="font-bold"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d6101c] text-[11px] text-white">{letter}</span>{AD_POSITIONS[position]}</div>
      {options.map((o) => (
        <div key={o.key} className="mt-0.5 text-[#50575e]">{adSizeName(o.size)} {o.w} × {o.h} px · até {o.kb} KB</div>
      ))}
    </div>
  );
}

/**
 * Esquema da newsletter com os espaços onde pode haver publicidade (A a E), os tamanhos e o custo de cada um.
 * Componente simples (sem estado) para servir no painel e na página pública.
 */
export default function AdWireframe({ prices }: { prices: Record<string, number> }) {
  return (
    <div className="mx-auto w-full" style={{ maxWidth: EMAIL_WIDTH }}>
      <div className="space-y-2 bg-[#f0f0f1] p-3">
        <Space position="topo" />

        {/* Cabeçalho: símbolo, dados da empresa e, à direita, a caixa de publicidade */}
        <div className="flex items-center gap-3 border-b-4 border-[#d6101c] bg-white p-3">
          <div className={`h-14 w-14 shrink-0 ${GREY}`} />
          <div className="w-px self-stretch bg-[#d5d8db]" />
          <div className="min-w-0 flex-1 space-y-1.5"><div className={`h-2.5 w-3/4 ${GREY}`} /><div className={`h-2 w-full ${GREY}`} /><div className={`h-2 w-2/3 ${GREY}`} /></div>
          <div className="flex h-14 w-24 shrink-0 flex-col items-center justify-center border-2 border-dashed border-[#d6101c] bg-[#fdecee] text-center text-[10px] font-bold leading-tight text-[#1d2327] sm:w-32">
            <span className="mb-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#d6101c] text-[9px] text-white">{AD_LETTER.cabecalho}</span>No cabeçalho
          </div>
        </div>

        <Space position="depois" />

        {/* Notícia em destaque e cartões */}
        <div className="space-y-2 bg-white p-3">
          <div className={`h-28 w-full ${GREY}`} />
          <div className={`h-3 w-2/3 ${GREY}`} /><div className={`h-2 w-full ${GREY}`} /><div className="h-6 w-20 bg-[#3e6611]/60" />
        </div>
        <div className="flex gap-3 bg-white p-3">
          <div className={`h-16 w-24 shrink-0 ${GREY}`} />
          <div className="flex-1 space-y-1.5"><div className={`h-2.5 w-3/4 ${GREY}`} /><div className={`h-2 w-1/3 ${GREY}`} /><div className="h-5 w-16 bg-[#3e6611]/60" /></div>
        </div>

        <Space position="meio" />

        <div className="flex gap-3 bg-white p-3">
          <div className={`h-16 w-24 shrink-0 ${GREY}`} />
          <div className="flex-1 space-y-1.5"><div className={`h-2.5 w-3/4 ${GREY}`} /><div className={`h-2 w-1/3 ${GREY}`} /><div className="h-5 w-16 bg-[#3e6611]/60" /></div>
        </div>

        <Space position="rodape" />

        <div className="flex items-center justify-between gap-3 bg-[#1d2327] p-3">
          <div className="space-y-1.5"><div className="h-2 w-32 bg-white/50" /><div className="h-2 w-24 bg-white/30" /><div className="h-2 w-20 bg-white/30" /></div>
          <div className="border border-[#a7aaad] px-2 py-1.5 text-[10px] text-white">Ver espaços de publicidade</div>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[#ccd0d4] bg-[#f6f7f7] text-left"><th className="px-3 py-2 font-bold">Espaço</th><th className="px-3 py-2 font-bold">Tamanho</th><th className="px-3 py-2 text-right font-bold">Peso máx.</th><th className="px-3 py-2 text-right font-bold">Custo</th></tr>
        </thead>
        <tbody>
          {AD_SLOTS.map((s) => (
            <tr key={s.key} className="border-b border-[#f0f0f1]">
              <td className="px-3 py-2 font-bold text-[#1d2327]">{AD_LETTER[s.position]} · {AD_POSITIONS[s.position]}</td>
              <td className="px-3 py-2 text-[#50575e]">{adSizeName(s.size)} · {s.w} × {s.h} px</td>
              <td className="whitespace-nowrap px-3 py-2 text-right text-[#50575e]">{s.kb} KB</td>
              <td className="whitespace-nowrap px-3 py-2 text-right">{formatPrice(prices[s.key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
