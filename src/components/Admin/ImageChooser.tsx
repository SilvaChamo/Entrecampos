'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { STORAGE_BUCKET } from '@/lib/supabase';
import { prepareImage } from '@/lib/client-image';

export type ChosenImage = {
  /** Endereço para mostrar já (foto da galeria, ou pré-visualização local enquanto a foto segue para a biblioteca). */
  url: string;
  /** Presente quando a foto veio do computador: resolve com o endereço final na biblioteca. */
  uploading?: Promise<string>;
};

/** Envia a foto (já reduzida) para a biblioteca geral; devolve o endereço público. */
export async function uploadToLibrary(original: File, newsTitle = ''): Promise<string> {
  const file = await prepareImage(original);
  const form = new FormData();
  form.append('file', file);
  form.append('bucket', STORAGE_BUCKET);
  if (newsTitle) form.append('title', newsTitle); // nome da foto quando ela não tem nome próprio
  const res = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.url) throw new Error(body.error || 'Não foi possível enviar a foto.');
  return body.url as string;
}

/**
 * Escolher uma foto: "Carregar ficheiros" anexa logo a foto do computador (pré-visualização imediata, envio em segundo
 * plano); "Biblioteca multimédia" leva à galeria principal no mesmo separador e, ao escolher a foto, volta a este ecrã
 * com tudo o que já estava escrito (o rascunho guarda-se antes de sair).
 */
export default function ImageChooser({ title = 'Imagem', newsTitle = '', target = 'featured', onBeforeLeave, onChoose, onClose }: { title?: string; newsTitle?: string; target?: 'featured' | 'editor'; onBeforeLeave?: () => void; onChoose: (img: ChosenImage) => void; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const openGallery = () => {
    const id = Math.random().toString(36).slice(2);
    try { onBeforeLeave?.(); sessionStorage.setItem('ec-pick', JSON.stringify({ id, target })); } catch { /* sem armazenamento: a galeria abre na mesma */ }
    // Navegação interna (sem recarregar a página): vai direto à galeria, sem ecrãs pelo meio.
    router.push(`/admin/media?escolher=${id}&voltar=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  };

  const fromComputer = (file: File) => {
    onChoose({ url: URL.createObjectURL(file), uploading: uploadToLibrary(file, newsTitle) });
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
        <button type="button" onClick={() => fileRef.current?.click()} className={tabCls(true)}>Carregar ficheiros</button>
        <button type="button" onClick={openGallery} className={tabCls(false)}>Biblioteca multimédia</button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#f0f0f1]">
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
      </div>
    </div>
  );
}
