import type { Metadata } from 'next';
import { folderPhotos } from '@/lib/arquivo';
import { verifyPartilha } from '@/lib/partilha-link';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Fotos partilhadas', robots: { index: false, follow: false } };

const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n ? `${Math.max(1, Math.round(n / 1024))} KB` : '');

/** Página pública (sem login) com as fotos de uma pasta partilhada: só as fotos e a descarga, nada mais. */
export default async function PartilhaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const check = verifyPartilha(token);

  if (!check.ok) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f0f0f1] p-6 text-center text-[#2c3338]">
        <div className="max-w-sm rounded-lg bg-white p-8 shadow">
          <h1 className="text-lg font-semibold">{check.motivo === 'expirada' ? 'Esta ligação expirou' : 'Ligação inválida'}</h1>
          <p className="mt-2 text-sm text-[#50575e]">
            {check.motivo === 'expirada' ? 'As ligações de partilha duram 12 horas. Peça à redacção do EntreCAMPOS uma ligação nova.' : 'Confirme se copiou a ligação completa.'}
          </p>
        </div>
      </main>
    );
  }

  const pasta = await folderPhotos(check.pasta);
  if (!pasta) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f0f0f1] p-6 text-center text-[#2c3338]">
        <div className="max-w-sm rounded-lg bg-white p-8 shadow"><h1 className="text-lg font-semibold">Pasta não encontrada</h1></div>
      </main>
    );
  }

  const ate = new Date(check.expiraEm).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Maputo' });

  return (
    <main className="min-h-screen bg-[#f0f0f1] p-4 text-[#2c3338] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#008f45]">EntreCAMPOS · Fotos partilhadas</p>
            <h1 className="mt-1 text-2xl font-normal">{pasta.nome}</h1>
            <p className="mt-1 text-sm text-[#50575e]">{pasta.fotos.length} {pasta.fotos.length === 1 ? 'foto' : 'fotos'}</p>
          </div>
          {pasta.fotos.length > 0 && (
            <a href={`/api/partilha/${token}/zip`} className="inline-flex h-9 items-center rounded-[3px] bg-[#00a651] px-4 text-sm font-semibold text-white hover:bg-[#008f45]">
              Descarregar a pasta (zip)
            </a>
          )}
        </header>

        <p role="note" className="mt-4 rounded border border-[#dba617] bg-white p-3 text-sm">
          Descarregue as fotos o quanto antes: esta ligação só funciona durante <strong>12 horas</strong> (até {ate}).
        </p>

        {pasta.fotos.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#50575e]">Esta pasta ainda não tem fotos.</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pasta.fotos.map((f) => (
              <li key={f.leaf} className="overflow-hidden rounded border border-[#ccd0d4] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.nome} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="min-w-0 truncate text-[12px]" title={f.nome}>{f.nome}{kb(f.size) ? ` · ${kb(f.size)}` : ''}</span>
                  <a href={`/api/partilha/${token}/foto?f=${encodeURIComponent(f.leaf)}`} className="shrink-0 rounded-[3px] border border-[#00a651] px-2 py-1 text-[12px] font-semibold text-[#008f45] hover:bg-[#f6f7f7]">Descarregar</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
