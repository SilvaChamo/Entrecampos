'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleAlert, MailCheck, RefreshCw, Save } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

type Estado = 'publicada' | 'pendente' | 'repetida' | 'ignorado' | 'erro';
type Registo = { at: string; email: string; de: string; titulo: string; estado: Estado; motivo: string; newsId?: string; slug?: string; fotos?: string[]; redes?: string };
type Dados = { configurado: boolean; caixa: string; remetentes: string[]; autoPublicar: boolean; ultimaVerificacao: string | null; ultimoErro: string | null; historico: Registo[] };
type Resultado = { verificadas: number; criadas: number; publicadas: number; pendentes: number; ignoradas: number; erros: number; avisos: string[] };

const ETIQUETA: Record<Estado, { texto: string; cor: string }> = {
  publicada: { texto: 'Publicada', cor: 'bg-green-50 text-[#008f45]' },
  pendente: { texto: 'Pendente', cor: 'bg-amber-50 text-amber-800' },
  repetida: { texto: 'Repetida', cor: 'bg-gray-100 text-gray-600' },
  ignorado: { texto: 'Ignorado', cor: 'bg-gray-100 text-gray-600' },
  erro: { texto: 'Erro', cor: 'bg-red-50 text-red-800' },
};

const btn = 'flex h-9 items-center gap-1.5 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60';
const quando = (iso: string) => new Date(iso).toLocaleString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export default function ImportarNoticiasPage() {
  const [d, setD] = useState<Dados | null>(null);
  const [remetentes, setRemetentes] = useState('');
  const [auto, setAuto] = useState(true);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/importar-noticias', { credentials: 'include' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erro ao carregar.');
      setD(j);
      setRemetentes((cur) => (cur === '' ? (j.remetentes as string[]).join('\n') : cur));
      setAuto(j.autoPublicar);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const alterado = !!d && (auto !== d.autoPublicar || remetentes.split(/[\s,;]+/).filter(Boolean).map((e) => e.toLowerCase()).join() !== d.remetentes.join());

  async function guardar() {
    setGuardando(true); setErro(null); setAviso(null);
    try {
      const res = await fetch('/api/admin/importar-noticias', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ remetentes, autoPublicar: auto }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Não foi possível guardar.');
      setRemetentes((j.remetentes as string[]).join('\n'));
      setAviso('Guardado');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível guardar.');
    } finally {
      setGuardando(false);
    }
  }

  async function verificar() {
    setVerificando(true); setErro(null); setAviso(null); setResultado(null);
    try {
      const res = await fetch('/api/admin/importar-noticias', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'verificar' }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Não foi possível verificar o e-mail.');
      setResultado(j.resultado);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível verificar o e-mail.');
    } finally {
      setVerificando(false);
    }
  }

  async function escolherFoto(newsId: string, url: string) {
    setErro(null); setAviso(null);
    try {
      const res = await fetch('/api/admin/importar-noticias', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'foto', newsId, url }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Não foi possível trocar a foto.');
      setAviso('Foto trocada');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível trocar a foto.');
    }
  }

  if (loading) return <div className="flex min-h-[calc(100vh-200px)] items-center justify-center"><Spinner size={40} /></div>;

  return (
    <div className="ec-page text-[#2c3338]">
      <h1 className="mb-1 flex items-center gap-2 text-[20px] font-normal text-[#1d2327]">
        <MailCheck className="h-5 w-5 text-gray-500" /> Importar notícias do e-mail
      </h1>
      <p className="mb-4 text-[13px] text-gray-600">Notícias enviadas em documentos Word para o e-mail da redacção{d?.caixa ? ` (${d.caixa})` : ''}</p>

      {erro && <p className="mb-4 border-l-4 border-[#d63638] bg-red-50 px-3 py-2 text-[13px] text-red-800">{erro}</p>}
      {aviso && <p className="mb-4 border-l-4 border-[#00a651] bg-green-50 px-3 py-2 text-[13px] text-green-800">{aviso}</p>}
      {d && !d.configurado && (
        <p className="mb-4 border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">O e-mail da redacção ainda não está ligado: faltam IMAP_HOST, IMAP_USER e IMAP_PASS nas variáveis do servidor.</p>
      )}
      {d?.ultimoErro && <p className="mb-4 border-l-4 border-[#d63638] bg-red-50 px-3 py-2 text-[13px] text-red-800">Última verificação falhou: {d.ultimoErro}</p>}

      <section className="mb-4 border border-[#ccd0d4] bg-white p-4">
        <h2 className="mb-1 text-[14px] text-[#1d2327]">Como funciona</h2>
        <ul className="list-disc space-y-1 pl-5 text-[13px] text-gray-600">
          <li>Cada notícia do Word começa em Título: e pode ter Categoria:, Descrição:, Texto: e Foto: (nome da imagem enviada no mesmo e-mail, ou uma imagem metida no próprio Word)</li>
          <li>Com foto e categoria reconhecida, a notícia é publicada, vai para as redes sociais ligadas e entra no próximo envio da newsletter</li>
          <li>Sem foto, fica nos pendentes com uma foto sugerida (de notícias parecidas) para rever e publicar à mão; ao publicar, as redes e a newsletter recebem-na na mesma</li>
          <li>Só são lidos e-mails dos remetentes autorizados; o e-mail nunca é apagado nem alterado</li>
        </ul>
      </section>

      <section className="mb-4 border border-[#ccd0d4] bg-white p-4">
        <h2 className="mb-2 text-[14px] text-[#1d2327]">Remetentes autorizados</h2>
        <textarea
          value={remetentes}
          onChange={(e) => setRemetentes(e.target.value)}
          rows={3}
          placeholder="um e-mail por linha"
          aria-label="Remetentes autorizados"
          className="w-full border border-[#ccd0d4] bg-white px-3 py-2 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none"
        />
        <div className="mt-3 flex items-center gap-3">
          <div
            role="switch"
            aria-checked={auto}
            aria-label="Publicar sozinhas as notícias que trazem foto"
            tabIndex={0}
            onClick={() => setAuto((v) => !v)}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAuto((v) => !v); } }}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${auto ? 'bg-[#00a651]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${auto ? 'left-[22px]' : 'left-0.5'}`} />
          </div>
          <span className="text-[13px] text-[#1d2327]">Publicar sozinhas as notícias que trazem foto</span>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" disabled={guardando || !alterado} onClick={guardar} className={`${btn} bg-[#00a651] text-white hover:bg-[#008f46]`}>
            {guardando ? <Spinner size={16} /> : <Save className="h-4 w-4" />} Guardar
          </button>
        </div>
      </section>

      <section className="mb-4 border border-[#ccd0d4] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={verificando || !d?.configurado} onClick={verificar} className={`${btn} border border-[#00a651] bg-white text-[#00a651] hover:bg-[#f0f7f4]`}>
            {verificando ? <Spinner size={16} /> : <RefreshCw className="h-4 w-4" />} Verificar o e-mail agora
          </button>
          <span className="text-[12px] text-gray-500">{d?.ultimaVerificacao ? `Última verificação: ${quando(d.ultimaVerificacao)}` : 'Ainda não verificado'}</span>
        </div>
        {resultado && (
          <div className="mt-3 text-[13px] text-gray-700">
            <p>{resultado.verificadas} e-mail(s) com Word: {resultado.criadas} notícia(s) criada(s) ({resultado.publicadas} publicada(s), {resultado.pendentes} pendente(s)), {resultado.ignoradas} ignorada(s), {resultado.erros} erro(s)</p>
            {resultado.avisos.map((a) => <p key={a} className="text-amber-800">{a}</p>)}
          </div>
        )}
      </section>

      <section className="border border-[#ccd0d4] bg-white">
        <h2 className="border-b border-[#e5e5e5] px-4 py-3 text-[14px] text-[#1d2327]">Importadas</h2>
        {d && d.historico.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-gray-500">Ainda não foi importada nenhuma notícia.</p>
        ) : (
          <ul className="divide-y divide-[#e5e5e5]">
            {d?.historico.map((h, i) => (
              <li key={`${h.at}-${i}`} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 text-[11px] ${ETIQUETA[h.estado].cor}`}>{ETIQUETA[h.estado].texto}</span>
                  {h.newsId ? (
                    <Link href={`/admin/noticias/editar/${h.newsId}`} className="min-w-0 flex-1 truncate text-[13px] text-[#1d2327] hover:underline">{h.titulo}</Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#1d2327]">{h.titulo || h.email}</span>
                  )}
                  <span className="text-[12px] text-gray-500">{quando(h.at)}</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] text-gray-500">
                  {h.estado === 'publicada' ? <CheckCircle2 className="h-3.5 w-3.5 text-[#00a651]" /> : h.estado === 'erro' ? <CircleAlert className="h-3.5 w-3.5 text-[#d63638]" /> : null}
                  {h.motivo}{h.redes ? ` Redes: ${h.redes}` : ''} · {h.de}
                </p>
                {h.fotos && h.fotos.length > 0 && h.estado === 'pendente' && (
                  <div className="mt-2">
                    <p className="mb-1 text-[12px] text-gray-500">Foto sugerida: a primeira está na notícia; clique noutra para a trocar</p>
                    <div className="flex flex-wrap gap-2">
                      {h.fotos.map((u, n) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={u} src={u} alt="" onClick={() => n > 0 && h.newsId && escolherFoto(h.newsId, u)} className={`h-16 w-24 object-cover ${n === 0 ? 'outline outline-2 outline-[#00a651]' : 'cursor-pointer opacity-80 hover:opacity-100'}`} />
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
