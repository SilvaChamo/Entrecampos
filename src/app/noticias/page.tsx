'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

interface Post {
  id: string;
  title: string;
  category: string;
  date: string;
  image_url: string;
  slug: string;
  summary?: string;
}

export default function ArchivePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllPosts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Erro ao carregar arquivo:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAllPosts();
  }, []);

  return (
    <>
      <Header />
      
      <main className="bg-gray-50 min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-7xl">
          
          {/* Cabeçalho do Arquivo */}
          <div className="mb-10">
            <div className="flex items-center text-xs text-gray-500 font-medium mb-4 uppercase tracking-wider">
              <Link href="/" className="hover:text-green-700">INÍCIO</Link>
              <ChevronRight className="w-3 h-3 mx-1" />
              <span className="text-green-700 font-bold">ARQUIVO DE NOTÍCIAS</span>
            </div>
            <h1 className="text-4xl font-black text-[#1d2327] border-l-8 border-green-700 pl-6 uppercase tracking-tight">
              Arquivo Geral
            </h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/noticias/${post.slug}`} className="group">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all border border-gray-100 h-full flex flex-col">
                    <div className="h-52 overflow-hidden relative">
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute bottom-4 left-4 bg-green-600 text-white text-[11px] font-bold px-3 py-1 uppercase rounded-sm">
                        {post.category}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-4 font-bold uppercase tracking-widest">
                        <Calendar className="w-3 h-3 text-red-600" />
                        {new Date(post.date).toLocaleDateString('pt-PT', { month:'long', day:'numeric', year:'numeric' })}
                      </div>
                      <h4 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-green-600 transition-colors line-clamp-2 leading-tight">
                        {post.title}
                      </h4>
                      <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1">
                        {post.summary || 'Veja os detalhes desta notícia importante do setor agrário em Moçambique.'}
                      </p>
                      <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-xs font-black text-green-700 uppercase tracking-widest">
                        <span>Ler mais</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}
