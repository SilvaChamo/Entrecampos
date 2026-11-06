const GREY = 'bg-[#e4e6e8]';

type SiteSlot = { letter: string; name: string; w: number; h: number; kb: number };

// Espaços de exemplo do site (medidas e pesos provisórios; todos «Sob consulta» até haver tabela de preços).
const SLOTS: Record<string, SiteSlot> = {
  topo: { letter: 'A', name: 'Topo do site', w: 728, h: 90, kb: 100 },
  lateral1: { letter: 'B', name: 'Barra lateral (cima)', w: 120, h: 200, kb: 120 },
  lateral2: { letter: 'C', name: 'Barra lateral (baixo)', w: 120, h: 200, kb: 120 },
  entre: { letter: 'D', name: 'Entre as notícias', w: 680, h: 150, kb: 100 },
  artigo: { letter: 'E', name: 'Dentro da notícia', w: 680, h: 200, kb: 120 },
  rodape: { letter: 'F', name: 'Em cima do rodapé', w: 728, h: 90, kb: 100 },
};

/** Um espaço de publicidade do site: letra, nome, medida, peso e preço, tudo centrado. */
function Space({ id, minHeight = 80 }: { id: keyof typeof SLOTS; minHeight?: number }) {
  const s = SLOTS[id];
  return (
    <div className="flex flex-col items-center justify-center gap-1 border border-dashed border-[#d6101c] bg-white px-2 py-2 text-center text-[#1d2327]" style={{ minHeight }}>
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d6101c] text-[11px] text-white">{s.letter}</span>
      <span className="whitespace-nowrap text-[14px] font-bold leading-tight max-sm:text-[8px]">{s.name}</span>
      <span className="whitespace-nowrap text-[12px] leading-tight text-[#50575e] max-sm:text-[5.5px]">Medida: {s.w}x{s.h}px, Tamanho: {s.kb}kb</span>
      <span className="whitespace-nowrap text-[14px] font-bold leading-tight text-[#d6101c] max-sm:text-[8px]">Sob consulta</span>
    </div>
  );
}

/** Esquema do site com os espaços de publicidade (A a F): topo, barra lateral, entre as notícias, dentro da notícia e em cima do rodapé. */
export default function SiteAdWireframe() {
  return (
    <div className="mx-auto w-full space-y-2" style={{ maxWidth: 680 }}>
      <div className="flex items-center gap-3 bg-white p-3">
        <div className={`h-10 w-10 shrink-0 ${GREY}`} />
        <div className="flex-1 space-y-1.5"><div className={`h-2.5 w-1/3 ${GREY}`} /><div className={`h-2 w-1/2 ${GREY}`} /></div>
      </div>
      <Space id="topo" />
      <div className="flex gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-2 bg-white p-3">
            <div className={`h-20 w-full ${GREY}`} />
            <div className={`h-3 w-2/3 ${GREY}`} />
            <div className={`h-2 w-full ${GREY}`} />
          </div>
          <Space id="entre" minHeight={100} />
          <div className="space-y-2 bg-white p-3">
            <div className={`h-3 w-2/3 ${GREY}`} />
            <div className={`h-2 w-full ${GREY}`} />
            <div className={`h-2 w-5/6 ${GREY}`} />
          </div>
          <Space id="artigo" minHeight={110} />
          <div className="space-y-2 bg-white p-3">
            <div className={`h-2 w-full ${GREY}`} />
            <div className={`h-2 w-3/4 ${GREY}`} />
          </div>
        </div>
        <div className="w-[38%] shrink-0 space-y-2">
          <Space id="lateral1" minHeight={150} />
          <div className="bg-white p-3"><div className={`h-16 w-full ${GREY}`} /></div>
          <Space id="lateral2" minHeight={150} />
        </div>
      </div>
      <Space id="rodape" />
      <div className="bg-[#1d2327] p-3"><div className="space-y-1.5"><div className="h-2 w-32 bg-white/50" /><div className="h-2 w-24 bg-white/30" /></div></div>
    </div>
  );
}
