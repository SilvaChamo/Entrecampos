import { notFound } from 'next/navigation';
import InnerPage from '@/components/Expnews/InnerPage';
import { getStaticPage } from '@/lib/news-data';
import ContactLayout from '@/components/Site/ContactLayout';

export const revalidate = 3600;

export default async function PaginaPage({ params }: { params: Promise<{ slug: string }> }) {
  const params_slug = (await params).slug;
  const page = getStaticPage(params_slug);
  if (!page) notFound();

  if (params_slug === 'contactos') {
    return (
      <InnerPage title={page.title} trail={[{ label: page.title }]}>
        <ContactLayout />
      </InnerPage>
    );
  }

  return (
    <InnerPage title={page.title} trail={[{ label: page.title }]}>
      <article className="mx-auto max-w-3xl bg-white p-6 shadow-sm sm:p-10">
        <div
          className="text-[15px] leading-7 text-gray-600 [&_a]:text-[#008000] [&_a]:underline [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </InnerPage>
  );
}
