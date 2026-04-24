'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MediaLibrary from '@/components/Admin/MediaLibrary';
import ImageSelector from '@/components/Admin/ImageSelector';
import { 
  X, 
  ImageIcon, 
  ArrowLeft,
  Image as ImageIconWP,
  Key,
  Eye,
  Calendar,
  ChevronUp,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Minus,
  Upload,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';

export default function NewNewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    summary: '',
    category: 'agricultura',
    image_url: '',
    date: new Date().toISOString()
  });

  const CATEGORIES = [
    'Fruticultura', 'Gestão agrícola', 'Histórias inspiradoras', 
    'Inclusao feminina', 'Infra-estruturas', 'Inovação', 'Agricultura', 'Comunidade'
  ];

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
    <div className="text-[#2c3338] max-w-[1200px] mx-auto pb-20">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Adicionar artigo</h1>
        <button className="px-3 py-1 bg-[#f6f7f7] border border-[#ccd0d4] text-[#2271b1] rounded-[4px] text-sm hover:bg-[#f0f0f1] transition-all ml-auto">
          Opções deste ecrã ▼
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-5">
        {/* Main Content Area */}
        <div className="flex-1 space-y-5">
          <input 
            type="text" 
            placeholder="Adicionar título"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full h-[50px] px-3 text-[1.4rem] bg-white border border-[#8c8f94] rounded-[8px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
          />

          <button 
            type="button" 
            className="h-9 px-4 bg-[#2271b1] text-white rounded-[8px] text-[13px] flex items-center gap-2 hover:bg-[#135e96] font-medium"
          >
            <span className="flex items-center justify-center w-4 h-4 bg-white text-[#2271b1] rounded-full text-[10px] font-bold">E</span>
            Editar com o Elementor
          </button>
          
          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden">
            {/* Top Toolbar */}
            <div className="bg-[#f0f0f1] p-2 flex items-center justify-between border-b border-[#ccd0d4]">
              <button 
                type="button" 
                onClick={() => setIsImageSelectorOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[#2c3338] hover:text-[#2271b1] border border-transparent hover:border-[#8c8f94] hover:bg-white rounded text-[13px] font-medium transition-all"
              >
                <ImageIconWP className="w-4 h-4" />
                Adicionar multimédia
              </button>
              
              <div className="flex bg-white border border-[#ccd0d4] rounded overflow-hidden text-[13px]">
                <button type="button" className="px-3 py-1 bg-[#f6f7f7] text-[#2c3338] border-r border-[#ccd0d4] font-medium">Visual</button>
                <button type="button" className="px-3 py-1 text-[#2271b1] hover:text-[#135e96]">Código</button>
              </div>
            </div>

            {/* WP TinyMCE Toolbar */}
            <div className="bg-[#f6f7f7] p-1.5 border-b border-[#ccd0d4] flex items-center gap-0.5 text-gray-600 flex-wrap">
              <select className="h-7 border border-[#ccd0d4] rounded bg-white text-[13px] px-1 mr-1">
                <option>Parágrafo</option>
                <option>Cabeçalho 1</option>
                <option>Cabeçalho 2</option>
              </select>
              <div className="w-px h-5 bg-[#ccd0d4] mx-1"></div>
              <button type="button" className="p-1.5 hover:bg-white hover:text-[#2271b1] hover:border-[#ccd0d4] border border-transparent rounded"><Bold className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 hover:bg-white hover:text-[#2271b1] hover:border-[#ccd0d4] border border-transparent rounded"><Italic className="w-4 h-4" /></button>
              <div className="w-px h-5 bg-[#ccd0d4] mx-1"></div>
              <button type="button" className="p-1.5 hover:bg-white hover:text-[#2271b1] hover:border-[#ccd0d4] border border-transparent rounded"><List className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 hover:bg-white hover:text-[#2271b1] hover:border-[#ccd0d4] border border-transparent rounded"><ListOrdered className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 hover:bg-white hover:text-[#2271b1] hover:border-[#ccd0d4] border border-transparent rounded"><Quote className="w-4 h-4" /></button>
              <div className="w-px h-5 bg-[#ccd0d4] mx-1"></div>
              <button type="button" className="p-1.5 hover:bg-white hover:text-[#2271b1] hover:border-[#ccd0d4] border border-transparent rounded"><AlignLeft className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 hover:bg-white hover:text-[#2271b1] hover:border-[#ccd0d4] border border-transparent rounded"><AlignCenter className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 hover:bg-white hover:text-[#2271b1] hover:border-[#ccd0d4] border border-transparent rounded"><AlignRight className="w-4 h-4" /></button>
              <div className="w-px h-5 bg-[#ccd0d4] mx-1"></div>
              <button type="button" className="p-1.5 hover:bg-white hover:text-[#2271b1] hover:border-[#ccd0d4] border border-transparent rounded"><LinkIcon className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 hover:bg-white hover:text-[#2271b1] hover:border-[#ccd0d4] border border-transparent rounded"><Minus className="w-4 h-4" /></button>
            </div>

            <textarea 
              placeholder=""
              required
              rows={16}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full p-4 outline-none resize-vertical text-[15px] leading-[1.6]"
            />
            
            <div className="bg-[#f0f0f1] px-3 py-1 border-t border-[#ccd0d4] text-[12px] text-[#50575e]">
              Contagem de palavras: {formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0}
            </div>
          </div>

          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden">
            <div className="p-3 border-b border-[#ccd0d4] bg-white flex justify-between items-center cursor-pointer">
              <h2 className="font-semibold text-[14px] text-[#1d2327]">Excerto</h2>
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </div>
            <div className="p-4 bg-white">
              <textarea 
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                className="w-full p-2 border border-[#8c8f94] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] text-[14px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[280px] space-y-5">
          
          {/* Featured Image Box (Moved to top like the screenshot) */}
          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden shadow-sm">
            <div className="p-2.5 border-b border-[#ccd0d4] bg-white flex justify-between items-center cursor-pointer">
              <h2 className="font-semibold text-[14px] text-[#1d2327]">Imagem de destaque</h2>
              <div className="flex gap-1">
                <ChevronUp className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            <div className="p-3">
              {formData.image_url ? (
                <div className="space-y-3">
                  <img src={formData.image_url} className="w-full h-auto border border-[#ccd0d4]" alt="" />
                  <button 
                    type="button" 
                    onClick={() => setIsImageSelectorOpen(true)}
                    className="text-[#2271b1] text-[13px] hover:underline underline-offset-2"
                  >
                    Substituir imagem
                  </button>
                  <br />
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, image_url: ''})}
                    className="text-[#d63638] text-[13px] hover:underline underline-offset-2"
                  >
                    Remover imagem de destaque
                  </button>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setIsImageSelectorOpen(true)}
                  className="text-[#2271b1] text-[13px] hover:text-[#135e96] underline underline-offset-2 text-left"
                >
                  Definir imagem de destaque
                </button>
              )}
            </div>
          </div>

          {/* Publish Box */}
          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden shadow-sm">
            <div className="p-2.5 border-b border-[#ccd0d4] bg-white flex justify-between items-center cursor-pointer">
              <h2 className="font-semibold text-[14px] text-[#1d2327]">Publicar</h2>
              <div className="flex gap-1">
                <ChevronUp className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            <div className="p-3 bg-white">
              <div className="flex gap-2 mb-4">
                <button 
                  type="button" 
                  className="flex-1 px-3 py-2 text-[13px] border border-[#2271b1] text-[#2271b1] rounded-[4px] bg-[#f6f7f7] hover:bg-white font-medium transition-colors"
                >
                  Guardar rascunho
                </button>
                <button 
                  type="button" 
                  className="flex-1 px-3 py-2 text-[13px] border border-[#2271b1] text-[#2271b1] rounded-[4px] bg-[#f6f7f7] hover:bg-white font-medium transition-colors"
                >
                  Pré-visualizar
                </button>
              </div>

              <div className="space-y-2.5 text-[13px] text-[#50575e] mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-400" />
                  <span>Estado: <strong>Rascunho</strong></span>
                  <button type="button" className="text-[#2271b1] ml-1 underline underline-offset-2">Editar</button>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span>Visibilidade: <strong>Público</strong></span>
                  <button type="button" className="text-[#2271b1] ml-1 underline underline-offset-2">Editar</button>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Publicar <strong>imediatamente</strong></span>
                  <button type="button" className="text-[#2271b1] ml-1 underline underline-offset-2">Editar</button>
                </div>
              </div>
              
              {/* Fake toggle for visual match */}
              <div className="flex items-center gap-2 text-[13px] mb-4 border-t border-[#f0f0f1] pt-3">
                <div className="w-8 h-4 bg-gray-300 rounded-full relative flex items-center p-0.5">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span className="text-gray-600">Lock Modified Date</span>
              </div>
            </div>
            
            <div className="bg-[#fef2f2] p-2 border-t border-[#ccd0d4] border-b">
              <div className="text-[12px] font-bold text-[#d63638] flex items-center gap-1">
                <span className="w-3 h-3 block bg-[#d63638]"></span>
                SEO: 0 / 100
              </div>
            </div>

            <div className="p-3 bg-[#f6f7f7] flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="px-5 py-1.5 bg-[#2271b1] text-white text-[13px] font-medium rounded-[4px] hover:bg-[#135e96] disabled:opacity-50"
              >
                {loading ? 'A guardar...' : 'Publicar'}
              </button>
            </div>
          </div>

          {/* Categories Box */}
          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden shadow-sm">
            <div className="p-2.5 border-b border-[#ccd0d4] bg-white flex justify-between items-center cursor-pointer">
              <h2 className="font-semibold text-[14px] text-[#1d2327]">Categorias</h2>
              <div className="flex gap-1">
                <ChevronUp className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            
            <div className="p-0 text-[13px]">
              <div className="flex border-b border-[#ccd0d4]">
                <button type="button" className="px-3 py-1.5 font-medium border border-b-white bg-white -mb-px rounded-t">Todas as categorias</button>
                <button type="button" className="px-3 py-1.5 text-[#2271b1] hover:text-[#135e96]">Mais usadas</button>
              </div>
              <div className="p-3 bg-white max-h-48 overflow-y-auto">
                <div className="space-y-1.5">
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="flex items-start gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-0.5 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                        checked={formData.category === cat.toLowerCase()}
                        onChange={() => setFormData({...formData, category: cat.toLowerCase()})}
                      />
                      <span className="text-[#2c3338]">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
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

