'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, SITE_ID } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ImageSelector from '@/components/Admin/ImageSelector';
import dynamic from 'next/dynamic';
import {
  ImageIcon,
  Key,
  Eye,
  Calendar,
  ChevronUp
} from 'lucide-react';

// O editor só corre no navegador
const RichEditor = dynamic(() => import('@/components/Admin/RichEditor'), { ssr: false });

const CATEGORIES = [
  'Fruticultura', 'Gestão agrícola', 'Histórias inspiradoras',
  'Inclusao feminina', 'Infra-estruturas', 'Inovação', 'Agricultura', 'Comunidade',
  // Categorias do site online (entrecamposblog.com)
  'Sector agrário', 'Ambiente', 'Turismo rural', 'Desenvolvimento local', 'Apoio comunitário', 'Mulher agrário', 'Curiosidade',
  'Agro-negócio', 'Oportunidades', 'Receitas',
  // Categorias que chegam da Base de Dados Agro
  'Notícia', 'Evento', 'Guia', 'Internacional', 'Política Agrária', 'Recursos'
];

// Compara categorias sem depender de maiúsculas, acentos ou hífenes ("agro-negocio" = "Agro-negócio").
const catKey = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Cabeçalho de um card da barra lateral: a seta recolhe/expande o conteúdo. */
function CollapsibleHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      className={`p-2.5 bg-white flex justify-between items-center cursor-pointer ${open ? 'border-b border-[#ccd0d4]' : ''}`}
      onClick={onToggle}
    >
      <h2 className="font-semibold text-[14px] text-[#1d2327]">{title}</h2>
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${open ? 'Recolher' : 'Expandir'} ${title}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-0.5 text-gray-500 hover:text-[#1d2327]"
      >
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
}

