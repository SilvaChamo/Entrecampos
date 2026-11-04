'use client';

import { useEffect, useRef, useState } from 'react';
import { FolderOpen, Upload, X } from 'lucide-react';
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
  const [tab, setTab] = useState<'upload' | 'library'>('upload');
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

  const tabCls = (on: boolean) => `px-6 py-3 text-[13px] font-medium transition-all ${on ? 'border-b-2 border-[#00a651] text-[#008f45]' : 'text-[#50575e] hover:text-[#008f45]'}`;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={title}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#ccd0d4] bg-white p-4">
        <h2 className="text-[18px] font-semibold text-[#1d2327]">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-gray-100" aria-label="Fechar"><X className="h-5 w-5 text-gray-500" /></button>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-[#ccd0d4] bg-white">
        <button type="button" onClick={() => setTab('upload')} className={tabCls(tab === 'upload')}>Carregar ficheiros</button>
        <button type="button" onClick={() => { setTab('library'); openGallery(); }} className={tabCls(tab === 'library')}>Biblioteca multimédia</button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#f0f0f1]">
        {tab === 'upload' ? (
          <div
            className="w-full max-w-md text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith('image/')) fromComputer(f); }}
          >
            <div className="mb-6 flex flex-col items-center rounded-lg border-2 border-dashed border-[#ccd0d4] bg-white/50 p-12">
              <Upload className="mb-4 h-12 w-12 text-[#ccd0d4]" />
              <p className="mb-4 text-[16px] text-[#3c434a]">Largue o ficheiro aqui para carregar</p>
              <p className="mb-4 text-[13px] text-[#50575e]">ou</p>
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex cursor-pointer items-center gap-2 rounded-[4px] bg-[#00a651] px-6 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#008f45]">
                Seleccionar ficheiro
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) fromComputer(f); }} />
            </div>
            <p className="text-[12px] text-[#50575e]">Tamanho máximo do ficheiro: 1 GB.</p>
          </div>
        ) : (
          <div className="max-w-md px-6 text-center">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-[#00a651]" />
            {blocked ? (
              <p className="text-sm text-[#d63638]">O navegador bloqueou o separador da galeria. Permita janelas para este site e tente de novo.</p>
            ) : (
              <p className="text-[15px] text-[#3c434a]">{waiting ? 'A galeria abriu noutro separador: clique na foto e ela volta para aqui.' : 'A abrir a galeria…'}</p>
            )}
            <button type="button" onClick={openGallery} className="mt-5 rounded-[4px] border border-[#00a651] bg-white px-5 py-2 text-[13px] font-bold text-[#008f45] hover:bg-[#f6f7f7]">Abrir a galeria de novo</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-[#ccd0d4] bg-[#f6f7f7] p-4">
        <div className="text-xs text-[#50575e]">{tab === 'upload' ? 'Os ficheiros carregados serão guardados permanentemente.' : 'Seleccione uma imagem da sua biblioteca.'}</div>
        <button type="button" onClick={onClose} className="rounded-[4px] bg-[#00a651] px-6 py-2 text-[13px] font-bold text-white transition-all hover:bg-[#008f45]">Fechar</button>
      </div>
    </div>
  );
}
