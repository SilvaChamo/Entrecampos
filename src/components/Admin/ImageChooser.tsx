'use client';

import { useEffect, useRef, useState } from 'react';
import { FolderOpen, Monitor, X } from 'lucide-react';
import { STORAGE_BUCKET } from '@/lib/supabase';
import { prepareImage } from '@/lib/client-image';

export type ChosenImage = {
  /** Endereço para mostrar já (foto da galeria, ou pré-visualização local enquanto a foto segue para a biblioteca). */
  url: string;
  /** Presente quando a foto veio do computador: resolve com o endereço final na biblioteca. */
  uploading?: Promise<string>;
};

/** Envia a foto (já reduzida) para a biblioteca geral; devolve o endereço público. */
export async function uploadToLibrary(original: File): Promise<string> {
  const file = await prepareImage(original);
  const form = new FormData();
  form.append('file', file);
  form.append('bucket', STORAGE_BUCKET);
  const res = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.url) throw new Error(body.error || 'Não foi possível enviar a foto.');
  return body.url as string;
}

/**
 * Escolher uma foto: “Galeria” abre a galeria principal noutro separador e a foto clicada volta para aqui;
 * “Computador” anexa logo a foto (pré-visualização imediata) e envia-a para a biblioteca em segundo plano.
 */
export default function ImageChooser({ title = 'Imagem', onChoose, onClose }: { title?: string; onChoose: (img: ChosenImage) => void; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [waiting, setWaiting] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const pickId = useRef('');
  const latest = useRef({ onChoose, onClose });
  useEffect(() => { latest.current = { onChoose, onClose }; });

  useEffect(() => {
    if (!waiting) return;
    const channel = new BroadcastChannel('ec-media-pick');
    channel.onmessage = (e: MessageEvent<{ id?: string; url?: string }>) => {
      if (e.data?.id === pickId.current && e.data.url) {
        latest.current.onChoose({ url: e.data.url });
        latest.current.onClose();
      }
    };
    return () => channel.close();
  }, [waiting]);

  const openGallery = () => {
    pickId.current = Math.random().toString(36).slice(2);
    const win = window.open(`/admin/media?escolher=${pickId.current}`, '_blank');
    if (!win) { setBlocked(true); return; }
    setBlocked(false);
    setWaiting(true);
  };

  const fromComputer = (file: File) => {
    onChoose({ url: URL.createObjectURL(file), uploading: uploadToLibrary(file) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ccd0d4] px-5 py-3">
          <h2 className="text-[16px] font-semibold text-[#1d2327]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100" aria-label="Fechar"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5">
          <button type="button" onClick={openGallery} className="flex flex-col items-center gap-2 rounded-lg border border-[#ccd0d4] px-3 py-6 text-sm font-semibold hover:border-[#00a651] hover:bg-[#f6f7f7]">
            <FolderOpen className="h-8 w-8 text-[#00a651]" /> Galeria
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 rounded-lg border border-[#ccd0d4] px-3 py-6 text-sm font-semibold hover:border-[#00a651] hover:bg-[#f6f7f7]">
            <Monitor className="h-8 w-8 text-[#00a651]" /> Computador
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) fromComputer(f); }} />
        </div>
        {waiting && <p className="border-t border-[#ccd0d4] px-5 py-3 text-sm text-[#50575e]">A galeria abriu noutro separador: clique na foto e ela volta para aqui.</p>}
        {blocked && <p className="border-t border-[#ccd0d4] px-5 py-3 text-sm text-[#d63638]">O navegador bloqueou o separador da galeria. Permita janelas para este site e tente de novo.</p>}
      </div>
    </div>
  );
}
