import fs from 'fs';
import path from 'path';
import Link from 'next/link';

// Carregar posts do JSON
const postsPath = path.join(process.cwd(), 'data', 'posts.json');
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));

// Gerar parâmetros estáticos - extrair categorias únicas
export async function generateStaticParams() {
  const categories = [...new Set(posts.map((post: any) => post.category))] as string[];
  return categories.map((category) => ({
    slug: category.toLowerCase().replace(/\s+/g, '-'),
  }));
}

// Obter posts por categoria
async function getPostsByCategory(categorySlug: string) {
  const categoryName = categorySlug.replace(/-/g, ' ');
  return posts.filter((post: any) => 
    post.category.toLowerCase() === categoryName.toLowerCase()
  );
}

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categoryPosts = await getPostsByCategory(slug);
  const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (categoryPosts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-200">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Categoria não encontrada</h1>
          <p className="text-gray-600 mb-8">Não há artigos nesta categoria.</p>
          <Link 
            href="/" 
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-green-800">{categoryName}</h1>
              <p className="text-gray-600">{categoryPosts.length} artigos</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {categoryPosts.map((post: any) => (
                <Link
                  key={post.slug}
                  href={`/noticias/${post.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {post.images && post.images.length > 0 && (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={post.images[0]}
                        alt={post.title.replace(/<!\[CDATA\[|\]\]>/g, '')}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="inline-block bg-entrecampos-brown text-white px-2 py-1 rounded text-xs mb-3">
                      {post.category}
                    </span>
                    <h2 className="text-xl font-bold mb-2 text-entrecampos-green line-clamp-2">
                      {post.title.replace(/<!\[CDATA\[|\]\]>/g, '')}
                    </h2>
                    <p className="text-gray-600 text-sm mb-3">
                      {new Date(post.pubDate).toLocaleDateString('pt-PT')}
                    </p>
                    {post.excerpt && (
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {post.excerpt.replace(/<!\[CDATA\[|\]\]>/g, '')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar Direita */}
          <aside>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4 text-green-800 border-b-2 border-green-600 pb-2">
                Categorias
              </h3>
              <ul className="space-y-2">
                {[...new Set(posts.map((post: any) => post.category))].map((category: unknown) => {
                  const cat = category as string;
                  return (
                    <li key={cat}>
                      <Link
                        href={`/categoria/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block px-3 py-2 rounded hover:bg-green-600 hover:text-white transition-colors text-gray-700"
                      >
                        {cat}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-green-700 text-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-xl font-bold mb-3">Sobre EntreCAMPOS</h3>
              <p className="text-green-100 text-sm">
                Promovendo a agricultura sustentável e o desenvolvimento rural em Moçambique através de informação, capacitação e inovação.
              </p>
            </div>
          </aside>
        </div>
      </main>
      
      <footer className="bg-entrecampos-green text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2026 EntreCAMPOS - Agricultura Sustentável</p>
        </div>
      </footer>
    </div>
  );
}
