'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  RefreshCw, 
  Check, 
  X,
  Plus,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
  isModal?: boolean;
  externalSearchQuery?: string;
}

interface StorageFile {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: {
    size: number;
    mimetype: string;
  } | null;
}

export default function MediaLibrary({ onSelect, isModal, externalSearchQuery }: MediaLibraryProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [visibleCount, setVisibleCount] = useState(70);
  const [activeFile, setActiveFile] = useState<StorageFile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const itemsPerBatch = 70;
  const BUCKET_NAME = 'news-images';

  const loadImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const filteredFiles = useMemo(() => {
    const query = (externalSearchQuery || searchQuery).toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(query));
  }, [files, searchQuery, externalSearchQuery]);

  const paginatedFiles = useMemo(() => {
    return filteredFiles.slice(0, visibleCount);
  }, [filteredFiles, visibleCount]);

  const toggleSelect = (name: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(name)) newSelected.delete(name);
    else newSelected.add(name);
    setSelectedIds(newSelected);
  };

  const deleteSingle = async (filename: string) => {
    if (!confirm('Eliminar esta imagem permanentemente?')) return;
    setLoading(true);
    await supabase.storage.from(BUCKET_NAME).remove([filename]);
    setActiveFile(null);
    loadImages();
  };

  const deleteBulk = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Eliminar ${selectedIds.size} itens?`)) return;
    setLoading(true);
    await supabase.storage.from(BUCKET_NAME).remove(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsBulkMode(false);
    loadImages();
  };

  const getPublicUrl = (filename: string) => {
    return supabase.storage.from(BUCKET_NAME).getPublicUrl(filename).data.publicUrl;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copiado para a área de transferência!');
  };

  return (
    <div className={`bg-white ${isModal ? 'h-[80vh]' : ''} flex flex-col`}>
      {/* Toolbar Superior */}
      <div className="bg-white border-b border-[#ccd0d4] p-2 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-[#50575e] hover:text-[#2271b1]">
            <ListIcon className="w-5 h-5" />
          </button>
          <button className="p-1.5 bg-[#f0f0f1] text-[#2271b1] rounded-[3px]">
            <LayoutGrid className="w-5 h-5" />
          </button>

          <select className="ml-4 h-8 text-[13px] border-[#ccd0d4] rounded-[3px] bg-white px-2 outline-none focus:border-[#2271b1]">
            <option>Todos os itens</option>
          </select>
          
          {!isBulkMode ? (
            <button 
              onClick={() => setIsBulkMode(true)}
              className="ml-4 h-8 px-4 text-[13px] font-bold border border-[#ccd0d4] rounded-[3px] bg-white hover:bg-[#f6f7f7]"
            >
              Seleção em massa
            </button>
          ) : (
            <div className="flex items-center gap-2 ml-4">
              <button onClick={deleteBulk} className="h-8 px-3 bg-[#d63638] text-white rounded-[3px] text-sm font-bold">Eliminar ({selectedIds.size})</button>
              <button onClick={() => { setIsBulkMode(false); setSelectedIds(new Set()); }} className="h-8 px-3 border border-[#ccd0d4] rounded-[3px] bg-white text-sm">Cancelar</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[13px] text-[#50575e]">
            {filteredFiles.length} itens
          </div>
          {!externalSearchQuery && (
            <div className="relative">
              <input 
                type="text" 
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2 border border-[#ccd0d4] rounded-[3px] text-sm outline-none focus:border-[#2271b1]"
              />
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#50575e]" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading && files.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 animate-spin text-[#2271b1]" />
            </div>
          ) : (
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${activeFile && !isBulkMode ? 'lg:grid-cols-4 xl:grid-cols-6' : 'lg:grid-cols-6 xl:grid-cols-8'} gap-3`}>
              {paginatedFiles.map((file) => (
                <div 
                  key={file.name}
                  onClick={() => {
                    if (isBulkMode) toggleSelect(file.name);
                    else setActiveFile(file);
                  }}
                  className={`aspect-square relative border cursor-pointer overflow-hidden bg-[#f0f0f1] group transition-all ${
                    selectedIds.has(file.name) || activeFile?.name === file.name 
                      ? 'ring-4 ring-[#2271b1] ring-inset' 
                      : 'border-[#ccd0d4] hover:border-[#2271b1]'
                  }`}
                >
                  <img src={getPublicUrl(file.name)} className="w-full h-full object-cover" alt="" loading="lazy" />
                  {selectedIds.has(file.name) && (
                    <div className="absolute top-1 right-1 bg-[#2271b1] text-white p-0.5 rounded-sm">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  {!isBulkMode && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {!loading && visibleCount < filteredFiles.length && (
            <div className="flex justify-center py-8">
              <button 
                onClick={() => setVisibleCount(prev => prev + itemsPerBatch)}
                className="px-8 py-2 border border-[#2271b1] text-[#2271b1] text-sm font-bold rounded-[3px] hover:bg-[#f6f7f7] transition-all"
              >
                Carregar mais
              </button>
            </div>
          )}
        </div>

        {/* DETAILS SIDEBAR */}
        {activeFile && !isBulkMode && (
          <aside className="w-80 bg-[#f6f7f7] border-l border-[#ccd0d4] overflow-y-auto shrink-0 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-[#ccd0d4] bg-white">
              <h3 className="font-bold text-[14px] text-[#1d2327] uppercase tracking-wider">Detalhes do anexo</h3>
              <button onClick={() => setActiveFile(null)} className="text-[#50575e] hover:text-[#d63638]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div className="aspect-video bg-white border border-[#ccd0d4] rounded-sm overflow-hidden flex items-center justify-center p-2">
                <img src={getPublicUrl(activeFile.name)} className="max-w-full max-h-full object-contain" alt="" />
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between text-gray-500">
                  <span className="font-bold text-[#1d2327]">Nome do ficheiro:</span>
                  <span className="break-all text-right ml-2">{activeFile.name}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="font-bold text-[#1d2327]">Tipo de ficheiro:</span>
                  <span>{activeFile.metadata?.mimetype || 'image/jpeg'}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="font-bold text-[#1d2327]">Carregado em:</span>
                  <span>{activeFile.created_at ? new Date(activeFile.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="font-bold text-[#1d2327]">Tamanho:</span>
                  <span>{formatSize(activeFile.metadata?.size)}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-[#ccd0d4] space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#1d2327] mb-1">URL do ficheiro:</label>
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      readOnly 
                      value={getPublicUrl(activeFile.name)} 
                      className="flex-1 h-8 px-2 bg-white border border-[#ccd0d4] rounded-[3px] text-[12px] outline-none"
                    />
                    <button 
                      onClick={() => copyUrl(getPublicUrl(activeFile.name))}
                      className="p-1.5 bg-white border border-[#ccd0d4] rounded-[3px] hover:text-[#2271b1]"
                      title="Copiar URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {onSelect && (
                    <button 
                      onClick={() => onSelect(getPublicUrl(activeFile.name))}
                      className="flex-1 h-9 bg-[#2271b1] text-white rounded-[3px] text-sm font-bold hover:bg-[#135e96] transition-all"
                    >
                      Selecionar
                    </button>
                  )}
                  <button 
                    onClick={() => setIsEditorOpen(true)}
                    className="flex-1 h-9 bg-white border border-[#2271b1] text-[#2271b1] rounded-[3px] text-sm font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => deleteSingle(activeFile.name)}
                    className="h-9 px-3 border border-[#d63638] text-[#d63638] rounded-[3px] text-sm font-bold hover:bg-[#d63638] hover:text-white transition-all"
                    title="Eliminar permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <a 
                  href={getPublicUrl(activeFile.name)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-[12px] text-[#2271b1] font-bold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver página do anexo
                </a>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* FULL SCREEN WORDPRESS STYLE EDITOR MODAL */}
      {isEditorOpen && activeFile && (
        <div className="fixed inset-0 z-[9999] bg-[#f0f0f1] flex flex-col">
          {/* Modal Header */}
          <div className="h-14 bg-white border-b border-[#ccd0d4] flex items-center justify-between px-6 shrink-0">
            <h2 className="text-[18px] font-normal text-[#1d2327]">Detalhes do anexo</h2>
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-[#2271b1]"><Plus className="w-5 h-5 rotate-45" /></button>
              <button onClick={() => setIsEditorOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white border border-[#ccd0d4] rounded-[3px] text-[#1d2327] hover:bg-gray-50">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Image Preview */}
            <div className="flex-1 bg-[#f0f0f1] flex items-center justify-center p-12 overflow-hidden">
              <div className="max-w-full max-h-full shadow-2xl bg-white p-2">
                <img src={getPublicUrl(activeFile.name)} className="max-w-full max-h-[70vh] object-contain" alt="" />
              </div>
            </div>

            {/* Right Column: Editor Sidebar */}
            <div className="w-[450px] bg-white border-l border-[#ccd0d4] overflow-y-auto p-6 space-y-6 shadow-[-5px_0_15px_rgba(0,0,0,0.05)]">
              <div className="space-y-4">
                <div className="flex justify-between text-[13px]">
                  <span className="font-bold">Nome do ficheiro:</span>
                  <span className="text-gray-500">{activeFile.name}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="font-bold">Tamanho do ficheiro:</span>
                  <span className="text-gray-500">{formatSize(activeFile.metadata?.size)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="font-bold">Dimensões:</span>
                  <span className="text-gray-500">Auto px</span>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-[#ccd0d4]">
                <div>
                  <label className="block text-[13px] font-bold text-[#1d2327] mb-1">Texto alternativo</label>
                  <input type="text" className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-sm" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#1d2327] mb-1">Título</label>
                  <input type="text" defaultValue={activeFile.name} className="w-full h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-sm" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#1d2327] mb-1">Legenda</label>
                  <textarea className="w-full h-20 p-2 border border-[#ccd0d4] rounded-[3px] text-sm resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#1d2327] mb-1">Descrição</label>
                  <textarea className="w-full h-24 p-2 border border-[#ccd0d4] rounded-[3px] text-sm resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#1d2327] mb-1">URL do ficheiro</label>
                  <div className="flex gap-1">
                    <input readOnly value={getPublicUrl(activeFile.name)} className="flex-1 h-8 px-2 bg-[#f0f0f1] border border-[#ccd0d4] rounded-[3px] text-[12px]" />
                    <button onClick={() => copyUrl(getPublicUrl(activeFile.name))} className="h-8 px-3 border border-[#ccd0d4] rounded-[3px] hover:text-[#2271b1]"><Copy className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#ccd0d4] flex items-center justify-between">
                <button onClick={() => deleteSingle(activeFile.name)} className="text-[#d63638] text-[13px] font-bold hover:underline">Eliminar permanentemente</button>
                <button onClick={() => setIsEditorOpen(false)} className="bg-[#2271b1] text-white px-6 py-2 rounded-[3px] text-sm font-bold hover:bg-[#135e96]">Guardar alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
