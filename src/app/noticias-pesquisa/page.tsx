import ArchiveView from '@/app/noticias/ArchiveView';

export const metadata = { title: 'Arquivo de notícias — EntreCAMPOS' };

/** Pesquisa no arquivo. Serve /noticias?q=... (reescrita em next.config.ts); é a única variante que se renderiza a cada pedido. */
export default async function PesquisaDeNoticias({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const { q = '', pagina } = await searchParams;
  return <ArchiveView q={q} page={parseInt(pagina || '1', 10) || 1} />;
}
