import Link from 'next/link';
import InnerPage, { InnerSidebar } from '@/components/Expnews/InnerPage';
import { loadPlanos } from '@/lib/assinaturas';
import { precoEmTexto } from '@/lib/assinaturas-types';

export const metadata = { title: 'Planos — EntreCAMPOS' };
export const revalidate = 30;

type Cartao = { id: string; nome: string; para?: string; preco: string; destaque?: boolean; itens: string[]; acao: string; href?: string };

const botao = 'mt-5 block px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide transition-colors';

export default async function Planos() {
  const { plans } = await loadPlanos();
  const cartoes: Cartao[] = [
    { id: 'leitor', nome: 'Leitor', para: 'Para acompanhar o dia a dia', preco: 'Grátis', itens: ['Notícias do dia', 'Oportunidades e guias', 'Câmbio e clima', 'Newsletter semanal'], acao: 'Criar conta grátis', href: '/register' },
    ...plans.filter((p) => p.active).map((p) => ({
      id: p.id,
      nome: p.name,
      para: p.description,
      preco: precoEmTexto(p),
      destaque: true,
      itens: p.features,
      acao: p.price == null ? 'Brevemente' : 'Assinar',
      href: p.price == null ? undefined : `/checkout?plano=${encodeURIComponent(p.id)}`,
    })),
    { id: 'empresarial', nome: 'Empresarial', para: 'Para equipas e organizações', preco: 'Sob consulta', itens: ['Vários leitores na mesma conta', 'Alertas à medida', 'Apoio dedicado'], acao: 'Falar connosco', href: '/pagina/contactos' },
  ];
  return (
    <InnerPage title="Planos" trail={[{ label: 'Planos' }]}>
      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <main className="min-w-0 space-y-3">
          <div className="bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#00a651]">Notícias exclusivas</p>
            <h1 className="mt-1 text-xl font-extrabold text-[#0b5c2e]">Escolha como quer ler o EntreCAMPOS</h1>
            <p className="mt-1 text-[13px] text-neutral-600">Uma parte do conteúdo continua aberta a todos. Quem assina recebe as notícias exclusivas e os guias completos.</p>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            {cartoes.map((p) => (
              <article key={p.id} className="flex flex-col bg-white p-5 shadow-sm" style={{ borderTop: `3px solid ${p.destaque ? '#00a651' : 'transparent'}` }}>
                <h2 className="text-base font-bold uppercase text-[#00a651]">{p.nome}</h2>
                {p.para && <p className="mt-1 text-xs text-neutral-500">{p.para}</p>}
                <p className="mt-4 text-lg font-extrabold text-neutral-900">{p.preco}</p>
                <ul className="mt-4 flex-1 space-y-2 text-[13px] leading-snug">
                  {p.itens.map((i) => (
                    <li key={i} className="flex gap-2"><span aria-hidden className="text-[#00a651]">✓</span><span>{i}</span></li>
                  ))}
                </ul>
                {p.href ? (
                  <Link href={p.href} className={`${botao} bg-[#0b5c2e] text-white hover:bg-[#00a651]`}>{p.acao}</Link>
                ) : (
                  <span className={`${botao} cursor-not-allowed bg-neutral-200 text-neutral-500`}>{p.acao}</span>
                )}
              </article>
            ))}
          </div>
          <div className="bg-white px-6 py-5 text-[13px] leading-relaxed text-neutral-600 shadow-sm">
            <b className="text-neutral-800">Como funciona</b>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Escolha o plano e carregue em Assinar.</li>
              <li>Entre ou crie a sua conta, faça o pagamento como indicado e escreva a referência.</li>
              <li>Confirmamos o pagamento e a subscrição fica activa. Só depois passa a ter a sua área de assinante, onde vê o tempo que resta e renova sem perder dias.</li>
            </ol>
          </div>
        </main>
        <InnerSidebar />
      </div>
    </InnerPage>
  );
}
