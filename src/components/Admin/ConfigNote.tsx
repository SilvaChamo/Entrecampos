'use client';

import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';

type Item = { vars?: string[]; text: string; link?: { texto: string; href: string } };

/** Nota no topo de uma página do painel com o que falta configurar para ela funcionar. Não aparece se estiver tudo configurado. */
export default function ConfigNote({ area }: { area: 'redes-sociais' }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/admin/config-status?area=${area}`, { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => vivo && setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => {});
    return () => { vivo = false; };
  }, [area]);

  if (items.length === 0) return null;
  return (
    <div role="note" className="mb-4 rounded-lg border border-[#dba617] bg-white p-4 text-[13px] leading-6 text-[#2c3338]">
      <p className="mb-1 flex items-center gap-1.5"><Settings2 className="h-4 w-4 text-[#50575e]" /> Falta configurar para esta página funcionar por completo</p>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((i) => (
          <li key={i.text}>
            {i.text}
            {i.link && <> <a href={i.link.href} target="_blank" rel="noopener noreferrer" className="text-[#00a651] underline">{i.link.texto}</a>.</>}
            {i.vars && i.vars.length > 0 && (
              <> Definir no servidor: {i.vars.map((v, k) => (<span key={v}>{k > 0 && ', '}<code className="bg-[#f6f7f7] px-1">{v}</code></span>))}.</>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
