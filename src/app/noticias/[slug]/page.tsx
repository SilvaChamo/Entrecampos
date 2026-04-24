'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  User, 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Printer, 
  Mail,
  ChevronRight
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  image_url: string;
  author?: string;
  slug: string;
}

export default function SinglePostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        setPost(data);

        // Carregar relacionados
        if (data) {
          const { data: related } = await supabase
            .from('news')
            .select('*')
            .eq('category', data.category)
            .neq('id', data.id)
            .limit(4);
          setRelatedPosts(related || []);
        }
      } catch (err) {
        console.error('Erro ao carregar post:', err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) loadPost();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center">Notícia não encontrada.</div>;

  return (
    <>
      <Header />
      
      <main className="bg-white py-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-10">
            
            {/* Conteúdo Principal */}
            <div className="flex-1">
              {/* Categorias e Breadcrumb */}
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-green-700 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  {post.category}
                </span>
                <span className="text-gray-300">/</span>
                <div className="flex items-center text-xs text-gray-500 font-medium">
                  <Link href="/" className="hover:text-green-700">INÍCIO</Link>
                  <ChevronRight className="w-3 h-3 mx-1" />
                  <span className="text-gray-400">{post.title}</span>
                </div>
              </div>

              {/* Título */}
              <h1 className="text-3xl md:text-4xl font-bold text-[#1d2327] mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta Info */}
              <div className="flex items-center gap-6 text-sm text-gray-400 mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <span>{new Date(post.date).toLocaleDateString('pt-PT', { day:'numeric', month:'long', year:'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600" />
                  <span>{post.author || 'admin'}</span>
                </div>
              </div>

              {/* Imagem de Destaque */}
              {post.image_url && (
                <div className="mb-10 rounded-lg overflow-hidden shadow-lg border border-gray-100">
                  <img src={post.image_url} alt={post.title} className="w-full object-cover" />
                </div>
              )}

              {/* Corpo da Notícia */}
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-12">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>

              {/* Partilhar */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h4 className="text-lg font-bold text-green-700 mb-6 uppercase tracking-widest border-l-4 border-green-700 pl-4">Partilhar</h4>
                <div className="flex flex-wrap gap-3">
                  <button className="w-10 h-10 rounded-full bg-[#25d366] text-white flex items-center justify-center hover:opacity-90 transition-all"><Share2 className="w-5 h-5" /></button>
                  <button className="w-10 h-10 rounded-full bg-[#1877f2] text-white flex items-center justify-center hover:opacity-90 transition-all"><Facebook className="w-5 h-5" /></button>
                  <button className="w-10 h-10 rounded-full bg-[#0077b5] text-white flex items-center justify-center hover:opacity-90 transition-all"><Linkedin className="w-5 h-5" /></button>
                  <button className="w-10 h-10 rounded-full bg-[#1da1f2] text-white flex items-center justify-center hover:opacity-90 transition-all"><Twitter className="w-5 h-5" /></button>
                  <button className="w-10 h-10 rounded-full bg-[#bd081c] text-white flex items-center justify-center hover:opacity-90 transition-all"><Mail className="w-5 h-5" /></button>
                  <button className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center hover:opacity-90 transition-all"><Printer className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Comentários Mockup */}
              <div className="mt-16 bg-gray-50 p-8 rounded-lg border border-gray-100">
                <h3 className="text-2xl font-bold mb-6">Deixe um comentário</h3>
                <p className="text-sm text-gray-500 mb-6">Sessão iniciada como admin. <span className="text-green-600">Editar perfil. Sair?</span> Campos obrigatórios marcados com *</p>
                <textarea className="w-full h-40 p-4 border border-gray-300 rounded mb-4 outline-none focus:border-green-700" placeholder="Comentário *"></textarea>
                <button className="px-6 py-3 border-2 border-pink-500 text-pink-500 font-bold rounded hover:bg-pink-500 hover:text-white transition-all uppercase text-sm">Publicar comentário</button>
              </div>
            </div>

            {/* BARRA LATERAL (Sidebar) */}
            <aside className="w-full lg:w-80 flex flex-shrink-0 flex-col gap-10">
              
              {/* Widget Receitas */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden">
                <div className="bg-white border-l-4 border-red-600 p-4">
                  <h4 className="text-red-600 font-bold uppercase text-sm tracking-widest">Receitas</h4>
                </div>
                <div className="p-4">
                  <div className="relative h-48 rounded overflow-hidden group">
                    <img src="https://entrecampos.co.mz/wp-content/uploads/2023/02/WRAP-300x200.jpg" className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Wrap" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="bg-green-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase mb-2 inline-block">Receitas</span>
                      <h5 className="text-white font-bold text-sm leading-tight">Wrap de vegetais com polpa de mafpilwa</h5>
                      <span className="text-white/80 text-[10px] mt-1 block">Fevereiro 2, 2023</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget Facebook */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden">
                <div className="bg-white border-l-4 border-red-600 p-4">
                  <h4 className="text-red-600 font-bold uppercase text-sm tracking-widest">Facebook</h4>
                </div>
                <div className="p-4 bg-gray-50 h-64 flex items-center justify-center border-t border-gray-100">
                  <div className="text-center">
                    <Facebook className="w-12 h-12 text-blue-600 mx-auto mb-2 opacity-20" />
                    <span className="text-xs text-gray-400">Facebook Page Plugin</span>
                  </div>
                </div>
              </div>

              {/* Widget Publicidade */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden">
                <div className="bg-white border-l-4 border-red-600 p-4">
                  <h4 className="text-red-600 font-bold uppercase text-sm tracking-widest">Publicidade</h4>
                </div>
                <div className="p-4 flex justify-center">
                  <img src="https://entrecampos.co.mz/wp-content/uploads/2023/04/AD-BANNER.jpg" className="w-full h-auto rounded" alt="Ad" />
                </div>
              </div>

            </aside>
          </div>

          {/* TAMBÉM PODE LER */}
          <section className="mt-20">
            <h3 className="text-xl font-bold text-green-700 uppercase tracking-widest mb-10 flex items-center gap-4">
              <span className="w-1 h-8 bg-red-600"></span>
              TAMBÉM PODE LER
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedPosts.map(rel => (
                <Link key={rel.id} href={`/noticias/${rel.slug}`} className="group">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all border border-gray-100 h-full flex flex-col">
                    <div className="h-40 overflow-hidden relative">
                      <img src={rel.image_url} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute bottom-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase">
                        {rel.category}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="text-sm font-bold text-gray-800 mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                      <div className="mt-auto flex items-center gap-2 text-[10px] text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(rel.date).toLocaleDateString('pt-PT', { month:'long', day:'numeric', year:'numeric' })}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}
