import Link from 'next/link';
import { Folder } from 'lucide-react';

export type FolderInfo = { slug: string; nome: string; count: number; cover: string | null };

/** Pastas do arquivo em cartões, ao jeito de um Drive: capa, nome e número de fotos. Abre por ligação (`hrefBase`) ou por `onOpen`. */
export default function ArquivoFolders({ folders, hrefBase, onOpen }: { folders: FolderInfo[]; hrefBase?: string; onOpen?: (slug: string) => void }) {
  const cls = 'group overflow-hidden rounded border border-[#ccd0d4] bg-white text-left transition hover:border-[#00a651]';
  const body = (f: FolderInfo) => (
    <>
      <div className="flex aspect-[4/3] items-center justify-center bg-[#f0f0f1]">
        {f.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Folder className="h-12 w-12 text-[#ccd0d4]" />
        )}
      </div>
      <div className="p-3">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold" title={f.nome}><Folder className="h-4 w-4 shrink-0 text-[#00a651]" />{f.nome}</p>
        <p className="text-xs text-[#50575e]">{f.count} {f.count === 1 ? 'foto' : 'fotos'}</p>
      </div>
    </>
  );
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {folders.map((f) =>
        hrefBase ? (
          <Link key={f.slug} href={`${hrefBase}/${f.slug}`} className={cls}>{body(f)}</Link>
        ) : (
          <button key={f.slug} type="button" onClick={() => onOpen?.(f.slug)} className={cls}>{body(f)}</button>
        ),
      )}
    </div>
  );
}
