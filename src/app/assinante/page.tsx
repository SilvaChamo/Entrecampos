import InnerPage, { InnerSidebar } from '@/components/Expnews/InnerPage';
import AreaAssinante from '@/components/Site/AreaAssinante';

export const metadata = { title: 'Área de assinantes — EntreCAMPOS', robots: { index: false, follow: false } };

export default function Assinante() {
  return (
    <InnerPage title="Área de assinantes" trail={[{ label: 'Área de assinantes' }]}>
      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <main className="min-w-0"><AreaAssinante /></main>
        <InnerSidebar />
      </div>
    </InnerPage>
  );
}
