'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Último pedido de verificação dos envios agendados da newsletter (no máximo um a cada 5 minutos neste separador). */
let lastPulse = 0;

/** Regista cada página vista (só no site público). A notícia é identificada pelo endereço /noticias/<slug>. */
export default function HitTracker() {
  const pathname = usePathname();
  // Disparo de reserva da newsletter agendada: só a partir do painel. Os envios já saem do GitHub (de 5 em 5 minutos) e do
  // cron diário da Vercel; se também saísse de cada visita ao site, cada visitante acordava uma função na Vercel (CPU) só para isto.
  useEffect(() => {
    if (!pathname?.startsWith('/admin')) return;
    if (Date.now() - lastPulse < 5 * 60_000) return;
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
