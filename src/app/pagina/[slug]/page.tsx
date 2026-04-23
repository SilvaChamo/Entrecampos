import fs from 'fs';
import path from 'path';
import Link from 'next/link';

// Carregar páginas do JSON
const pagesPath = path.join(process.cwd(), 'data', 'pages.json');
const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));

// Gerar parâmetros estáticos
export async function generateStaticParams() {
  return pages.map((page: any) => ({
    slug: page.slug,
  }));
}

// Obter página por slug
async function getPage(slug: string) {
  return pages.find((page: any) => page.slug === slug);
}

export default async function PaginaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return <div>Página não encontrada</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-entrecampos-green">
            {page.title.replace(/<!\[CDATA\[|\]\]>/g, '')}
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
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
