'use client';

import { useRef, useState } from 'react';
import Cropper from 'react-cropper';
import 'react-cropper/node_modules/cropperjs/dist/cropper.css';
import { Check, X } from 'lucide-react';
import type { CropRect } from '@/lib/client-image';

const RATIOS: { label: string; value: number }[] = [
  { label: 'Livre', value: NaN },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
];

/** Janela de recorte, igual em todo o painel (texto da notícia, galeria, imagem de destaque). Devolve a área escolhida em píxeis da foto original. */
export default function CropDialog({ src, onConfirm, onClose }: { src: string; onConfirm: (rect: CropRect) => void; onClose: () => void }) {
  const cropperRef = useRef<HTMLImageElement & { cropper?: any }>(null);
  const [ratio, setRatio] = useState(NaN);

  const confirm = () => {
    const d = cropperRef.current?.cropper?.getData(true);
    if (!d || d.width < 1 || d.height < 1) return;
    onConfirm({ x: d.x, y: d.y, width: d.width, height: d.height });
  };

  return (
    <div className="fixed inset-0 z-[400] flex flex-col bg-[#1d2327]" role="dialog" aria-modal="true" aria-label="Recortar foto">
      <div className="flex shrink-0 items-center justify-between border-b border-[#3c434a] p-4">
        <h2 className="text-[16px] font-semibold text-white">Recortar foto</h2>
        <button type="button" onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-[#2c3338]" aria-label="Fechar"><X className="h-5 w-5 text-gray-400" /></button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#3c434a] bg-[#2c3338] p-3">
        {RATIOS.map((r) => {
          const on = Number.isNaN(r.value) ? Number.isNaN(ratio) : ratio === r.value;
          return (
            <button
              key={r.label}
              type="button"
              onClick={() => { setRatio(r.value); cropperRef.current?.cropper?.setAspectRatio(r.value); }}
              className={`rounded px-3 py-1.5 text-[12px] font-medium transition-all ${on ? 'bg-[#00a651] text-white' : 'bg-[#1d2327] text-gray-300 hover:bg-[#3c434a]'}`}
            >
              {r.label}
            </button>
          );
        })}
        <div className="flex-1" />
        <button type="button" onClick={onClose} className="rounded bg-[#3c434a] px-4 py-1.5 text-[12px] text-white hover:bg-[#4c535a]">Cancelar</button>
        <button type="button" onClick={confirm} className="flex items-center gap-2 rounded bg-[#00a651] px-4 py-1.5 text-[12px] font-bold text-white hover:bg-[#008f45]">
          <Check className="h-4 w-4" />
          Recortar
        </button>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <Cropper
          src={src}
          ref={cropperRef}
          style={{ height: '100%', width: '100%' }}
          viewMode={1}
          dragMode="move"
          autoCropArea={0.9}
          guides
          background={false}
          responsive
          checkOrientation={false}
        />
      </div>
    </div>
  );
}
