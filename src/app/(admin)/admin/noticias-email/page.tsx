'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Mail, RefreshCw, Save } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

type Item = { title: string; status: 'published' | 'scheduled' | 'pending' | 'erro'; note: string; id?: string; photos?: string[] };
type Entry = { at: string; from: string; subject: string; items: Item[]; note?: string };
type Data = { configured: boolean; address: string; authserv: boolean; settings: { senders: string[]; requireVerified: boolean; share: boolean }; entries: Entry[] };

const ESTADO: Record<Item['status'], { texto: string; cls: string }> = {
  published: { texto: 'Publicada', cls: 'bg-green-50 text-[#008f45]' },
  scheduled: { texto: 'Agendada', cls: 'bg-blue-50 text-blue-800' },
  pending: { texto: 'Pendente', cls: 'bg-amber-50 text-amber-800' },
  erro: { texto: 'Erro', cls: 'bg-red-50 text-red-700' },
};

const btn = 'flex h-9 items-center gap-1.5 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60';

function Interruptor({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      aria-label={label}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onClick(); } }}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${on ? 'bg-[#00a651]' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </div>
  );
}

export default function NoticiasEmailPage() {
  const [data, setData] = useState<Data | null>(null);
  const [senders, setSenders] = useState('');
  const [verified, setVerified] = useState(true);
  const [share, setShare] = useState(true);
  const [busy, setBusy] = useState<'guardar' | 'verificar' | ''>('');
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [aba, setAba] = useState<'info' | 'noticias'>('info');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/noticias-email', { credentials: 'include' });
    if (!res.ok) return;
    const d = (await res.json()) as Data;
    setData(d);
    setSenders(d.settings.senders.join('\n'));
    setVerified(d.settings.requireVerified);
    setShare(d.settings.share);
  }, []);
  useEffect(() => { load(); }, [load]);

  const guardar = async () => {
    setBusy('guardar'); setMsg(null);
    const res = await fetch('/api/admin/noticias-email', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senders: senders.split(/[\s,;]+/).filter(Boolean), requireVerified: verified, share }),
    });
    const b = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) return setMsg({ tipo: 'erro', texto: b.error || 'Não foi possível guardar.' });
    setSenders((b.settings.senders as string[]).join('\n'));
    setMsg({ tipo: 'ok', texto: 'Guardado' });
  };

  const verificar = async () => {
    setBusy('verificar'); setMsg(null);
    const res = await fetch('/api/admin/noticias-email', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verificar' }) });
    const b = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) return setMsg({ tipo: 'erro', texto: b.error || 'Não foi possível verificar o e-mail.' });
    const r = b.result;
    setMsg({ tipo: 'ok', texto: r.mails === 0 ? 'Sem e-mails novos' : `${r.mails} e-mail(s) lido(s): ${r.created} notícia(s) criada(s), ${r.pending} nos pendentes, ${r.failed} com erro` });
    load();
    setAba('noticias'); // as notícias lidas caem no separador da lista
  };

  const escolherFoto = async (newsId: string, url: string) => {
    setMsg(null);
    const res = await fetch('/api/admin/noticias-email', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'foto', newsId, url }) });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg({ tipo: 'erro', texto: b.error || 'Não foi possível trocar a foto.' });
    setData((d) => d && { ...d, entries: d.entries.map((e) => ({ ...e, items: e.items.map((it) => (it.id === newsId && it.photos ? { ...it, photos: [url, ...it.photos.filter((p) => p !== url)] } : it)) })) });
    setMsg({ tipo: 'ok', texto: 'Foto trocada' });
  };

  const itens = data ? data.entries.flatMap((e) => e.items.map((it) => ({ ...it, from: e.from, at: e.at }))) : [];

  if (!data) return <div className="flex min-h-[calc(100vh-200px)] items-center justify-center"><Spinner size={40} /></div>;

  return (
    <div className="ec-page text-[#2c3338]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[20px] font-normal text-[#1d2327]">Notícias por e-mail</h1>
          <p className="mt-1 max-w-xl text-[13px] text-gray-600">Envie um Word com notícias para o e-mail da redacção{data.address ? ` (${data.address})` : ''}: o sistema lê o e-mail e cria cada notícia</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a href="/api/admin/noticias-email/modelo" className={`${btn} border border-[#00a651] bg-white text-[#00a651] hover:bg-[#f0f7f4]`}>
            <Download className="h-4 w-4" /> Modelo de Word
          </a>
          <button type="button" onClick={verificar} disabled={busy !== '' || !data.configured} className={`${btn} bg-[#00a651] text-white hover:bg-[#008f46]`}>
            <RefreshCw className={`h-4 w-4 ${busy === 'verificar' ? 'animate-spin' : ''}`} /> Verificar agora
          </button>
        </div>
      </div>

      {!data.configured && (
        <p className="mb-4 border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">O e-mail da redacção ainda não está ligado ao servidor (faltam IMAP_HOST, IMAP_USER e IMAP_PASS). Enquanto isso, nada é lido.</p>
      )}
      {data.configured && data.settings.requireVerified && !data.authserv && (
        <p className="mb-4 border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">Falta IMAP_AUTHSERV_ID (o nome do servidor de e-mail, que aparece no início do cabeçalho Authentication-Results). Sem ele nenhum remetente é confirmado e todas as notícias ficam nos pendentes.</p>
      )}
      {msg && <p className={`mb-4 border-l-4 px-3 py-2 text-[13px] ${msg.tipo === 'ok' ? 'border-[#00a651] bg-green-50 text-green-800' : 'border-[#d63638] bg-red-50 text-red-800'}`}>{msg.texto}</p>}

      <div className="mb-4 flex border-b border-[#ccd0d4]">
        {([['info', 'Explicação e definições'], ['noticias', `Notícias recebidas${itens.length ? ` (${itens.length})` : ''}`]] as const).map(([id, nome]) => (
          <button key={id} type="button" onClick={() => setAba(id)} className={`-mb-px px-5 py-2.5 text-[13px] ${aba === id ? 'border-b-2 border-[#00a651] text-[#008f46]' : 'text-gray-600 hover:text-[#008f46]'}`}>{nome}</button>
        ))}
      </div>

      {aba === 'info' && (<>
        <div className="divide-y divide-[#ccd0d4] border border-[#ccd0d4] bg-white">
          <div className="p-4">
            <p className="flex items-center gap-2 text-[14px] text-[#1d2327]"><Mail className="h-4 w-4 text-[#00a651]" /> Remetentes autorizados</p>
            <p className="mt-0.5 text-[13px] leading-5 text-gray-600">
              Só os e-mails destes endereços são lidos. Um por linha: um endereço completo ou todo um domínio, como @entrecamposblog.com.
            </p>
            <textarea value={senders} onChange={(e) => setSenders(e.target.value)} rows={4} placeholder="jornalista@exemplo.com" aria-label="Remetentes autorizados" className="mt-3 w-full border border-[#ccd0d4] bg-white px-3 py-2 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none" />
          </div>
          <div className="flex items-start gap-3 p-4">
            <Interruptor on={verified} onClick={() => setVerified(!verified)} label="Exigir confirmação do remetente" />
            <div>
              <p className="text-[14px] text-[#1d2327]">Exigir confirmação do remetente</p>
              <p className="mt-0.5 text-[13px] leading-5 text-gray-600">Só publica sozinho se o servidor de e-mail confirmar quem enviou (SPF/DKIM). Sem confirmação, a notícia fica nos pendentes. Recomendado, para um e-mail forjado não ir para o ar.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4">
            <Interruptor on={share} onClick={() => setShare(!share)} label="Partilhar nas redes sociais" />
            <div>
              <p className="text-[14px] text-[#1d2327]">Partilhar nas redes sociais</p>
              <p className="mt-0.5 text-[13px] leading-5 text-gray-600">Ao publicar (já ou na hora agendada), a notícia segue para as redes ligadas em Redes sociais. A newsletter recebe-a sempre no próximo envio.</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[13px] leading-6 text-gray-600">
              <span className="text-[#1d2327]">Como funciona:</span> com foto, a notícia é publicada logo, ou agendada se tiver data futura. Sem foto (ou com qualquer dúvida no documento), fica em Notícias Pendentes com uma foto sugerida, de notícias parecidas: reveja, ponha a foto certa e publique. O campo «Foto:» aceita a imagem colada no Word ou o nome de um ficheiro anexado ao e-mail. A leitura é feita uma vez por dia; «Verificar agora» lê já.
            </p>
          </div>
        </div>

        <button type="button" onClick={guardar} disabled={busy !== ''} className={`${btn} mt-4 bg-[#00a651] px-5 text-white hover:bg-[#008f46]`}>
          <Save className="h-4 w-4" /> Guardar
        </button>
      </>)}

      {aba === 'noticias' && (
        itens.length === 0 ? (
          <p className="border border-[#ccd0d4] bg-white p-4 text-[13px] text-gray-600">Ainda não chegou nenhuma notícia por e-mail. Quando o sistema ler um Word, as notícias aparecem aqui, com o estado de cada uma.</p>
        ) : (
          <div className="divide-y divide-[#ccd0d4] border border-[#ccd0d4] bg-white">
            {data.entries.filter((e) => e.note).map((e, i) => (
              <p key={`n${i}`} className="p-4 text-[12px] text-red-700">{e.subject}: {e.note}</p>
            ))}
            {itens.map((it, j) => (
              <div key={j} className="flex flex-wrap items-start gap-3 p-4 text-[13px]">
                <span className={`shrink-0 px-2 py-0.5 text-[11px] ${ESTADO[it.status].cls}`}>{ESTADO[it.status].texto}</span>
                <div className="min-w-0 flex-1">
                  {it.id ? <Link href={`/admin/noticias/editar/${it.id}`} className="text-[#008f46] hover:underline">{it.title}</Link> : <span>{it.title}</span>}
                  <p className="mt-0.5 text-gray-600">{it.note}</p>
                  <p className="mt-0.5 text-[12px] text-gray-500">{it.from} · {new Date(it.at).toLocaleString('pt-PT')}</p>
                  {it.photos && it.photos.length > 0 && it.status === 'pending' && it.id && (
                    <div className="mt-2">
                      <p className="mb-1 text-[12px] text-gray-500">Foto sugerida: a primeira está na notícia; clique noutra para a trocar</p>
                      <div className="flex flex-wrap gap-2">
                        {it.photos.map((u, n) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={u} src={u} alt="" onClick={() => n > 0 && escolherFoto(it.id!, u)} className={`h-16 w-24 object-cover ${n === 0 ? 'outline outline-2 outline-[#00a651]' : 'cursor-pointer opacity-80 hover:opacity-100'}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
