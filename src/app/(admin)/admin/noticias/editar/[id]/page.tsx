'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, SITE_ID } from '@/lib/supabase';
import NewsForm from '@/components/Admin/NewsForm';
import { RefreshCw } from 'lucide-react';

export default function EditNewsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [newsData, setNewsData] = useState<any>(null);

  useEffect(() => {
    const fetchNews = async () => {
      // Só notícias deste site (a tabela news é partilhada por vários sites).
      const { data: ecData } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .eq('site_id', SITE_ID)
        .single();

      if (ecData) {
        setNewsData(ecData);
        setLoading(false);
        return;
      }

      alert('Notícia não encontrada');
      router.push('/admin/noticias');
    };

    if (id) fetchNews();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-10 h-10 animate-spin text-[#2271b1]" />
      </div>
    );
  }

  return <NewsForm initialData={newsData} isEdit={true} />;
}
