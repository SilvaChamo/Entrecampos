'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, Folder, FileText, MoreVertical, Share2, Trash2 } from 'lucide-react';

export type FolderInfo = { slug: string; nome: string; cor?: string | null; count: number; cover?: string | null };

export const FOLDER_COLORS = ['#e5b447', '#a12a82', '#3b82f6', '#22b573', '#ef4444', '#8b5cf6'];

export type FolderActions = {
  onRename: (f: FolderInfo) => void;
  onShare: (f: FolderInfo) => void;
  onDownload: (f: FolderInfo) => void;
  onColor: (f: FolderInfo, cor: string) => void;
  onDelete?: (f: FolderInfo) => void;
};

/** Cartão de pasta: ícone com a cor de destaque, nome e menu de gestão (⋮). */
function FolderCard({ f, href, onOpen, actions }: { f: FolderInfo; href?: string; onOpen?: () => void; actions?: FolderActions }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const cor = f.cor || FOLDER_COLORS[0];
  const label = (
    <>
      <Folder className="h-5 w-5 shrink-0" style={{ color: cor }} fill={cor} fillOpacity={0.15} />
      <span className="truncate text-[12px] font-semibold text-[#2c3338]" title={`${f.nome} · ${f.count} ${f.count === 1 ? 'foto' : 'fotos'}`}>{f.nome}</span>
    </>
  );
  const labelCls = 'flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left';
  const item = 'flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] text-[#2c3338] hover:bg-[#f6f7f7] [&>svg]:text-[#50575e]';

  return (
    <div className="relative flex items-center rounded-lg border border-[#e2e4e7] bg-white shadow-sm transition hover:border-[#00a651]">
      {href ? <Link href={href} className={labelCls}>{label}</Link> : <button type="button" onClick={onOpen} className={labelCls}>{label}</button>}
      {actions && (
        <div ref={box} className="relative shrink-0 pr-2">
          <button
            type="button"
            aria-label={`Opções da pasta ${f.nome}`}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="rounded p-1.5 text-[#50575e] hover:bg-[#f0f0f1]"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {open && (
            <div role="menu" className="absolute right-0 top-9 z-30 w-56 overflow-hidden rounded-lg border border-[#e2e4e7] bg-white py-1 shadow-lg">
              {href ? (
                <Link role="menuitem" href={href} className={item}><Eye className="h-4 w-4" /> Abrir</Link>
              ) : (
                onOpen && <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); onOpen(); }}><Eye className="h-4 w-4" /> Abrir</button>
              )}
              <div className="my-1 border-t border-[#e2e4e7]" />
              <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); actions.onDownload(f); }}><Download className="h-4 w-4" /> Transferir pasta</button>
              <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); actions.onRename(f); }}><FileText className="h-4 w-4" /> Mudar nome</button>
              <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); actions.onShare(f); }}><Share2 className="h-4 w-4" /> Partilhar ligação</button>
              <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[#8c8f94]">Destaque</p>
              <div className="flex gap-2 px-4 pb-3">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Cor ${c}`}
                    onClick={() => { setOpen(false); actions.onColor(f, c); }}
                    className={`h-4 w-4 rounded-full ${c === cor ? 'ring-2 ring-[#1d2327] ring-offset-1' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              {actions.onDelete && (
                <>
                  <div className="border-t border-[#e2e4e7]" />
                  <button role="menuitem" type="button" className="flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] text-[#d63638] hover:bg-[#f6f7f7]" onClick={() => { setOpen(false); actions.onDelete!(f); }}><Trash2 className="h-4 w-4" /> Eliminar pasta</button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Pastas do arquivo. Abre por ligação (`hrefBase`) ou por `onOpen`; com `actions` cada pasta tem o menu de gestão. */
export default function ArquivoFolders({ folders, hrefBase, onOpen, actions, fourCols }: { folders: FolderInfo[]; hrefBase?: string; onOpen?: (slug: string) => void; actions?: FolderActions; fourCols?: boolean }) {
  return (
    <div className={`grid gap-3 ${fourCols ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
      {folders.map((f) => (
        <FolderCard key={f.slug} f={f} href={hrefBase ? `${hrefBase}/${f.slug}` : undefined} onOpen={onOpen ? () => onOpen(f.slug) : undefined} actions={actions} />
      ))}
    </div>
  );
}
