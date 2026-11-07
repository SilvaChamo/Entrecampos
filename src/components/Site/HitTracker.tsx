'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Último pedido de verificação dos envios agendados da newsletter (no máximo um por minuto neste separador). */
let lastPulse = 0;

/** Regista cada página vista (só no site público). A notícia é identificada pelo endereço /noticias/<slug>. */
export default function HitTracker() {
  const pathname = usePathname();
  // Disparo de reserva da newsletter agendada: vale também no painel, onde as visitas não são contadas.
  useEffect(() => {
    if (Date.now() - lastPulse < 60_000) return;
    lastPulse = Date.now();
    fetch('/api/newsletter/pulso', { method: 'POST', keepalive: true }).catch(() => {});
  }, [pathname]);
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/partilha/')) return;
    const slug = pathname.startsWith('/noticias/') ? decodeURIComponent(pathname.split('/')[2] || '') : undefined;
    const payload = JSON.stringify({ path: pathname, slug, ref: document.referrer });
    try {
      if (!navigator.sendBeacon?.('/api/stats/hit', new Blob([payload], { type: 'application/json' }))) throw new Error('beacon');
    } catch {
      fetch('/api/stats/hit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    }
  }, [pathname]);
  return null;
}
