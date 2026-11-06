import type { Metadata } from 'next';
import Link from 'next/link';
import InnerPage from '@/components/Expnews/InnerPage';
import AdSpacesPopup from '@/components/Newsletter/AdSpacesPopup';
import PageProtection from '@/components/Newsletter/PageProtection';
import { loadAds } from '@/lib/newsletter-ads';

export const metadata: Metadata = { title: 'Espaços de publicidade', robots: { index: false } };

/** Página do site com os espaços de publicidade: os da newsletter (por omissão) e, no botão do cabeçalho, os do site. */
export default async function PublicidadePage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const site = (await searchParams).ver === 'site';
  const { prices } = await loadAds();
  const link = (
    <Link href={site ? '/espacos-de-publicidade' : '/espacos-de-publicidade?ver=site'} className="flex h-9 items-center justify-center border border-[#ccd0d4] bg-white px-4 text-[13px] text-[#1d2327] hover:text-[#d6101c]">
      {site ? 'Publicidade na newsletter' : 'Publicidade no site'}
    </Link>
  );
  return (
    <InnerPage title="Espaços de publicidade" trail={[{ label: 'Espaços de publicidade' }]}>
      <PageProtection />
      <div className="mx-auto w-full max-w-[760px] shadow-sm">
        <AdSpacesPopup prices={prices} headerLink={link} view={site ? 'site' : 'newsletter'} />
      </div>
    </InnerPage>
  );
}
