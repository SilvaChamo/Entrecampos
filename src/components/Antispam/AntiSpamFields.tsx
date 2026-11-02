'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

/** Volta a pedir o desafio do Turnstile (um token só vale para um envio). Chamar depois de cada envio. */
export function resetAntiSpam() {
  try {
    window.turnstile?.reset();
  } catch {
    /* sem widget */
  }
}

/**
 * Campos anti-spam para pôr DENTRO de qualquer <form> público (menos o de login):
 *  - honeypot: campo escondido ("empresa_web") que só os robôs preenchem;
 *  - `_ts`: hora a que o formulário abriu (o servidor rejeita envios instantâneos);
 *  - Cloudflare Turnstile: o widget escreve o token em `cf-turnstile-response`.
 * Os campos vão no FormData do formulário e são verificados no servidor por guardForm().
 */
export default function AntiSpamFields({ theme = 'light' }: { theme?: 'light' | 'dark' | 'auto' }) {
  const [ts, setTs] = useState('');
  const [token, setToken] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => setTs(String(Date.now())), []);

  useEffect(() => {
    if (!SITE_KEY || !scriptReady || !box.current || widget.current || !window.turnstile) return;
    widget.current = window.turnstile.render(box.current, {
      sitekey: SITE_KEY,
      theme,
      language: 'pt',
      callback: (t: string) => setToken(t),
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
    });
  }, [scriptReady, theme]);

  // Se o script já estava carregado por outro formulário da mesma página.
  useEffect(() => {
    if (window.turnstile) setScriptReady(true);
  }, []);

  return (
    <>
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Não preencha este campo
          <input type="text" name="empresa_web" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name="_ts" value={ts} />
      {SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={() => setScriptReady(true)}
          />
          <div ref={box} className="min-h-[65px]" />
          <input type="hidden" name="cf-turnstile-response" value={token} />
        </>
      )}
    </>
  );
}