interface NewsFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function NewsForm({ initialData, isEdit = false }: NewsFormProps) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [lockModifiedDate, setLockModifiedDate] = useState(false);
  // Cards da barra lateral recolhidos (a chave é o nome do card).
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleCard = (key: string) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    summary: '',
    category: 'agricultura',
    categories: ['agricultura'] as string[],
    featured: false,
    image_url: '',
    date: new Date().toISOString()
  });

  useEffect(() => {
    if (initialData) {
      const list = Array.isArray(initialData.categories) && initialData.categories.length ? initialData.categories : [initialData.category || 'agricultura'];
      setFormData({ ...initialData, categories: list });
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

  const titleRef = useRef<HTMLTextAreaElement>(null);
  // Ajusta a altura do título ao texto (e quando a largura do painel muda).
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const fit = () => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + 2}px`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [formData.title]);

  // Várias categorias: a primeira escolhida é a principal (`category`); tem de sobrar pelo menos uma.
  const toggleCategory = (cat: string) => {
    const key = cat.toLowerCase();
    setFormData((prev) => {
      const current = prev.categories;
      const next = current.some((c) => catKey(c) === catKey(cat)) ? current.filter((c) => catKey(c) !== catKey(cat)) : [...current, key];
      if (next.length === 0) return prev;
      return { ...prev, categories: next, category: next[0] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar o usuário atual do Supabase para obter o ID real
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Usar a nossa nova action server-side para contornar problemas de RLS na view/tabela
      const response = await fetch('/api/admin/news/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isEdit,
          site_id: SITE_ID,
          author_id: currentUser?.id || authUser?.id || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao guardar a notícia');
      }

      const result = await response.json().catch(() => ({}));
      alert(`Notícia ${isEdit ? 'atualizada' : 'criada'} com sucesso!${result.warning ? `\n\n${result.warning}` : ''}`);
      router.push('/admin/noticias');
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-[#2c3338] w-full p-3 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-[20px] sm:text-[23px] font-normal text-[#1d2327]">
          {isEdit ? 'Editar artigo' : 'Adicionar artigo'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-5">
        {/* Main Content Area */}
        <div className="flex-1 space-y-5">
          {/* Título: campo de texto que cresce com o que se escreve e que também se pode redimensionar à mão (puxar o canto). Enter não cria linha nova. */}
          <textarea
            ref={titleRef}
            rows={1}
            placeholder="Adicionar título"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value.replace(/\s*\n+\s*/g, ' ') })}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            className="block w-full min-h-[50px] resize-y overflow-auto px-3 py-2.5 text-[1.4rem] leading-snug bg-white border border-[#8c8f94] rounded-[6px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
          />

          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden">
            <RichEditor
              value={formData.content}
              onChange={(val) => setFormData((prev) => ({ ...prev, content: val }))}
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

          {/* Publish Box */}
          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden shadow-sm">
            <CollapsibleHeader title="Publicar" open={!collapsed.publish} onToggle={() => toggleCard('publish')} />
            {/* Recolhido, só fica o botão de guardar */}
            <div className={`p-3 bg-white ${collapsed.publish ? 'hidden' : ''}`}>
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

            <div className={`p-3 bg-[#f6f7f7] flex justify-end ${collapsed.publish ? '' : 'border-t border-[#ccd0d4]'}`}>
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
            <CollapsibleHeader title="Categorias" open={!collapsed.categories} onToggle={() => toggleCard('categories')} />

            <div className={`p-0 text-[13px] ${collapsed.categories ? 'hidden' : ''}`}>
              <label className="flex items-start gap-2 border-b border-[#ccd0d4] bg-[#fcf9e8] p-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-[#8c8f94] text-[#d63638] focus:ring-[#d63638]"
                  checked={!!formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                <span className="text-[#2c3338]">
                  <strong>Destaque</strong>
                  <span className="block text-[12px] text-[#646970]">
                    Aparece no slide da página inicial (as 5 últimas). Quando entra uma nova, a mais antiga volta só à sua categoria.
                  </span>
                </span>
              </label>
              <div className="flex border-b border-[#ccd0d4]">
                <button type="button" className="px-3 py-1.5 font-medium border border-b-white bg-white -mb-px rounded-t">Todas as categorias</button>
                <span className="ml-auto self-center px-3 text-[12px] text-[#646970]">Pode escolher várias; a 1.ª é a principal</span>
              </div>
              <div className="p-3 bg-white max-h-80 overflow-y-auto">
                <div className="space-y-1.5">
                  {/* Categorias da notícia que não estão na lista (ex.: vindas da Base) também aparecem, já marcadas. */}
                  {[...CATEGORIES, ...formData.categories.filter((c) => !CATEGORIES.some((k) => catKey(k) === catKey(c))).map((c) => c.charAt(0).toUpperCase() + c.slice(1))].map(cat => (
                    <label key={cat} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                        checked={formData.categories.some((c) => catKey(c) === catKey(cat))}
                        onChange={() => toggleCategory(cat)}
                      />
                      <span className="text-[#2c3338]">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image Box */}
          <div className="bg-white border border-[#ccd0d4] rounded-[8px] overflow-hidden shadow-sm">
            <CollapsibleHeader title="Imagem de destaque" open={!collapsed.image} onToggle={() => toggleCard('image')} />
            <div className={`p-3 ${collapsed.image ? 'hidden' : ''}`}>
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

        </div>

        {/* Telemóvel: barra fixa em baixo com o botão de publicar sempre à mão (no ecrã grande usa-se o da caixa "Publicar") */}
        <div className="lg:hidden h-20" aria-hidden="true" /> {/* espaço para a barra fixa não tapar o fim do formulário */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[#ccd0d4] bg-white px-3 py-3 shadow-[0_-2px_6px_rgba(0,0,0,0.08)]">
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 px-6 py-3 bg-[#2271b1] text-white text-[15px] font-medium rounded-[4px] hover:bg-[#135e96] disabled:opacity-50"
          >
            {loading ? 'A guardar...' : (isEdit ? 'Atualizar' : 'Publicar')}
          </button>
          <span className="ml-auto min-w-0 truncate text-[13px] text-[#50575e]">{isEdit ? 'Publicado' : 'Rascunho'}</span>
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
