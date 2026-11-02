import CommentForm from '@/components/Comments/CommentForm';

type Comment = { id: string; name: string; website: string | null; content: string; created_at: string };

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

/** Só os comentários aprovados (a base já filtra por política de leitura). Sem tabela ou sem rede: lista vazia. */
async function approvedComments(slug: string): Promise<Comment[]> {
  if (!URL_ || !KEY) return [];
  try {
    const res = await fetch(
      `${URL_}/rest/v1/comments?select=id,name,website,content,created_at&news_slug=eq.${encodeURIComponent(slug)}&status=eq.approved&order=created_at.asc&limit=200`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(8000), next: { revalidate: 30, tags: ["comments"] } },
    );
    return res.ok ? ((await res.json()) as Comment[]) : [];
  } catch {
    return [];
  }
}

function when(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Maputo' });
  const time = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Maputo' });
  return `${date} às ${time}`;
}

/** Comentários no estilo do WordPress: lista dos aprovados e o formulário "Deixe um comentário". */
export default async function CommentsSection({ slug, title }: { slug: string; title: string }) {
  const comments = await approvedComments(slug);
  const heading = (text: string) => (
    <h3 className="border-b border-gray-200 pb-3 text-[18px] font-bold text-[#1a3d0c]">{text}</h3>
  );

  return (
    <section id="comentarios" className="mt-10">
      {comments.length > 0 && (
        <>
          {heading(`${comments.length} ${comments.length === 1 ? 'comentário' : 'comentários'} em “${title}”`)}
          <ol className="mt-4 divide-y divide-gray-100">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3 py-4">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0c1f08] text-[16px] font-bold uppercase text-[#39ff14]">
                  {c.name.trim().charAt(0) || '?'}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-gray-800">
                    {c.website ? (
                      <a href={c.website} rel="nofollow ugc noopener noreferrer" target="_blank" className="hover:text-[#d6101c]">
                        {c.name}
                      </a>
                    ) : (
                      c.name
                    )}
                  </p>
                  <p className="text-[12px] text-gray-400">{when(c.created_at)}</p>
                  <p className="mt-2 whitespace-pre-line break-words text-[14px] leading-6 text-gray-600">{c.content}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      <div className={comments.length > 0 ? 'mt-8' : ''}>
        {heading('Deixe um comentário')}
        <CommentForm slug={slug} />
      </div>
    </section>
  );
}
