import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Sprout, Users, Zap, Briefcase, Wrench, FileText, Settings, Lightbulb, ThumbsUp, List } from 'lucide-react';

async function getPosts() {
  const postsPath = path.join(process.cwd(), 'data', 'posts.json');
  const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
  return posts;
}

export default async function Inicio() {
  const posts = await getPosts();
  const recentPosts = posts.slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      {/* BANNER HERO - Estilo Original */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex items-start pt-[100px]">
          <div className="max-w-2xl">
            <h1 className="font-bold text-white mb-4" style={{ fontSize: '50px', lineHeight: '1.2' }}>
              Agricultura Sustentável!
            </h1>
            <p className="text-gray-200 text-lg md:text-xl mb-8 max-w-xl">
              Promovendo o desenvolvimento agrícola em Moçambique através de informação, capacitação e inovação tecnológica.
            </p>
            <Link 
              href="#noticias"
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded font-semibold transition-colors"
            >
              EXPLORAR NOTÍCIAS
            </Link>
          </div>
        </div>

        {/* Dots Navigation */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <span className="w-3 h-3 rounded-full bg-white/50" />
          <span className="w-3 h-3 rounded-full bg-white/50" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>
      </section>

      {/* CARDS FLUTUANTES */}
      <section className="relative -mt-20 z-20 container mx-auto px-4 mb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sprout className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Agricultura</h3>
            <p className="text-gray-600 text-sm">Técnicas modernas de cultivo sustentável.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Comunidade</h3>
            <p className="text-gray-600 text-sm">Apoio aos produtores rurais.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Inovação</h3>
            <p className="text-gray-600 text-sm">Tecnologias agrícolas modernas.</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Agro-negócio</h3>
            <p className="text-gray-600 text-sm">Oportunidades de negócio.</p>
          </div>
        </div>
      </section>

      {/* NOTÍCIAS */}
      <section id="noticias" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Notícias Recentes</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post: any) => (
              <Link key={post.slug} href={`/noticias/${post.slug}`}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
                  {post.images && post.images.length > 0 && (
                    <div className="h-48 overflow-hidden">
                      <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3">{post.category}</span>
                    <h4 className="text-lg font-bold mb-2 text-gray-800 line-clamp-2">{post.title.replace(/<!\[CDATA\[|\]\]>/g, '')}</h4>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.excerpt || post.content.substring(0, 100).replace(/<!\[CDATA\[|\]\]>/g, '')}</p>
                    <p className="text-gray-400 text-xs">{new Date(post.pubDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
