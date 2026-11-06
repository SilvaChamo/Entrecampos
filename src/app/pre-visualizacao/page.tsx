import { notFound } from 'next/navigation';
import PreviewFrames from './PreviewFrames';

export const metadata = { title: 'Pré-visualização', robots: { index: false, follow: false } };

/** Ferramenta só do desenvolvimento: mostra a mesma página no computador e no telemóvel, lado a lado. Não existe em produção. */
export default function PreVisualizacaoPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <PreviewFrames />;
}
