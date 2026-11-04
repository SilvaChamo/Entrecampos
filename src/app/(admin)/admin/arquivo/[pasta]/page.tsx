'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import MediaGalleryView from '@/components/Admin/MediaGalleryView';

/** Uma pasta do arquivo: as fotos com todas as funções da galeria (selecionar, editar, arquivar, enviar para a galeria…). */
export default function PastaArquivoPage({ params }: { params: Promise<{ pasta: string }> }) {
  const { pasta } = use(params);
  const [nome, setNome] = useState('');

  useEffect(() => {
    fetch('/api/admin/arquivo', { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => setNome((b.folders ?? []).find((f: { slug: string; nome: string }) => f.slug === pasta)?.nome ?? ''))
      .catch(() => {});
  }, [pasta]);

  return (
    <div className="p-6 pb-0">
      <Link href="/admin/arquivo" className="mb-3 inline-flex items-center gap-1 text-sm text-[#008f45] hover:underline">
        <ChevronLeft className="h-4 w-4" /> Arquivo de fotos
      </Link>
      <MediaGalleryView source="arquivo" pasta={pasta} title={nome || 'Pasta'} embedded />
    </div>
  );
}
