'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { repairNewsImage } from '@/app/actions/news';
import { 
  Trash2,
  Wrench, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  Image as ImageIcon,
  Search,
  ExternalLink,
  Save,
  Undo2,
  Redo2,
  ChevronRight,
  History
} from 'lucide-react';
import Link from 'next/link';

interface NewsItem {
  id: string;
  title: string;
  image_url: string;
  category: string;
}

interface StorageFile {
  name: string;
}

export default function NewsRepairPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [manualFilter, setManualFilter] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectedImageToApply, setSelectedImageToApply] = useState<string | null>(null);
  const [viewingHistoryIndex, setViewingHistoryIndex] = useState<number | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const BUCKET_NAME = 'news-images';

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all news
      const { data: newsData } = await supabase.from('news').select('id, title, image_url, category').order('date', { ascending: false });
      
      // 2. Fetch all storage files
      const { data: storageData } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1000 });

      // 3. Filter news that need repair (image_url missing or not pointing to supabase)
      const needsRepair = (newsData || []).filter((n: any) => {
        if (!n.image_url) return true;
        // Se o link for do WordPress antigo, precisa de reparação
        return n.image_url.includes('wp-content') || n.image_url.includes('CDATA');
      });

      setNews(needsRepair);
      setFiles(storageData || []);
    } catch (err: any) {
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPublicUrl = (name: string) => {
    return supabase.storage.from(BUCKET_NAME).getPublicUrl(name).data.publicUrl;
  };

  const extractWordFromUrl = (url: string) => {
    if (!url) return '';
    const cleanUrl = url.replace('<![CDATA[', '').replace(']]>', '');
    const parts = cleanUrl.split('/');
    const fileName = parts.pop() || '';
    // Pegar os primeiros 8 caracteres ou até ao primeiro traço/ponto
    return fileName.split(/[-._]/)[0] || '';
  };

  const getSuggestions = (title: string) => {
    if (!title && !manualFilter) return [];
    
    // Se houver um filtro manual (do link), usamos esse. Se não, usamos as palavras do título.
    const searchTerms = manualFilter 
      ? [manualFilter.toLowerCase()] 
      : title.toLowerCase().split(' ').filter(w => w.length > 3);
    
    return files.filter(f => {
      const fileName = f.name.toLowerCase();
      return searchTerms.some(term => fileName.includes(term));
    }).slice(0, 15);
  };

  const repairNews = async (newsId: string, fileName: string, isRedo = false) => {
    const itemToRepair = news.find(n => n.id === newsId);
    if (!itemToRepair) return;

    setSavingId(newsId);
    const newUrl = getPublicUrl(fileName);
    const oldUrl = itemToRepair.image_url;

    try {
      // Usar a Server Action com a chave de administrador (ignora RLS)
      await repairNewsImage(newsId, newUrl);

      // Gravar no histórico ANTES de remover da lista
      if (!isRedo) {
        // Se estivermos a re-reparar algo no histórico, atualizamos esse item no histórico
        if (viewingHistoryIndex !== null) {
          const updatedHistory = [...history];
          updatedHistory[viewingHistoryIndex].newUrl = newUrl;
          setHistory(updatedHistory);
        } else {
          setHistory(prev => [...prev, { item: itemToRepair, oldUrl, newUrl }]);
        }
        setRedoStack([]); 
      }

      // Se for uma notícia nova, removemos da lista de pendentes
      if (viewingHistoryIndex === null) {
        setNews(prev => prev.filter(n => n.id !== newsId));
      }
      
      setSelectedImageToApply(null);
      setManualFilter(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar a imagem.');
    } finally {
      setSavingId(null);
    }
  };

  const undo = async () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    
    setLoading(true);
    try {
      await repairNewsImage(lastAction.item.id, lastAction.oldUrl);

      // Voltar a notícia para a lista
      setNews(prev => [lastAction.item, ...prev]);
      setRedoStack(prev => [...prev, lastAction]);
      setHistory(prev => prev.slice(0, -1));
    } catch (err: any) {
      alert(err.message || 'Erro ao desfazer.');
    } finally {
      setLoading(false);
    }
  };

  const redo = async () => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    
    setLoading(true);
    try {
      const fileName = action.newUrl.split('/').pop();
      await repairNews(action.item.id, fileName, true);
      
      setHistory(prev => [...prev, action]);
      setRedoStack(prev => prev.slice(0, -1));
    } catch (err) {
      alert('Erro ao refazer');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectImage = (fileName: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(fileName)) next.delete(fileName);
      else next.add(fileName);
      return next;
    });
  };

  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) return;
    if (!confirm(`Deseja eliminar permanentemente as ${selectedImages.size} imagens selecionadas?`)) return;

    setLoading(true);
    try {
      const names = Array.from(selectedImages);
      const { error } = await supabase.storage.from(BUCKET_NAME).remove(names);
      if (error) throw error;

      alert(`${names.length} imagens eliminadas com sucesso.`);
      setSelectedImages(new Set());
      loadData();
    } catch (err) {
      alert('Erro ao eliminar em massa');
    } finally {
      setLoading(false);
    }
  };

  // Atalhos de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, redoStack, news]);

  // Garantir que o índice não ultrapassa o tamanho do array caso uma notícia seja removida
  const safeCurrentNewsIndex = Math.min(currentNewsIndex, Math.max(0, news.length - 1));
  const currentItem = viewingHistoryIndex !== null ? history[viewingHistoryIndex].item : news[safeCurrentNewsIndex];
  
  // Se estivermos no histórico, o URL atual é o que gravámos no histórico
  const currentImageUrl = viewingHistoryIndex !== null ? history[viewingHistoryIndex].newUrl : currentItem?.image_url;
  const suggestions = currentItem ? getSuggestions(currentItem.title) : [];

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#2c3338]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="py-4 md:py-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/admin/noticias" className="p-2 hover:bg-white rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-normal text-[#1d2327]">Reparação de Imagens</h1>
                <p className="text-[13px] text-[#50575e]">Associe as imagens corretas às notícias com links partidos.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-[#ccd0d4] rounded text-sm font-medium hover:bg-[#f6f7f7] transition-all disabled:opacity-50"
                title="Recarregar dados"
              >
                <RefreshCw className={`w-4 h-4 text-[#2271b1] ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <div className="bg-white px-4 py-2 border border-[#ccd0d4] rounded text-sm font-bold">
                {news.length} Notícias a Reparar
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#ccd0d4] rounded-lg">
              <RefreshCw className="w-12 h-12 text-[#2271b1] animate-spin mb-4" />
              <p>A analisar notícias e biblioteca...</p>
            </div>
          ) : currentItem ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Side: Current News */}
              <div className="lg:col-span-5">
                <div className="bg-white border border-[#ccd0d4] rounded-lg shadow-sm overflow-hidden sticky top-8">
                  <div className="bg-[#f6f7f7] border-b border-[#ccd0d4] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-[#50575e]">{currentItem.category}</span>
                      {viewingHistoryIndex !== null && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full border border-green-200">
                          REVISÃO
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#50575e]">
                      {viewingHistoryIndex !== null ? `Alterada` : `Item ${currentNewsIndex + 1} de ${news.length}`}
                    </span>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-[#1d2327] mb-4 leading-tight">{currentItem.title}</h2>
                    
                    <div className="relative mb-6">
                      {/* Setas de Navegação coladas à imagem */}
                      <button 
                        onClick={() => {
                          if (viewingHistoryIndex === null) setViewingHistoryIndex(history.length - 1);
                          else setViewingHistoryIndex(prev => prev! > 0 ? prev! - 1 : 0);
                        }}
                        disabled={history.length === 0 || viewingHistoryIndex === 0}
                        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 p-2 bg-white border border-[#ccd0d4] rounded-full shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f6f7f7] disabled:hover:bg-white transition-all"
                      >
                        <ChevronLeft className="w-5 h-5 text-[#2271b1]" />
                      </button>

                      {viewingHistoryIndex !== null ? (
                        <div className="aspect-video border rounded-lg overflow-hidden relative group">
                          <img src={currentImageUrl} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-bold">Imagem Atual</p>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-amber-50 border-2 border-dashed border-amber-200 rounded-lg flex flex-col items-center justify-center text-amber-600 p-6 overflow-hidden">
                          <AlertCircle className="w-10 h-10 mb-2 shrink-0" />
                          <p className="text-sm font-bold mb-3">Imagem em Falta / Link Partido</p>
                          <div className="w-full px-4 overflow-hidden">
                            <p className="text-[11px] opacity-80 text-center font-mono break-all leading-relaxed bg-amber-100/50 p-3 rounded">
                              {currentItem.image_url}
                            </p>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={() => {
                          if (viewingHistoryIndex === history.length - 1) setViewingHistoryIndex(null);
                          else if (viewingHistoryIndex !== null) setViewingHistoryIndex(prev => prev! + 1);
                        }}
                        disabled={viewingHistoryIndex === null}
                        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 p-2 bg-white border border-[#ccd0d4] rounded-full shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f6f7f7] disabled:hover:bg-white transition-all"
                      >
                        <ChevronRight className="w-5 h-5 text-[#2271b1]" />
                      </button>
                    </div>


                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => {
                            const word = extractWordFromUrl(currentItem.image_url);
                            setManualFilter(word);
                          }}
                          className="flex-[2] min-w-[150px] py-2.5 bg-[#2271b1] text-white text-sm font-bold rounded hover:bg-[#135e96] flex items-center justify-center gap-2 transition-all"
                        >
                          <Search className="w-4 h-4" />
                          Procurar por Link
                        </button>
                        
                        <button 
                          onClick={() => {
                            setManualFilter(null);
                            setSelectedImageToApply(null);
                            setCurrentNewsIndex(prev => Math.min(news.length - 1, prev + 1));
                          }}
                          className="flex-1 min-w-[100px] py-2.5 border border-[#ccd0d4] text-sm font-medium hover:bg-[#f6f7f7] rounded transition-all"
                        >
                          Pular esta
                        </button>

                        {selectedImageToApply && (
                          <button 
                            onClick={() => repairNews(currentItem.id, selectedImageToApply)}
                            disabled={savingId === currentItem.id}
                            className="flex-[1.5] min-w-[130px] py-2.5 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 flex items-center justify-center gap-2 shadow-md transition-all animate-in slide-in-from-right-2 duration-200"
                          >
                            <Save className="w-4 h-4" />
                            {savingId === currentItem.id ? '...' : 'Salvar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1d2327] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#2271b1]" />
                    {manualFilter ? `Resultados para "${manualFilter}"` : 'Sugestões (baseado no título)'}
                  </h3>
                  <div className="flex items-center gap-3">
                    {selectedImages.size > 0 && (
                      <button 
                        onClick={deleteSelectedImages}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d63638] text-white text-xs font-bold rounded hover:bg-[#b32d2e] transition-colors shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar ({selectedImages.size})
                      </button>
                    )}
                    {manualFilter && (
                      <button 
                        onClick={() => setManualFilter(null)}
                        className="text-xs text-[#2271b1] hover:underline"
                      >
                        Limpar filtro
                      </button>
                    )}
                  </div>
                </div>
                
                {suggestions.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {suggestions.map(file => (
                      <div 
                        key={file.name}
                        className={`group relative aspect-square bg-white border rounded-lg overflow-hidden transition-all ${
                          selectedImageToApply === file.name 
                            ? 'ring-4 ring-green-500 border-green-500 scale-[0.98]' 
                            : 'border-[#ccd0d4] hover:ring-4 hover:ring-[#2271b1]'
                        }`}
                      >
                        {/* Imagem Principal (Botão de Selecionar) */}
                        <div 
                          onClick={() => setSelectedImageToApply(file.name)}
                          className="w-full h-full cursor-pointer"
                        >
                          <img src={getPublicUrl(file.name)} className="w-full h-full object-cover" alt="" />
                          {selectedImageToApply === file.name && (
                            <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                              <div className="bg-green-600 text-white p-2 rounded-full shadow-lg">
                                <CheckCircle2 className="w-6 h-6" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Botão Eliminar Duplicado */}
                        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                          <input 
                            type="checkbox"
                            checked={selectedImages.has(file.name)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectImage(file.name);
                            }}
                            className="w-4 h-4 rounded border-[#ccd0d4] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
                          />
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Eliminar "${file.name}" permanentemente?`)) {
                                setLoading(true);
                                try {
                                  await supabase.storage.from(BUCKET_NAME).remove([file.name]);
                                  loadData();
                                } catch (err) { alert('Erro ao eliminar'); }
                                finally { setLoading(false); }
                              }
                            }}
                            className="w-7 h-7 bg-white/90 text-[#d63638] rounded shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#d63638] hover:text-white transition-all"
                            title="Eliminar agora"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="absolute bottom-0 inset-x-0 p-1 bg-white/90 text-[9px] truncate font-mono pointer-events-none">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-[#ccd0d4] p-12 rounded-lg text-center">
                    <p className="text-[#50575e] mb-4">Nenhuma sugestão automática encontrada para este título.</p>
                    <Link href="/admin/media" className="text-[#2271b1] hover:underline text-sm font-bold">
                      Procurar manualmente na Biblioteca
                    </Link>
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-[#ccd0d4]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#1d2327]">Outras Imagens da Biblioteca</h3>
                      <span className="text-[10px] text-[#50575e] font-normal italic">Encontre qualquer imagem no servidor</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Pesquisa manual..."
                        value={globalSearchQuery}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                        className="w-full md:w-64 pl-8 pr-3 py-1.5 border border-[#ccd0d4] rounded text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                      />
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#50575e]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {files.filter(f => f.name.toLowerCase().includes(globalSearchQuery.toLowerCase())).slice(0, 60).map(file => (
                      <div 
                        key={file.name}
                        onClick={() => setSelectedImageToApply(file.name)}
                        className={`relative aspect-square bg-white border rounded overflow-hidden cursor-pointer transition-all flex flex-col group ${
                          selectedImageToApply === file.name 
                            ? 'ring-4 ring-green-500 border-green-500 z-10' 
                            : 'border-[#ccd0d4] hover:border-[#2271b1]'
                        }`}
                      >
                        <div className="flex-1 relative overflow-hidden">
                          <img 
                            src={getPublicUrl(file.name)} 
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
                              selectedImageToApply === file.name ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                            }`} 
                            alt="" 
                          />
                          {selectedImageToApply === file.name && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <CheckCircle2 className="w-8 h-8 text-green-600 drop-shadow-md bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="bg-white/95 p-2 border-t border-[#ccd0d4]">
                          <p className="text-[10px] text-[#50575e] font-semibold truncate font-mono text-center" title={file.name}>
                            {file.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-[#ccd0d4] p-20 rounded-lg text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1d2327]">Tudo Reparado!</h2>
              <p className="text-[#50575e] mt-2">Todas as notícias têm agora imagens válidas no servidor.</p>
              <Link href="/admin/noticias" className="inline-block mt-6 px-6 py-2 bg-[#2271b1] text-white rounded font-bold">
                Voltar às Notícias
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
