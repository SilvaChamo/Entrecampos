'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
const GREEN = '#00a651';

type Estado = 'a-verificar' | 'livre' | 'login' | 'plano';

/**
 * Corpo de uma notícia exclusiva. O servidor só envia o início do texto; o resto é pedido depois à API,
 * que só o entrega à redacção e a assinantes com subscrição activa.
 */
export default function ExclusivaGate({ slug, inicio }: { slug: string; inicio: string }) {
  const [estado, setEstado] = useState<Estado>('a-verificar');
  const [html, setHtml] = useState(inicio);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/assinatura/artigo?slug=${encodeURIComponent(slug)}`, { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { access?: boolean; reason?: string; html?: string }) => {
        if (!vivo) return;
        if (d.access && d.html) { setHtml(d.html); setEstado('livre'); } else setEstado(d.reason === 'plano' ? 'plano' : 'login');
      })
      .catch(() => vivo && setEstado('login'));
    return () => { vivo = false; };
  }, [slug]);

  const bloqueado = estado === 'login' || estado === 'plano';
  return (
    <>
      <div className="relative">
        <div className="blog-details mt-6 text-[15px] leading-7 text-gray-500 max-sm:text-[18px] max-sm:leading-8 [&_a]:text-[#008000] [&_a]:underline [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: html }} />
        {bloqueado && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />}
      </div>
      {bloqueado && (
        <div className="mt-2 border-l-4 bg-[#eaf3ed] p-5" style={{ borderColor: GREEN }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: GREEN }}>Notícia exclusiva para assinantes</p>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-700">
            {estado === 'plano' ? 'A sua conta não tem uma subscrição activa. Escolha um plano para ler a notícia completa.' : 'Assine a EntreCAMPOS para ler a notícia completa. Se já é assinante, inicie sessão.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/planos" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: '#0b5c2e' }}>Ver planos</Link>
            {estado === 'login' ? (
              <Link href={`/login?next=${encodeURIComponent(`/noticias/${slug}`)}`} className="border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ borderColor: GREEN, color: GREEN }}>Já sou assinante · Entrar</Link>
            ) : (
              <Link href="/assinante" className="border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ borderColor: GREEN, color: GREEN }}>Área de assinantes</Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
