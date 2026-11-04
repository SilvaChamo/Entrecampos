'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Archive, FileText, FolderOpen, Image as ImageIcon, Mail, RefreshCw } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

const FOLDERS = [
  { id: 'imagens', label: 'Imagens', hint: 'Fotografias e gráficos', Icon: ImageIcon },
  { id: 'pdf', label: 'PDF', hint: 'Documentos em PDF', Icon: FileText },
  { id: 'zip', label: 'Arquivos ZIP', hint: 'Zip, RAR, 7z', Icon: Archive },
  { id: 'documentos', label: 'Documentos', hint: 'Word, Excel, PowerPoint, texto', Icon: FolderOpen },
] as const;

type Overview = { configured: boolean; antivirus: boolean; address: string; counts: Record<string, number> };

export default function PartilhadoPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/partilhado', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao ler as pastas.');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao ler as pastas.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true);
    setNotice('');
    try {
      const res = await fetch('/api/admin/partilhado', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao sincronizar.');
      setNotice(
        `${json.imported} ficheiro(s) novo(s) colocado(s) nas pastas` +
          (json.infected ? `; ${json.infected} bloqueado(s) pelo antivírus` : '') +
          (json.held ? `; ${json.held} retido(s) por não haver antivírus ligado` : '') +
          (json.failed ? `; ${json.failed} falharam` : '') +
          (json.remaining ? `. Ainda há ${json.remaining} por trazer: volte a sincronizar.` : '.'),
      );
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Erro ao sincronizar.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen p-6 text-[#2c3338]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-normal">Partilhado</h1>
          <p className="mt-1 text-sm text-[#50575e]">
            Anexos recebidos em <strong>{data?.address ?? 'redaccao@entrecamposblog.com'}</strong>, arrumados automaticamente por tipo. O e-mail só é lido, nunca alterado.
          </p>
        </div>
        <button onClick={sync} disabled={syncing || !data?.configured} className="inline-flex h-8 items-center gap-1.5 rounded-[3px] bg-[#00a651] px-3 text-sm font-semibold text-white disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'A sincronizar…' : 'Sincronizar agora'}
        </button>
      </div>

      {notice && <div className="mb-4 rounded border border-[#00a651] bg-white p-3 text-sm">{notice}</div>}
      {error && <div className="mb-4 rounded border border-[#d63638] bg-white p-3 text-sm text-[#d63638]">{error}</div>}
      {data && !data.configured && (
        <div className="mb-4 rounded border border-[#dba617] bg-white p-4 text-sm leading-6">
          <Mail className="mb-1 h-5 w-5 text-[#50575e]" />
          Ligação ao e-mail por configurar. Defina no servidor <code>IMAP_HOST</code>, <code>IMAP_PORT</code> (993), <code>IMAP_USER</code> e <code>IMAP_PASS</code>.
        </div>
      )}

      {data?.configured && !data.antivirus && (
        <div className="mb-4 rounded border border-[#dba617] bg-white p-4 text-sm leading-6">
          Antivírus por ligar: por segurança, só as <strong>imagens</strong> (que são recodificadas) são importadas. PDF, ZIP e documentos ficam retidos até definir <code>CLAMD_HOST</code> e <code>CLAMD_PORT</code> (ClamAV).
        </div>
      )}
      {data?.antivirus && <p className="mb-4 text-xs text-[#008f45]">Antivírus ligado: cada ficheiro é analisado antes de ser guardado.</p>}

      {!data && !error ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FOLDERS.map(({ id, label, hint, Icon }) => (
            <Link key={id} href={`/admin/partilhado/${id}`} className="rounded border border-[#ccd0d4] bg-white p-5 transition hover:border-[#00a651]">
              <Icon className="mb-3 h-8 w-8 text-[#00a651]" />
              <p className="text-base font-semibold">{label}</p>
              <p className="text-xs text-[#50575e]">{hint}</p>
              <p className="mt-3 text-2xl">{data?.counts?.[id] ?? 0}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
