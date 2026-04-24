'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MediaLibrary from '@/components/Admin/MediaLibrary';
import { 
  X, 
  ImageIcon, 
  Upload, 
  Settings, 
  ChevronDown,
  Save,
  Eye,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function NewNewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    summary: '',
    category: 'agricultura',
    image_url: '',
    date: new Date().toISOString()
  });

  // Gerar slug automaticamente a partir do título
  useEffect(() => {
    if (!formData.slug && formData.title) {
      const generatedSlug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('news').upsert({
        ...formData,
        site_id: 'entrecampos'
      }, { onConflict: 'slug' });

      if (error) throw error;
      
      alert('Notícia guardada com sucesso!');
      router.push('/admin/noticias');
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-[#2c3338]">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/noticias" className="p-1 hover:bg-gray-200 rounded">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-normal">Adicionar nova notícia</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 space-y-4">
          <input 
            type="text" 
            placeholder="Adicionar título"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full h-12 px-4 text-xl border border-[#ccd0d4] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
          />
          
          <div className="bg-white border border-[#ccd0d4]">
            <div className="flex items-center gap-2 p-2 bg-[#f6f7f7] border-b border-[#ccd0d4]">
              <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm font-semibold px-2">Visual</button>
              <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm font-semibold px-2">Texto</button>
            </div>
            <textarea 
              placeholder="Escreva aqui o conteúdo da notícia..."
              required
              rows={20}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full p-4 outline-none resize-none text-[16px] leading-relaxed"
            />
          </div>

          <div className="bg-white border border-[#ccd0d4] p-4">
            <h3 className="font-bold text-sm mb-2">Resumo (Excerto)</h3>
            <textarea 
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              className="w-full p-2 border border-[#ccd0d4] outline-none focus:border-[#2271b1] text-sm"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[300px] space-y-4">
          {/* Publish Box */}
          <div className="bg-white border border-[#ccd0d4]">
            <div className="p-3 border-b border-[#ccd0d4] bg-[#f6f7f7] font-bold text-sm">Publicar</div>
            <div className="p-4 space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                <span className="font-bold">Rascunho</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Visibilidade:</span>
                <span className="font-bold">Público</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Publicar:</span>
                <span className="font-bold">Imediatamente</span>
              </div>
            </div>
            <div className="p-3 bg-[#f6f7f7] border-t border-[#ccd0d4] flex justify-between">
              <button type="button" className="text-[#d63638] text-sm hover:underline">Mover para o lixo</button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-4 py-1.5 bg-[#2271b1] text-white text-sm font-semibold rounded-[3px] hover:bg-[#135e96] disabled:opacity-50"
              >
                {loading ? 'A guardar...' : 'Publicar'}
              </button>
            </div>
          </div>

          {/* Categories Box */}
          <div className="bg-white border border-[#ccd0d4]">
            <div className="p-3 border-b border-[#ccd0d4] bg-[#f6f7f7] font-bold text-sm">Categorias</div>
            <div className="p-4 space-y-2">
              {['agricultura', 'comunidade', 'geral', 'economia'].map(cat => (
                <label key={cat} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input 
                    type="radio" 
                    name="category"
                    checked={formData.category === cat}
                    onChange={() => setFormData({...formData, category: cat})}
                  />
                  <span className="capitalize">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Featured Image Box */}
          <div className="bg-white border border-[#ccd0d4]">
            <div className="p-3 border-b border-[#ccd0d4] bg-[#f6f7f7] font-bold text-sm">Imagem de destaque</div>
            <div className="p-4 text-center">
              {formData.image_url ? (
                <div className="space-y-3">
                  <img src={formData.image_url} className="w-full h-auto border border-[#ccd0d4]" alt="" />
                  <button 
                    type="button" 
                    onClick={() => setIsMediaModalOpen(true)}
                    className="text-[#2271b1] text-sm hover:underline"
                  >
                    Substituir imagem
                  </button>
                  <br />
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, image_url: ''})}
                    className="text-[#d63638] text-sm hover:underline"
                  >
                    Remover imagem de destaque
                  </button>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setIsMediaModalOpen(true)}
                  className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-[#ccd0d4] text-[#2271b1] hover:bg-[#f6f7f7] transition-all"
                >
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Definir imagem de destaque</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Media Library Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded shadow-2xl flex flex-col relative">
            <button 
              onClick={() => setIsMediaModalOpen(false)}
              className="absolute top-4 right-4 z-[210] p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 overflow-hidden">
              <MediaLibrary 
                isModal 
                onSelect={(url) => {
                  setFormData({ ...formData, image_url: url });
                  setIsMediaModalOpen(false);
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
