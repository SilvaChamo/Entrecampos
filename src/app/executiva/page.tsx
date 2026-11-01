import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Sprout, Users, Zap, Briefcase, Wrench, FileText, Settings, Lightbulb, ThumbsUp, List } from 'lucide-react';
import BannerWithSlider from '@/components/BannerWithSlider';
import SimpleHeader from '@/components/Layout/SimpleHeader';

async function getPosts() {
  const postsPath = path.join(process.cwd(), 'data', 'posts.json');
  const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
  return posts;
}

export default async function Home() {
  const posts = await getPosts();
  const recentPosts = posts.slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER SIMPLIFICADO - Fundo Branco */}
      <SimpleHeader />

      {/* BANNER HERO - Slider à esquerda, Texto à direita */}
      <BannerWithSlider posts={posts.slice(0, 5)} />

      {/* CARDS FLUTUANTES - Sobrepostos ao Banner */}
      <section className="relative -mt-20 z-20 container mx-auto px-4 mb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sprout className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Agricultura</h3>
            <p className="text-gray-600 text-sm">
              Técnicas modernas de cultivo sustentável e produtividade.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Comunidade</h3>
            <p className="text-gray-600 text-sm">
              Apoio aos produtores e desenvolvimento rural integrado.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Inovação</h3>
            <p className="text-gray-600 text-sm">
              Tecnologias e práticas inovadoras no setor agrário.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Agro-negócio</h3>
            <p className="text-gray-600 text-sm">
              Oportunidades de negócio e comercialização agrícola.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE FEATURES */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Comece a melhorar sua produção hoje!
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Wrench className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm pt-2">
                Equipamentos e ferramentas modernas para aumentar a produtividade.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm pt-2">
                Documentação e guias práticos para produtores rurais.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm pt-2">
                Configurações otimizadas para diferentes tipos de cultivo.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm pt-2">
                Ideias inovadoras para diversificação agrícola.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ThumbsUp className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm pt-2">
                Melhores práticas recomendadas por especialistas.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <List className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm pt-2">
                Listas e checklists para gestão eficiente da produção.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE NOTÍCIAS */}
      <section id="noticias" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Notícias Recentes
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post: any) => (
              <Link key={post.slug} href={`/noticias/${post.slug}`}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
                  {post.images && post.images.length > 0 && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.images[0]}
                        alt={post.title.replace(/<!\[CDATA\[|\]\]>/g, '')}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3">
                      {post.category}
                    </span>
                    <h4 className="text-lg font-bold mb-2 text-gray-800 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {post.title.replace(/<!\[CDATA\[|\]\]>/g, '')}
                    </h4>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {post.excerpt || post.content.substring(0, 100).replace(/<!\[CDATA\[|\]\]>/g, '')}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(post.pubDate).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER SIMPLES */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold mb-2">EntreCAMPOS</p>
          <p className="text-gray-400 text-sm">
            © 2026 EntreCAMPOS - Agricultura Sustentável em Moçambique
          </p>
        </div>
      </footer>
    </div>
  );
}
