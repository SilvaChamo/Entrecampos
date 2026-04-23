import fs from 'fs';
import path from 'path';

// Carregar posts do JSON
const postsPath = path.join(process.cwd(), 'data', 'posts.json');
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));

// Gerar parâmetros estáticos
export async function generateStaticParams() {
  return posts.map((post: any) => ({
    slug: post.slug,
  }));
}

// Obter post por slug
async function getPost(slug: string) {
  return posts.find((post: any) => post.slug === slug);
}

export default async function NoticiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return <div>Post não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-3xl mx-auto">
          <div className="mb-4">
            <span className="inline-block bg-entrecampos-brown text-white px-3 py-1 rounded-full text-sm">
              {post.category}
            </span>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 text-entrecampos-green">
            {post.title.replace(/<!\[CDATA\[|\]\]>/g, '')}
          </h1>
          
          <div className="flex items-center gap-4 text-gray-600 mb-6">
            <span>👤 {post.author}</span>
            <span>📅 {new Date(post.pubDate).toLocaleDateString('pt-PT')}</span>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
      </main>
      
      <footer className="bg-entrecampos-green text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2026 EntreCAMPOS - Agricultura Sustentável</p>
        </div>
      </footer>
    </div>
  );
}
