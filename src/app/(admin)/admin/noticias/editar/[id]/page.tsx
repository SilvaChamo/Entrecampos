'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MediaLibrary from '@/components/Admin/MediaLibrary';
import ImageSelector from '@/components/Admin/ImageSelector';
import { 
  X, 
  ImageIcon, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function EditNewsPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    slug: '',
    content: '',
    summary: '',
    category: 'geral',
    image_url: '',
    date: ''
  });

  useEffect(() => {
    const fetchNews = async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        alert('Erro ao carregar notícia');
        router.push('/admin/noticias');
        return;
      }

      setFormData(data);
      setLoading(false);
    };

    if (id) fetchNews();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('news')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      
      alert('Notícia atualizada com sucesso!');
      router.push('/admin/noticias');
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-10 h-10 animate-spin text-[#2271b1]" />
      </div>
    );
  }

  return (
    <div className="text-[#2c3338]">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/noticias" className="p-1 hover:bg-gray-200 rounded">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-normal">Editar notícia</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <input 
            type="text" 
            placeholder="Título"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full h-12 px-4 text-xl border border-[#ccd0d4] outline-none focus:border-[#2271b1]"
          />
          
          <div className="bg-white border border-[#ccd0d4]">
            <div className="p-2 bg-[#f6f7f7] border-b border-[#ccd0d4] text-sm font-semibold">Conteúdo</div>
            <textarea 
              required
              rows={20}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full p-4 outline-none resize-none text-[16px] leading-relaxed"
            />
          </div>

          <div className="bg-white border border-[#ccd0d4] p-4">
            <h3 className="font-bold text-sm mb-2">Resumo</h3>
            <textarea 
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              className="w-full p-2 border border-[#ccd0d4] outline-none text-sm"
            />
          </div>
        </div>

        <div className="w-full lg:w-[300px] space-y-4">
          <div className="bg-white border border-[#ccd0d4]">
            <div className="p-3 bg-[#f6f7f7] border-b border-[#ccd0d4] font-bold text-sm">Publicar</div>
            <div className="p-4 text-[13px] space-y-2">
              <p>Estado: <strong>Publicado</strong></p>
              <p>Data: <strong>{new Date(formData.date).toLocaleDateString('pt-PT')}</strong></p>
            </div>
            <div className="p-3 bg-[#f6f7f7] border-t border-[#ccd0d4] flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="px-4 py-1.5 bg-[#2271b1] text-white text-sm font-semibold rounded-[3px] hover:bg-[#135e96] disabled:opacity-50"
              >
                {saving ? 'A atualizar...' : 'Atualizar'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#ccd0d4]">
            <div className="p-3 bg-[#f6f7f7] border-b border-[#ccd0d4] font-bold text-sm">Imagem de destaque</div>
            <div className="p-4 text-center">
              {formData.image_url ? (
                <div className="space-y-3">
                  <img src={formData.image_url} className="w-full h-auto border border-[#ccd0d4]" alt="" />
                  <button 
                    type="button" 
                    onClick={() => setIsImageSelectorOpen(true)} 
                    className="text-[#2271b1] text-sm hover:underline"
                  >
                    Substituir imagem
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setIsImageSelectorOpen(true)} className="w-full aspect-video border-2 border-dashed border-[#ccd0d4] flex flex-col items-center justify-center text-[#2271b1] hover:bg-[#f6f7f7]">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm">Definir imagem</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Image Selector Modal */}
      {isImageSelectorOpen && (
        <ImageSelector 
          onClose={() => setIsImageSelectorOpen(false)}
          onSelect={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
          currentImageUrl={formData.image_url}
        />
      )}
    </div>
  );
}
