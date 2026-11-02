'use client';

import React from 'react';
import Spinner from '@/components/Common/Spinner';

/**
 * Estados de carregamento do painel. Já não há "esqueletos" cinzentos: todos mostram o mesmo spinner dinâmico do site
 * (components/Common/Spinner). Os nomes mantêm-se para as páginas não terem de mudar.
 */
function LoadingBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-10 ${className}`}>
      <Spinner size={40} />
    </div>
  );
}

/** Uma só linha de tabela com o spinner (use uma vez, não em ciclo). */
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      <td colSpan={columns} className="p-10 text-center">
        <Spinner size={40} className="mx-auto" />
      </td>
    </tr>
  );
}

export const SkeletonCard = () => <LoadingBlock className="rounded-lg border border-[#ccd0d4] bg-white" />;
export const SkeletonHeader = () => null;
export const SkeletonGrid = (_: { count?: number }) => <LoadingBlock />;
export const SkeletonStats = () => <LoadingBlock />;
export const SkeletonContent = () => <LoadingBlock />;
export const SkeletonMediaGrid = (_: { count?: number }) => <LoadingBlock className="py-20" />;
