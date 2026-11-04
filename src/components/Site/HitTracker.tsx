'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Regista cada página vista (só no site público). A notícia é identificada pelo endereço /noticias/<slug>. */
export default function HitTracker() {
  const pathname = usePathname();
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
