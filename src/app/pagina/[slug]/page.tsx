import { notFound } from 'next/navigation';
import InnerPage from '@/components/Expnews/InnerPage';
import { getStaticPage } from '@/lib/news-data';

export const revalidate = 3600;

export default async function PaginaPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = getStaticPage((await params).slug);
  if (!page) notFound();

  return (
    <InnerPage>
      <article className="mx-auto max-w-3xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="mb-6 border-l-[3px] border-red-600 pl-3 text-[24px] font-bold uppercase text-gray-800">{page.title}</h1>
        <div
          className="text-[15px] leading-7 text-gray-600 [&_a]:text-[#008000] [&_a]:underline [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </InnerPage>
  );
}
