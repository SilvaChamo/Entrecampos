'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ImageSelector from '@/components/Admin/ImageSelector';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import {
  ImageIcon,
  Key,
  Eye,
  Calendar,
  ChevronUp
} from 'lucide-react';

// Require react-quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const CATEGORIES = [
  'Fruticultura', 'Gestão agrícola', 'Histórias inspiradoras',
  'Inclusao feminina', 'Infra-estruturas', 'Inovação', 'Agricultura', 'Comunidade'
];

interface NewsFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function NewsForm({ initialData, isEdit = false }: NewsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [lockModifiedDate, setLockModifiedDate] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    summary: '',
    category: 'agricultura',
    image_url: '',
    date: new Date().toISOString()
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Gerar slug automaticamente a partir do título (só se não for edição)
  useEffect(() => {
    if (!isEdit && !formData.slug && formData.title) {
      const generatedSlug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, isEdit, formData.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Usar a nossa nova action server-side para contornar problemas de RLS na view/tabela
      const response = await fetch('/api/admin/news/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isEdit,
          site_id: 'entrecampos'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao guardar a notícia');
      }

      alert(`Notícia ${isEdit ? 'atualizada' : 'criada'} com sucesso!`);
      router.push('/admin/noticias');
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="text-[#2c3338] max-w-[1200px] mx-auto pt-6 pb-20 px-4">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-[23px] font-normal text-[#1d2327]">
          {isEdit ? 'Editar artigo' : 'Adicionar artigo'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-5">
        {/* Main Content Area */}
        <div className="flex-1 space-y-5">
          <input
            type="text"
            placeholder="Adicionar título"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full h-[50px] px-3 text-[1.4rem] bg-white border border-[#8c8f94] rounded-[6px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
          />

          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(val) => setFormData({ ...formData, content: val })}
              modules={modules}
              className="bg-white min-h-[400px]"
            />
          </div>

          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden shadow-sm">
            <div className="p-3 border-b border-[#ccd0d4] bg-white flex justify-between items-center cursor-pointer">
              <h2 className="font-semibold text-[14px] text-[#1d2327]">Excerto (Resumo)</h2>
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </div>
            <div className="p-4 bg-white">
              <textarea
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full p-2 border border-[#8c8f94] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] text-[14px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[280px] space-y-5">

          {/* Featured Image Box */}
          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden shadow-sm">
            <div className="p-2.5 border-b border-[#ccd0d4] bg-white flex justify-between items-center cursor-pointer">
              <h2 className="font-semibold text-[14px] text-[#1d2327]">Imagem de destaque</h2>
              <ChevronUp className="w-4 h-4 text-gray-500" />
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
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                    className="text-[#d63638] text-[13px] hover:underline underline-offset-2"
                  >
                    Remover imagem
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
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </div>
            <div className="p-3 bg-white">
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  className="flex-1 px-1 py-2 text-[12px] whitespace-nowrap border border-[#2271b1] text-[#2271b1] rounded-[4px] bg-[#f6f7f7] hover:bg-white font-medium transition-colors"
                >
                  Guardar Rascunho
                </button>
                <button
                  type="button"
                  className="flex-1 px-1 py-2 text-[12px] border border-[#2271b1] text-[#2271b1] rounded-[4px] bg-[#f6f7f7] hover:bg-white font-medium transition-colors"
                >
                  Pré-visualizar
                </button>
              </div>

              <div className="space-y-2.5 text-[13px] text-[#50575e] mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-400" />
                  <span>Estado: <strong>{isEdit ? 'Publicado' : 'Rascunho'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span>Visibilidade: <strong>Público</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    Data: <strong>{new Date(formData.date).toLocaleDateString('pt-PT')}</strong>
                  </span>
                </div>
              </div>

              <div
                className="flex items-center gap-2 text-[13px] mb-4 border-t border-[#f0f0f1] pt-3 cursor-pointer"
                onClick={() => setLockModifiedDate(!lockModifiedDate)}
              >
                <div className={`w-8 h-4 rounded-full relative flex items-center p-0.5 transition-colors ${lockModifiedDate ? 'bg-[#2271b1]' : 'bg-gray-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${lockModifiedDate ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-gray-600">Lock Modified Date</span>
              </div>
            </div>

            <div className="p-3 bg-[#f6f7f7] flex justify-end border-t border-[#ccd0d4]">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#2271b1] text-white text-[14px] font-medium rounded-[4px] hover:bg-[#135e96] disabled:opacity-50"
              >
                {loading ? 'A guardar...' : (isEdit ? 'Atualizar' : 'Publicar')}
              </button>
            </div>
          </div>

          {/* Categories Box */}
          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden shadow-sm">
            <div className="p-2.5 border-b border-[#ccd0d4] bg-white flex justify-between items-center cursor-pointer">
              <h2 className="font-semibold text-[14px] text-[#1d2327]">Categorias</h2>
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </div>

            <div className="p-0 text-[13px]">
              <div className="flex border-b border-[#ccd0d4]">
                <button type="button" className="px-3 py-1.5 font-medium border border-b-white bg-white -mb-px rounded-t">Todas as categorias</button>
              </div>
              <div className="p-3 bg-white max-h-48 overflow-y-auto">
                <div className="space-y-1.5">
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                        checked={formData.category.toLowerCase() === cat.toLowerCase()}
                        onChange={() => setFormData({ ...formData, category: cat.toLowerCase() })}
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
          onSelect={(url) => {
            setFormData(prev => ({ ...prev, image_url: url }));
            setIsImageSelectorOpen(false);
          }}
          currentImageUrl={formData.image_url}
        />
      )}
    </div>
  );
}
