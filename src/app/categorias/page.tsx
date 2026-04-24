'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChevronRight, 
  Newspaper,
  Sprout,
  Users,
  TreePine,
  Palmtree,
  Flower2,
  HelpCircle,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import HeaderOld from '@/components/Layout/HeaderOld';
import Footer from '@/components/Layout/Footer';

interface Category {
  name: string;
  slug: string;
  description: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

const categoriesData: Category[] = [
  {
    name: 'Agricultura',
    slug: 'agricultura',
    description: 'Notícias e artigos sobre agricultura sustentável, técnicas de cultivo e inovações no campo.',
    count: 0,
    icon: <Sprout className="w-8 h-8" />,
    color: 'bg-green-600',
  },
  {
    name: 'Agro-negócio',
    slug: 'agro-negocio',
    description: 'Informações sobre o setor agrário, negócios e oportunidades de investimento.',
    count: 0,
    icon: <Briefcase className="w-8 h-8" />,
    color: 'bg-blue-600',
  },
  {
    name: 'Comunidade',
    slug: 'comunidade',
    description: 'Histórias e experiências das comunidades rurais e agricultores locais.',
    count: 0,
    icon: <Users className="w-8 h-8" />,
    color: 'bg-orange-600',
  },
  {
    name: 'Ambiente',
    slug: 'ambiente',
    description: 'Notícias sobre preservação ambiental, sustentabilidade e mudanças climáticas.',
    count: 0,
    icon: <TreePine className="w-8 h-8" />,
    color: 'bg-emerald-600',
  },
  {
    name: 'Turismo Rural',
    slug: 'turismo-rural',
    description: 'Descubra destinos turísticos rurais, ecoturismo e experiências no campo.',
    count: 0,
    icon: <Palmtree className="w-8 h-8" />,
    color: 'bg-teal-600',
  },
  {
    name: 'Mulher Agrário',
    slug: 'mulher-agrario',
    description: 'Histórias inspiradoras de mulheres no setor agrário e suas contribuições.',
    count: 0,
    icon: <Flower2 className="w-8 h-8" />,
    color: 'bg-pink-600',
  },
  {
    name: 'Curiosidade',
    slug: 'curiosidade',
    description: 'Curiosidades, fatos interessantes e dicas sobre o mundo agrícola.',
    count: 0,
    icon: <HelpCircle className="w-8 h-8" />,
    color: 'bg-purple-600',
  },
];

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>(categoriesData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryCounts() {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('category');

        if (error) throw error;

        if (data) {
          const counts: { [key: string]: number } = {};
          data.forEach((item: { category: string }) => {
            const cat = item.category;
            counts[cat] = (counts[cat] || 0) + 1;
          });

          setCategories(prev => 
            prev.map(cat => ({
              ...cat,
              count: counts[cat.name] || 0
            }))
          );
        }
      } catch (err) {
        console.error('Erro ao carregar contagem:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryCounts();
  }, []);

  return (
    <>
      <HeaderOld />
      
      <main className="bg-gray-50 min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-7xl">
          
          {/* Breadcrumb */}
          <div className="flex items-center text-xs text-gray-500 font-medium mb-6 uppercase tracking-wider">
            <Link href="/" className="hover:text-green-700">INÍCIO</Link>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-gray-400">CATEGORIAS</span>
          </div>

          {/* Título */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-[#1d2327] mb-2">
              Categorias
            </h1>
            <p className="text-gray-600">
              Explore todas as categorias de conteúdo do EntreCampos
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            
            {/* Conteúdo Principal - Cards de Categorias */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/categoria/${category.slug}`}
                    className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`${category.color} text-white p-3 rounded-xl`}>
                          {category.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors mb-2">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {category.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {category.count} {category.count === 1 ? 'artigo' : 'artigos'}
                            </span>
                            <span className="text-green-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                              Ver mais <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Barra Lateral Compacta */}
            <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
              
              {/* Widget Últimas Notícias */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-green-600" />
                  Últimas Notícias
                </h3>
                <UltimasNoticias />
              </div>

              {/* Widget Newsletter */}
              <div className="bg-[#1d2327] rounded-xl p-5 text-white">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3">
                  Newsletter
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Receba as últimas notícias no seu email
                </p>
                <input
                  type="email"
                  placeholder="Seu email"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm mb-2 focus:outline-none focus:border-green-500"
                />
                <button className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  Subscrever
                </button>
              </div>

            </aside>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}

// Componente para carregar últimas notícias
function UltimasNoticias() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function loadPosts() {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('date', { ascending: false })
          .limit(5);

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Erro:', err);
      }
    }

    loadPosts();
  }, []);

  if (posts.length === 0) {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/noticias/${post.slug}`}
          className="flex gap-3 group"
        >
          <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-800 group-hover:text-green-700 transition-colors line-clamp-2">
              {post.title}
            </h4>
            <span className="text-xs text-gray-500">{post.category}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
