'use client';

import { useEffect, useState } from 'react';

const CSS = `
html.ec-protect, html.ec-protect body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
html.ec-protect img { -webkit-user-drag: none; pointer-events: none; }
html.ec-shield body { visibility: hidden !important; }
html.ec-shield #ec-shield-msg { visibility: visible !important; }
@media print { html.ec-protect body { display: none !important; } }
`;

/** Dificulta a cópia nesta página: sem selecionar, copiar, menu do rato, arrastar, guardar, imprimir nem ver o código; esconde o conteúdo quando a janela perde o foco ou ao usar atalhos de captura. */
export default function PageProtection() {
  const [shield, setShield] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('ec-protect');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const hide = (ms?: number) => {
      setShield(true);
      if (timer) clearTimeout(timer);
      if (ms) timer = setTimeout(() => setShield(!document.hasFocus() || document.hidden), ms);
    };
    const show = () => { if (document.hasFocus() && !document.hidden) setShield(false); };
    const block = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (k === 'printscreen') { hide(2500); navigator.clipboard?.writeText('').catch(() => {}); e.preventDefault(); return; }
      if (e.metaKey && e.shiftKey) hide(2500); // capturas do macOS (Cmd+Shift+3/4/5)
      if (e.key === 'F12' || (mod && ['c', 'x', 'a', 'p', 's', 'u'].includes(k)) || (mod && e.shiftKey && ['i', 'j', 'c', 's'].includes(k))) { e.preventDefault(); e.stopPropagation(); }
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'PrintScreen') { hide(2500); navigator.clipboard?.writeText('').catch(() => {}); } };
    const events: [string, EventListener][] = [['contextmenu', block], ['copy', block], ['cut', block], ['dragstart', block], ['selectstart', block], ['beforeprint', () => hide(2000)]];
    events.forEach(([n, f]) => document.addEventListener(n, f));
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('keyup', onKeyUp, true);
    const onBlur = () => hide();
    const onVis = () => (document.hidden ? hide() : show());
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', show);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      root.classList.remove('ec-protect', 'ec-shield');
      events.forEach(([n, f]) => document.removeEventListener(n, f));
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', show);
      document.removeEventListener('visibilitychange', onVis);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => { document.documentElement.classList.toggle('ec-shield', shield); }, [shield]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {shield && <div id="ec-shield-msg" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1d2327] px-6 text-center text-[14px] text-white">Conteúdo protegido. Volte a esta janela para ver os espaços de publicidade.</div>}
    </>
  );
}
