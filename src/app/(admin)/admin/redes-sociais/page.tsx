'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, CircleSlash, ExternalLink, RefreshCw, Save } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import ConfigNote from '@/components/Admin/ConfigNote';

type Share = 'facebook' | 'reels' | 'instagram' | 'linkedin';
type KeyName = 'metaPageId' | 'metaPageToken' | 'metaIgId' | 'linkedinOrgId' | 'linkedinToken';
type KeyState = 'painel' | 'servidor' | 'em-falta';
type Conn = { network: 'facebook' | 'instagram' | 'linkedin'; state: 'ligado' | 'erro' | 'sem-chaves'; detail: string };
type Data = {
  settings: Record<Share, boolean>;
  profiles: Record<string, string>;
  configured: Record<Share, boolean>;
  keys: Record<KeyName, KeyState>;
  connection: Conn[] | null;
};

type Campo = { id: string; label: string; ajuda?: string; tipo: 'perfil' | 'chave'; segredo?: boolean };
type Cartao = {
  id: string;
  nome: string;
  texto: string;
  /** Rede que publica notícias (o interruptor guarda logo); sem isto o cartão só regista o endereço do perfil. */
  partilha?: Share;
  liga?: 'facebook' | 'instagram' | 'linkedin';
  nota?: string;
  campos: Campo[];
  exemplo: string;
};

const CARTOES: Cartao[] = [
  {
    id: 'facebook', nome: 'Facebook (Página)', partilha: 'facebook', liga: 'facebook', exemplo: 'https://www.facebook.com/j.entrecampos.co.mz',
    texto: 'Publica na Página do EntreCAMPOS a foto da notícia com o título, o resumo e o link.',
    campos: [
      { id: 'facebook', label: 'Link da Página', tipo: 'perfil' },
      { id: 'metaPageId', label: 'ID da Página', ajuda: 'Na Página: Sobre › Transparência da Página › ID da Página.', tipo: 'chave' },
      { id: 'metaPageToken', label: 'Token de acesso da Página', ajuda: 'Token de longa duração com as permissões pages_manage_posts, pages_read_engagement, pages_show_list e instagram_content_publish.', tipo: 'chave', segredo: true },
    ],
  },
  {
    id: 'reels', nome: 'Facebook Reels', partilha: 'reels', exemplo: '',
    texto: 'Publica também nos Reels quando a notícia tem um vídeo MP4 no texto; com a partilha automática activa na Página, o Facebook envia o Reel ao Instagram ao mesmo tempo. Sem vídeo, só segue a publicação com foto.',
    nota: 'Usa a mesma ligação da Página do Facebook: não precisa de mais dados.',
    campos: [],
  },
  {
    id: 'instagram', nome: 'Instagram', partilha: 'instagram', liga: 'instagram', exemplo: 'https://www.instagram.com/entrecampos.co.mz/',
    texto: 'Publica a foto da notícia com título e resumo na legenda. O Instagram não aceita links: o endereço fica no perfil.',
    nota: 'Usa a ligação do Facebook: a conta Instagram Business ligada à Página é encontrada sozinha. O ID só é preciso se a Página tiver mais do que uma conta.',
    campos: [
      { id: 'instagram', label: 'Link do perfil', tipo: 'perfil' },
      { id: 'metaIgId', label: 'ID da conta Instagram (opcional)', tipo: 'chave' },
    ],
  },
  {
    id: 'linkedin', nome: 'LinkedIn (Página)', partilha: 'linkedin', liga: 'linkedin', exemplo: 'https://www.linkedin.com/company/65832996/',
    texto: 'Publica na Página do EntreCAMPOS no LinkedIn o título, o resumo, a foto e o link da notícia.',
    campos: [
      { id: 'linkedin', label: 'Link da Página', tipo: 'perfil' },
      { id: 'linkedinOrgId', label: 'ID da Página (número)', ajuda: 'O número que aparece no endereço de administração da Página.', tipo: 'chave' },
      { id: 'linkedinToken', label: 'Token de acesso', ajuda: 'De um administrador da Página, com a permissão w_organization_social (Community Management API).', tipo: 'chave', segredo: true },
    ],
  },
  { id: 'youtube', nome: 'YouTube', texto: 'Rede usada pelo EntreCAMPOS (só regista o endereço).', exemplo: 'https://www.youtube.com/@entrecampos', campos: [{ id: 'youtube', label: 'Link do canal', tipo: 'perfil' }] },
  { id: 'x', nome: 'X (Twitter)', texto: 'Rede usada pelo EntreCAMPOS (só regista o endereço).', exemplo: 'https://x.com/entrecampos', campos: [{ id: 'x', label: 'Link do perfil', tipo: 'perfil' }] },
  { id: 'tiktok', nome: 'TikTok', texto: 'Rede usada pelo EntreCAMPOS (só regista o endereço).', exemplo: 'https://www.tiktok.com/@entrecampos', campos: [{ id: 'tiktok', label: 'Link do perfil', tipo: 'perfil' }] },
  { id: 'whatsapp', nome: 'WhatsApp (canal)', texto: 'Rede usada pelo EntreCAMPOS (só regista o endereço).', exemplo: 'https://whatsapp.com/channel/…', campos: [{ id: 'whatsapp', label: 'Link do canal', tipo: 'perfil' }] },
];

