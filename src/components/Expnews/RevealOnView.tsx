'use client';

import { useEffect } from 'react';

/**
 * Entrada dos cards (slide up): cada `.ec-reveal` arranca quando chega ao ecrã (classe `ec-load`) e sobe de uma
 * só vez, a velocidade normal, até ao fim, sem parar a meio nem depender do scroll. Numa linha de 3 colunas
 * entram em sequência (1.ª, 2.ª, 3.ª). Anima uma única vez: voltar a subir não repete. Ao entrar noutra página
 * (ou voltar a ela) os cards são novos e o efeito corre de novo. Sem JavaScript os cards ficam visíveis.
 */
export default function RevealOnView() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('ec-load');
          io.unobserve(entry.target);
        }
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }, // arranca quando o topo do card passa os 92% do ecrã
    );
    const seen = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll<HTMLElement>('.ec-reveal').forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (el.getBoundingClientRect().bottom < 0) el.classList.add('ec-done'); // já ficou para trás (ex.: scroll restaurado)
        else io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(scan); // páginas novas (navegação dentro do site) trazem cards novos
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
