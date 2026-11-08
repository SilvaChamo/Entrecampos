import ArchiveView from '@/app/noticias/ArchiveView';

export const revalidate = 604800; // 7 dias; gravar no painel limpa já o cache (lib/refresh-site.ts)
export const metadata = { title: 'Arquivo de notícias — EntreCAMPOS' };

/** Páginas 2, 3... do arquivo. Serve /noticias?pagina=N (reescrita em next.config.ts) e fica em cache. */
export default async function ArquivoPagina({ params }: { params: Promise<{ pagina: string }> }) {
  return <ArchiveView page={parseInt((await params).pagina, 10) || 1} />;
}
