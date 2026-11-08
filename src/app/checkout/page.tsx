import InnerPage, { InnerSidebar } from '@/components/Expnews/InnerPage';
import Checkout from '@/components/Site/Checkout';

export const metadata = { title: 'Finalizar subscrição — EntreCAMPOS', robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plano?: string }> }) {
  const { plano } = await searchParams;
  return (
    <InnerPage title="Finalizar subscrição" trail={[{ label: 'Planos', href: '/planos' }, { label: 'Finalizar subscrição' }]}>
      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <main className="min-w-0"><Checkout planoId={typeof plano === 'string' ? plano.slice(0, 40) : ''} /></main>
        <InnerSidebar />
      </div>
    </InnerPage>
  );
}
