import ArchiveView from './ArchiveView';

export const revalidate = 604800; // 7 dias; gravar no painel limpa já o cache (lib/refresh-site.ts)
export const metadata = { title: 'Arquivo de notícias — EntreCAMPOS' };

/** Arquivo de notícias (1.ª página). Sem searchParams, para ficar em cache; ?pagina=N e ?q= têm rotas próprias (next.config.ts). */
export default function ArquivoDeNoticias() {
  return <ArchiveView />;
}