const EXTRAS = ['youtube', 'x', 'tiktok', 'whatsapp'];
const inputCls = 'h-9 w-full rounded-md border border-[#ccd0d4] bg-white px-3 text-[13px] focus:border-[#00a651] focus:outline-none';

/** Redes sociais do EntreCAMPOS: em cada cartão, o interruptor liga a rede e mostra o link e os dados de ligação. Os segredos ficam cifrados no servidor. */
export default function RedesSociaisPage() {
  const [data, setData] = useState<Data | null>(null);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  // O que se escreve nos campos (as chaves nunca voltam do servidor: em branco = manter).
  const [perfis, setPerfis] = useState<Record<string, string>>({});
  const [chaves, setChaves] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (check: boolean) => {
    setChecking(check);
    try {
      const res = await fetch(`/api/admin/redes-sociais${check ? '?check=1' : ''}`, { credentials: 'include', cache: 'no-store' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao carregar as redes sociais.');
      setData((prev) => ({ ...d, connection: check ? d.connection : prev?.connection ?? null }));
      setPerfis((cur) => (Object.keys(cur).length ? cur : d.profiles || {}));
      setExtras((cur) => (Object.keys(cur).length ? cur : Object.fromEntries(EXTRAS.map((k) => [k, Boolean(d.profiles?.[k])]))));
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao carregar as redes sociais.' });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  const ligado = (c: Cartao) => (c.partilha ? !!data?.settings[c.partilha] : !!extras[c.id]);

  const guardar = async (c: Cartao, opts: { limpar?: boolean } = {}) => {
    setBusy(c.id);
    setMsg(null);
    try {
      const profiles: Record<string, string> = {};
      const keys: Record<string, string> = {};
      for (const f of c.campos) {
        if (f.tipo === 'perfil') profiles[f.id] = opts.limpar ? '' : perfis[f.id] || '';
        else if (chaves[f.id]?.trim()) keys[f.id] = chaves[f.id].trim();
      }
      const res = await fetch('/api/admin/redes-sociais', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profiles, keys }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao guardar.');
      setPerfis((cur) => ({ ...cur, ...d.profiles }));
      setChaves((cur) => Object.fromEntries(Object.entries(cur).filter(([k]) => !(k in keys))));
      setMsg({ tipo: 'ok', texto: `${c.nome}: guardado.` });
      await load(true);
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao guardar.' });
    } finally {
      setBusy(null);
    }
  };

  const alternar = async (c: Cartao, on: boolean) => {
    if (!data) return;
    setMsg(null);
    if (!c.partilha) {
      setExtras({ ...extras, [c.id]: on });
      if (!on && perfis[c.id]) { setPerfis({ ...perfis, [c.id]: '' }); await guardar(c, { limpar: true }); }
      return;
    }
    const antes = data.settings;
    setData({ ...data, settings: { ...antes, [c.partilha]: on } });
    try {
      const res = await fetch('/api/admin/redes-sociais', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [c.partilha]: on }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao guardar.');
      setData((cur) => (cur ? { ...cur, settings: d.settings } : cur));
    } catch (err) {
      setData((cur) => (cur ? { ...cur, settings: antes } : cur));
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao guardar.' });
    }
  };

  if (!data) {
    return <div className="flex justify-center p-12"><Spinner size={28} className="" /></div>;
  }

  const estadoLigacao = (c: Cartao) => {
    if (!c.partilha) return null;
    const conn = c.liga ? data.connection?.find((x) => x.network === c.liga) : undefined;
    if (!data.configured[c.partilha]) return <><CircleSlash className="mt-px h-3.5 w-3.5 shrink-0 text-[#646970]" /><span className="text-[#646970]">Sem ligação: faltam os dados de ligação.</span></>;
    if (c.id === 'reels') return <><CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-[#00a651]" /><span className="text-[#008f45]">Dados da Página definidos.</span></>;
    if (!conn) return <span className="text-[#646970]">{checking ? 'A verificar a ligação…' : 'Ligação por verificar.'}</span>;
    return conn.state === 'ligado'
      ? <><CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-[#00a651]" /><span className="text-[#008f45]">Ligado. {conn.detail}</span></>
      : <><CircleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-[#d63638]" /><span className="text-[#d63638]">Erro na ligação: {conn.detail}</span></>;
  };

  const origem = (s: KeyState) => (s === 'painel' ? 'definido' : s === 'servidor' ? 'definido no servidor' : 'em falta');

  return (
    <div className="ec-page text-[#2c3338]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Redes sociais</h1>
          <p className="mt-1 max-w-xl text-[13px] text-[#50575e]">
            Ligue as redes sociais do EntreCAMPOS com o sistema de partilha de publicações.
          </p>
        </div>
        <button onClick={() => load(true)} disabled={checking} className="flex h-9 items-center gap-1.5 rounded-md border border-[#00a651] px-3 text-[13px] text-[#00a651] hover:bg-[#f0f7f4] disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} /> Verificar ligação
        </button>
      </div>

      <ConfigNote area="redes-sociais" />
      {msg && (
        <div className={`mb-4 rounded-md border px-4 py-2 text-[13px] ${msg.tipo === 'ok' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{msg.texto}</div>
      )}

      <div className="max-w-3xl divide-y divide-[#ccd0d4] overflow-hidden rounded-lg border border-[#ccd0d4] bg-white">
        {CARTOES.map((c) => {
          const on = ligado(c);
          return (
            <div key={c.id} className="p-4">
              <div className="flex items-start gap-3">
                {/* Interruptor redondo: a bola corre por dentro. É um div (e não um button) porque o painel põe cantos rectos em todos os botões. */}
                <div
                  role="switch"
                  tabIndex={0}
                  aria-checked={on}
                  aria-label={`Ligar ${c.nome}`}
                  onClick={() => alternar(c, !on)}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); alternar(c, !on); } }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#00a651] focus-visible:ring-offset-2 ${on ? 'bg-[#00a651]' : 'bg-[#c3c4c7]'}`}
                >
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-[#1d2327]">{c.nome}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-[#50575e]">{c.texto}</p>
                  {on && c.partilha && <p className="mt-1.5 flex items-start gap-1.5 text-[12px]">{estadoLigacao(c)}</p>}
                </div>
              </div>

              {on && (c.nota || c.campos.length > 0) && (
                <div className="mt-3 space-y-3 border-t border-[#f0f0f1] pt-3 sm:ml-14">
                  {c.nota && <p className="text-[12px] leading-5 text-[#646970]">{c.nota}</p>}
                  {c.campos.map((f) => (
                    <label key={f.id} className="block">
                      <span className="mb-1 flex flex-wrap items-center gap-x-2 text-[13px] text-[#1d2327]">
                        {f.label}
                        {f.tipo === 'chave' && <span className={`text-[12px] font-normal ${data.keys[f.id as KeyName] === 'em-falta' ? 'text-[#646970]' : 'text-[#008f45]'}`}>({origem(data.keys[f.id as KeyName])})</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        <input
                          type={f.segredo ? 'password' : f.tipo === 'perfil' ? 'url' : 'text'}
                          autoComplete="off"
                          value={f.tipo === 'perfil' ? perfis[f.id] || '' : chaves[f.id] || ''}
                          placeholder={f.tipo === 'perfil' ? c.exemplo : data.keys[f.id as KeyName] !== 'em-falta' ? 'Deixe em branco para manter' : ''}
                          onChange={(e) => (f.tipo === 'perfil' ? setPerfis({ ...perfis, [f.id]: e.target.value }) : setChaves({ ...chaves, [f.id]: e.target.value }))}
                          className={inputCls}
                        />
                        {f.tipo === 'perfil' && perfis[f.id] && (
                          <a href={perfis[f.id]} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${c.nome}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#00a651] text-[#00a651] hover:bg-[#f0f7f4]">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </span>
                      {f.ajuda && <span className="mt-1 block text-[12px] text-[#646970]">{f.ajuda}</span>}
                    </label>
                  ))}
                  {c.campos.length > 0 && (
                    <div className="flex justify-end">
                      <button onClick={() => guardar(c)} disabled={busy === c.id} className="flex h-9 items-center gap-1.5 rounded-md bg-[#00a651] px-4 text-[13px] text-white hover:bg-[#008f45] disabled:opacity-50">
                        <Save className="h-4 w-4" /> {busy === c.id ? 'A guardar…' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 max-w-3xl text-[12px] text-[#646970]">Os tokens e IDs ficam cifrados no servidor e nunca voltam ao navegador.</p>
    </div>
  );
}
