'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, FileText, FolderOpen, Image as ImageIcon, Mail, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Common/Spinner';
import ArquivoTabs from '@/components/Admin/ArquivoTabs';
import PartilhadoPasta from '@/components/Admin/PartilhadoPasta';

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
  const { user } = useAuth();
  const [selCount, setSelCount] = useState(0); // fotos seleccionadas na grelha (a lixeira elimina-as, com confirmação)
  const [bin, setBin] = useState(false); // reciclagem das fotos partilhadas (só administrador)
  const [aberta, setAberta] = useState<string | null>(null); // pasta aberta aqui mesmo, sem sair da página

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

  useEffect(() => {
    const onCount = (e: Event) => setSelCount(Number((e as CustomEvent).detail) || 0);
    // Clicar no menu "Arquivos partilhados" estando já aqui volta a mostrar os cartões.
    const onNav = (e: Event) => { if ((e as CustomEvent).detail === '/admin/partilhado') { setAberta(null); setBin(false); setSelCount(0); } };
    window.addEventListener('ec-bulk-count', onCount);
    window.addEventListener('ec-nav', onNav);
    return () => { window.removeEventListener('ec-bulk-count', onCount); window.removeEventListener('ec-nav', onNav); };
  }, []);

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
    <div className="ec-page min-h-screen text-[#2c3338]">
      <h1 className="mb-1 text-2xl font-normal">Arquivo de fotos</h1>
      <p className="mb-3 text-sm text-[#50575e]">Arquivos partilhados por email: <strong>{data?.address ?? 'redaccao@entrecamposblog.com'}</strong>.</p>

      <ArquivoTabs
        active="partilhadas"
        onPartilhadasClick={() => { setAberta(null); setBin(false); }}
        right={
          <div className="flex items-center gap-2">
            <button onClick={sync} disabled={syncing || !data?.configured} className="inline-flex h-8 items-center gap-1.5 rounded-[3px] bg-[#00a651] px-3 text-sm text-white disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'A sincronizar…' : 'Sincronizar agora'}
            </button>
            {aberta === 'imagens' && (user?.role === 'admin' || selCount > 0) && (
              <button
                type="button"
                title={selCount > 0 ? 'Eliminar as fotos seleccionadas' : 'Reciclagem'}
                aria-label={selCount > 0 ? 'Eliminar as fotos seleccionadas' : 'Reciclagem'}
                aria-pressed={bin}
                onClick={() => (selCount > 0 ? window.dispatchEvent(new Event('ec-bulk-delete')) : setBin(!bin))}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-[3px] border ${bin || selCount > 0 ? 'border-[#d63638] bg-[#d63638] text-white' : 'border-[#ccd0d4] bg-white text-[#50575e] hover:bg-[#f6f7f7]'}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        }
      />

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

      {aberta ? null : !data && !error ? (
        <div className="flex min-h-[calc(100vh-160px)] items-center justify-center"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FOLDERS.map(({ id, label, hint, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setBin(false); setAberta((cur) => (cur === id ? null : id)); }}
              aria-pressed={aberta === id}
              className={`rounded border bg-white p-[30px] text-left transition hover:border-[#00a651] ${aberta === id ? 'border-[#00a651] ring-1 ring-[#00a651]' : 'border-[#ccd0d4]'}`}
            >
              <Icon className="mb-1 h-6 w-6 text-[#00a651]" />
              <p className="text-base font-semibold"><span className="mr-2 text-2xl font-normal">{data?.counts?.[id] ?? 0}</span>{label}</p>
              <p className="text-xs text-[#50575e]">{hint}</p>
            </button>
          ))}
        </div>
      )}

      {aberta && <PartilhadoPasta key={aberta} pasta={aberta} bin={bin && aberta === 'imagens'} />}
    </div>
  );
}
