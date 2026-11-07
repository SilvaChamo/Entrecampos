'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const GROUPS: { label: string; pages: { label: string; path: string }[] }[] = [
  {
    label: 'Painel',
    pages: [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Notícias', path: '/admin/noticias' },
      { label: 'Adicionar notícia', path: '/admin/noticias/nova' },
      { label: 'Notícias pendentes', path: '/admin/noticias/pendentes' },
      { label: 'Notícias revistas', path: '/admin/noticias/revistas' },
      { label: 'Arquivadas', path: '/admin/noticias/arquivadas' },
      { label: 'Lixo', path: '/admin/noticias/lixo' },
      { label: 'Categorias', path: '/admin/noticias/categorias' },
      { label: 'Etiquetas', path: '/admin/noticias/etiquetas' },
      { label: 'Reparar imagens', path: '/admin/noticias/reparar' },
      { label: 'Multimédia', path: '/admin/media' },
      { label: 'Limpeza de media', path: '/admin/media/limpeza' },
      { label: 'Utilizadores', path: '/admin/utilizadores' },
      { label: 'Adicionar utilizador', path: '/admin/utilizadores/novo' },
      { label: 'O seu perfil', path: '/admin/perfil' },
      { label: 'Arquivo de fotos', path: '/admin/arquivo' },
      { label: 'Arquivos partilhados', path: '/admin/partilhado' },
      { label: 'PDF', path: '/admin/partilhado/pdf' },
      { label: 'Arquivos ZIP', path: '/admin/partilhado/zip' },
      { label: 'Documentos', path: '/admin/partilhado/documentos' },
      { label: 'Newsletter', path: '/admin/newsletter' },
      { label: 'Estatísticas', path: '/admin/trafego' },
      { label: 'Comentários', path: '/admin/comentarios' },
      { label: 'Painel do editor', path: '/admin/editor' },
      { label: 'Painel do contribuidor', path: '/admin/contribuidor' },
      { label: 'Painel do visitante', path: '/admin/guest' },
    ],
  },
  {
    label: 'Site',
    pages: [
      { label: 'Início', path: '/' },
      { label: 'Arquivo de notícias', path: '/noticias' },
      { label: 'Categorias', path: '/categorias' },
      { label: 'Categoria: Agricultura', path: '/categoria/agricultura' },
      { label: 'Executiva', path: '/executiva' },
      { label: 'Entrar', path: '/login' },
      { label: 'Registar', path: '/register' },
      { label: 'Recuperar senha', path: '/recuperar-senha' },
    ],
  },
];
const ALL = GROUPS.flatMap((g) => g.pages);
const PHONES = [320, 375, 414];
const DESKTOP_W = 1280;
const BEZEL = 14;

const pathOf = (w: Window | null | undefined) => {
  try {
    return w ? w.location.pathname + w.location.search : null;
  } catch {
    return null;
  }
};

