'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import MediaGaleria from '@/components/Admin/MediaGaleria';
import PartilhadoPasta from '@/components/Admin/PartilhadoPasta';

/** Endereço directo de uma pasta partilhada (o menu lateral aponta para aqui). As imagens são a galeria do painel. */
export default function PastaPage({ params }: { params: Promise<{ pasta: string }> }) {
  const { pasta } = use(params);
  if (pasta === 'imagens') return <MediaGaleria initialSource="partilhado" />;
  return (
    <div className="min-h-screen p-6 text-[#2c3338]">
      <Link href="/admin/partilhado" className="mb-3 inline-flex items-center gap-1 text-sm text-[#008f45] hover:underline">
        <ChevronLeft className="h-4 w-4" /> Arquivo de fotos
      </Link>
      <PartilhadoPasta pasta={pasta} withTitle />
    </div>
  );
}
