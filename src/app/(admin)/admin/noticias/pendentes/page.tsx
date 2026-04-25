'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  AlertTriangle,
  Clock,
  Eye,
  Edit2
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  image_url: string;
  status: string;
  summary?: string;
  author_name?: string;
}

export default function PendingNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPendingNews = async () => {
    setLoading(true);
    try {
      // In a real app, we would filter by status = 'Pending'
      // For now, we'll fetch all and simulate some being pending
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Simulating pending status for demonstration
      const simulated = (data || []).map((item: any, idx: number) => ({
        ...item,
        status: idx < 3 ? 'Pending' : 'Published',
        author_name: idx < 2 ? 'Guest User' : 'Contribuidor A'
      })).filter((item: any) => item.status === 'Pending');

      setNews(simulated);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingNews();
  }, []);

  const publishNews = async (id: string) => {
    try {
      // Logic to update status to 'Published'
      alert('Notícia publicada com sucesso!');
      setNews(news.filter(n => n.id !== id));
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-normal flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-500" />
            Notícias Pendentes de Revisão
          </h1>
          <p className="text-sm text-gray-500 mt-1">Artigos submetidos por visitantes e contribuidores que aguardam aprovação.</p>
        </div>
      </div>

      <div className="bg-white border border-[#ccd0d4] rounded-md overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-white text-left font-bold border-b border-[#ccd0d4] text-[#2c3338]">
              <th className="p-4 w-10 text-center"><input type="checkbox" /></th>
              <th className="p-4">Artigo</th>
              <th className="p-4 w-40">Autor</th>
              <th className="p-4 w-40">Data de Submissão</th>
              <th className="p-4 w-48 text-right">Acções</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center"><RefreshCw className="w-8 h-8 animate-spin text-[#2271b1] mx-auto" /></td></tr>
            ) : news.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-500 py-20">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-20" />
                Não existem notícias pendentes de momento.
              </td></tr>
            ) : (
              news.map((item) => (
                <tr key={item.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7] group">
                  <td className="p-4 text-center"><input type="checkbox" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      {item.image_url ? (
                        <img src={item.image_url} className="w-12 h-12 object-cover border border-gray-200" alt="" />
                      ) : (
                        <div className="w-12 h-12 bg-amber-50 border border-amber-200 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                      )}
                      <div>
                        <Link href={`/admin/noticias/editar/${item.id}`} className="text-[#2271b1] font-bold text-[14px] hover:underline block">
                          {item.title}
                        </Link>
                        <span className="text-[11px] text-gray-400 capitalize">{item.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#50575e] font-medium">{item.author_name}</td>
                  <td className="p-4 text-[#50575e]">
                    {new Date(item.date).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => publishNews(item.id)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-md text-[12px] font-bold hover:bg-green-700 transition-colors inline-flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Publicar
                    </button>
                    <Link 
                      href={`/admin/noticias/editar/${item.id}`}
                      className="px-3 py-1.5 bg-white border border-[#ccd0d4] text-[#2c3338] rounded-md text-[12px] font-bold hover:bg-[#f6f7f7] transition-colors inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" /> Rever
                    </Link>
                    <button className="p-1.5 text-[#d63638] hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-[13px] text-gray-500">
        {news.length} artigos aguardando revisão
      </div>
    </div>
  );
}
