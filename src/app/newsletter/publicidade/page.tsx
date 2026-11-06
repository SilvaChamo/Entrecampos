import type { Metadata } from 'next';
import AdWireframe from '@/components/Newsletter/AdWireframe';
import { loadAds } from '@/lib/newsletter-ads';

export const metadata: Metadata = { title: 'Publicidade na newsletter | EntreCAMPOS' };
export const revalidate = 300;

/** Espaços de publicidade da newsletter do EntreCAMPOS, com tamanhos e custos (página que abre o botão do rodapé do e-mail). */
export default async function NewsletterPublicidadePage() {
  const { prices } = await loadAds();
  return (
    <main className="mx-auto max-w-[760px] px-4 py-10 text-[#2c3338]">
      <h1 className="text-2xl font-bold text-[#1d2327]">Publicidade na newsletter</h1>
      <p className="mb-6 mt-2 text-[14px] leading-6 text-[#50575e]">Estes são os espaços disponíveis na newsletter do EntreCAMPOS, com o tamanho e o custo de cada um. Para anunciar, fale connosco.</p>
      <AdWireframe prices={prices} />
      <a href="/pagina/contactos" className="mt-6 inline-flex h-9 items-center bg-[#d6101c] px-4 text-[13px] text-white hover:bg-[#b00d17]">Falar com a equipa</a>
    </main>
  );
}