/** O mesmo endereço em duas janelas: computador (1280px) e telemóvel (320, 375 ou 414px). Andam juntas ao navegar em qualquer uma. */
export default function PreviewFrames() {
  const desk = useRef<HTMLIFrameElement>(null);
  const phone = useRef<HTMLIFrameElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState('/admin/dashboard');
  const [typed, setTyped] = useState('/admin/dashboard');
  const [phoneW, setPhoneW] = useState(320);
  const [sync, setSync] = useState(true);
  const [size, setSize] = useState({ w: 1200, h: 700 });
  const initial = useRef(path);
  const current = useRef(path); // o endereço em que as duas janelas devem estar

  // O endereço inicial pode vir em ?url=
  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get('url');
    if (u && u.startsWith('/')) {
      initial.current = u;
      current.current = u;
      setPath(u);
      setTyped(u);
      desk.current?.contentWindow?.location.replace(u);
      phone.current?.contentWindow?.location.replace(u);
    }
  }, []);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const go = useCallback((next: string) => {
    current.current = next;
    setPath(next);
    setTyped(next);
    for (const f of [desk.current, phone.current]) {
      if (f?.contentWindow && pathOf(f.contentWindow) !== next) f.contentWindow.location.replace(next);
    }
  }, []);

  // Navegou-se dentro de uma das janelas (clique numa ligação; o painel navega sem recarregar, por isso não há evento "load"):
  // de meio em meio segundo vê-se o endereço de cada uma e a outra acompanha.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const d = pathOf(desk.current?.contentWindow);
      const p = pathOf(phone.current?.contentWindow);
      const moved = [[d, phone.current] as const, [p, desk.current] as const].find(([x]) => x && x.startsWith('/') && x !== current.current);
      if (!moved) return;
      const [next, other] = moved;
      current.current = next!;
      setPath(next!);
      setTyped(next!);
      if (sync && other?.contentWindow && pathOf(other.contentWindow) !== next) other.contentWindow.location.replace(next!);
    }, 500);
    return () => window.clearInterval(timer);
  }, [sync]);

  const index = ALL.findIndex((p) => p.path === path);
  const step = (d: number) => go(ALL[(Math.max(index, 0) + d + ALL.length) % ALL.length].path);

  const phoneFrameW = phoneW + BEZEL * 2;
  const gap = 24;
  const deskScale = Math.min(1, Math.max(0.2, (size.w - phoneFrameW - gap) / DESKTOP_W));
  const phoneH = Math.min(812, size.h - BEZEL * 2);
  const phoneScale = Math.min(1, (size.h - BEZEL * 2) / 812);
  const ctl = 'h-9 border border-[#ccd0d4] bg-white px-3 text-[13px] rounded-[3px]';

  return (
    <div className="flex h-screen flex-col bg-[#e8eaec] text-[#2c3338]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#ccd0d4] bg-white px-3 py-2">
        <button onClick={() => step(-1)} className={`${ctl} hover:text-[#00a651]`} aria-label="Página anterior">‹</button>
        <select value={ALL.some((p) => p.path === path) ? path : ''} onChange={(e) => e.target.value && go(e.target.value)} className={`${ctl} min-w-0 max-w-[220px]`}>
          <option value="">Outra página</option>
          {GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.pages.map((p) => (
                <option key={g.label + p.path} value={p.path}>{p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button onClick={() => step(1)} className={`${ctl} hover:text-[#00a651]`} aria-label="Página seguinte">›</button>
        <form onSubmit={(e) => { e.preventDefault(); if (typed.startsWith('/')) go(typed); }} className="flex min-w-0 flex-1 gap-2">
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="/endereço" className={`${ctl} min-w-0 flex-1`} />
          <button type="submit" className={`${ctl} hover:text-[#00a651]`}>Ir</button>
        </form>
        <div className="flex items-center gap-1">
          {PHONES.map((w) => (
            <button key={w} onClick={() => setPhoneW(w)} className={`${ctl} ${phoneW === w ? 'border-[#00a651] text-[#008f45]' : 'hover:text-[#00a651]'}`}>{w}px</button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[13px]">
          <input type="checkbox" checked={sync} onChange={(e) => setSync(e.target.checked)} /> Janelas juntas
        </label>
      </div>

      <div ref={area} className="flex min-h-0 flex-1 items-start justify-center gap-6 overflow-hidden p-3">
        {/* Computador */}
        <div className="shrink-0 overflow-hidden border border-[#ccd0d4] bg-white shadow-sm" style={{ width: DESKTOP_W * deskScale, height: size.h - 24 }}>
          <iframe
            ref={desk}
            title="Computador"
            src={initial.current}
            style={{ width: DESKTOP_W, height: (size.h - 24) / deskScale, transform: `scale(${deskScale})`, transformOrigin: '0 0', border: 0, background: '#fff' }}
          />
        </div>
        {/* Telemóvel */}
        <div
          className="shrink-0 rounded-[28px] bg-[#111] shadow-lg"
          style={{ width: phoneFrameW * phoneScale, height: (phoneH + BEZEL * 2) * phoneScale, padding: BEZEL * phoneScale }}
        >
          <div className="overflow-hidden rounded-[16px] bg-white" style={{ width: phoneW * phoneScale, height: phoneH * phoneScale }}>
            <iframe
              ref={phone}
              title="Telemóvel"
              src={initial.current}
              style={{ width: phoneW, height: phoneH, transform: `scale(${phoneScale})`, transformOrigin: '0 0', border: 0, background: '#fff' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
