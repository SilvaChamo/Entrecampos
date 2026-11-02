'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link2, Mail, Share2 } from 'lucide-react';
import { shareNetworks } from '@/lib/share';

/**
 * Botão "Partilhar": abre um popup com as redes sociais (WhatsApp, Facebook, LinkedIn,
 * Twitter, Pinterest, Telegram), email e copiar ligação. O popup vai para o <body> para
 * não ser cortado pelos cards (overflow-hidden).
 */
const POPUP_W = 176;
const ROW_H = 26;
const POPUP_H = 8 * ROW_H + 8; // 8 linhas + padding

export default function ShareLink({ path, title, className = '' }: { path: string; title: string; className?: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [pos]);

  function toggle() {
    if (pos) return setPos(null);
    const r = button.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - POPUP_W / 2), window.innerWidth - POPUP_W - 8);
    const above = r.bottom + 10 + POPUP_H > window.innerHeight;
    setPos({ left, above, top: above ? r.top - 10 - POPUP_H : r.bottom + 10 });
    setCopied(false);
  }

  const url = typeof window === 'undefined' ? '' : `${window.location.origin}${path}`;
  const enc = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt('Copie a ligação:', url);
    }
  }

  const row = `flex w-full items-center gap-2.5 px-2 text-left text-[11px] font-medium text-gray-800 hover:bg-black/5`;
  const rowStyle = { height: ROW_H };

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={!!pos}
        className={`inline-flex items-center gap-1 hover:text-red-600 ${className}`}
      >
        <Share2 className="h-3 w-3" />
        Partilhar
      </button>
      {pos &&
        createPortal(
          <>
            <button type="button" aria-label="Fechar" className="fixed inset-0 z-[90] cursor-default" onClick={() => setPos(null)} />
            <div
              role="menu"
              style={{ top: pos.top, left: pos.left, width: POPUP_W, height: POPUP_H }}
              className="fixed z-[100] flex flex-col justify-between bg-white/80 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.25)] ring-1 ring-black/10 backdrop-blur-xl backdrop-saturate-150"
            >
              {/* seta do popup, como nos menus do macOS */}
              <span
                aria-hidden="true"
                className={`absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-white/80 ring-1 ring-black/10 backdrop-blur-xl ${
                  pos.above ? '-bottom-[5px]' : '-top-[5px]'
                }`}
                style={{ clipPath: pos.above ? 'polygon(100% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 0 100%)' }}
              />
              {shareNetworks(enc, text).map((n) => (
                <a
                  key={n.label}
                  href={n.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Partilhar no ${n.label}`}
                  onClick={() => setPos(null)}
                  className={row}
                  style={rowStyle}
                >
                  {/* só o ícone, na cor da rede (sem fundo) */}
                  <svg viewBox="0 0 24 24" className={`shrink-0 fill-current text-gray-500 ${n.label === 'WhatsApp' ? 'h-[15px] w-[15px] -mx-[1.5px]' : 'h-3 w-3'}`} aria-hidden="true">
                    <path d={n.icon} />
                  </svg>
                  {n.label}
                </a>
              ))}
              <a href={`mailto:?subject=${text}&body=${enc}`} aria-label="Partilhar por email" className={row} style={rowStyle}>
                <Mail className="h-3 w-3 shrink-0 text-gray-500" />
                Email
              </a>
              <button type="button" onClick={copy} aria-label="Copiar ligação" className={row} style={rowStyle}>
                <Link2 className="h-3 w-3 shrink-0 text-gray-500" />
                {copied ? 'Ligação copiada' : 'Copiar ligação'}
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
