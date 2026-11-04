'use client';

import { use } from 'react';
import MediaGaleria from '@/components/Admin/MediaGaleria';

/** Uma pasta do arquivo: exactamente a mesma galeria (mesmo cabeçalho, barra, grelha e funções), já aberta nessa pasta. */
export default function PastaArquivoPage({ params }: { params: Promise<{ pasta: string }> }) {
  const { pasta } = use(params);
  return <MediaGaleria initialSource="arquivo" initialPasta={pasta} uploadHere />;
}
