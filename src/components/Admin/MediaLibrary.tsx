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
  Plus
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

  return (
    <div className={`bg-white ${isModal ? 'h-[80vh] flex flex-col' : ''}`}>
      {/* Toolbar Superior (Estilo Imagem) */}
      <div className="bg-white border-b border-[#ccd0d4] p-2 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-[#50575e] hover:text-[#2271b1]">
            <ListIcon className="w-5 h-5" />
          </button>
          <button className="p-1.5 bg-[#f0f0f1] text-[#2271b1] rounded-[3px]">
            <LayoutGrid className="w-5 h-5" />
          </button>

          <select className="ml-4 h-8 text-sm border-[#ccd0d4] rounded-[3px] bg-white px-2 outline-none focus:border-[#2271b1]">
            <option>Todos os ficheiros multimédia</option>
          </select>
          
          <select className="h-8 text-sm border-[#ccd0d4] rounded-[3px] bg-white px-2 outline-none focus:border-[#2271b1]">
            <option>Todas as datas</option>
          </select>

          <button className="h-8 px-4 text-sm font-bold border border-[#ccd0d4] rounded-[3px] bg-white hover:bg-[#f6f7f7]">
            Filtrar
          </button>

          {!isBulkMode ? (
            <button 
              onClick={() => setIsBulkMode(true)}
              className="ml-4 h-8 px-4 text-sm font-bold border border-[#ccd0d4] rounded-[3px] bg-white hover:bg-[#f6f7f7]"
            >
              Seleção em massa
            </button>
          ) : (
            <div className="flex items-center gap-2 ml-4">
              <button onClick={deleteBulk} className="h-8 px-3 bg-[#d63638] text-white rounded-[3px] text-sm font-bold">Eliminar ({selectedIds.size})</button>
              <button 
                onClick={() => {
                  if (selectedIds.size === paginatedFiles.length) setSelectedIds(new Set());
                  else setSelectedIds(new Set(paginatedFiles.map(f => f.name)));
                }}
                className="h-8 px-3 border border-[#ccd0d4] rounded-[3px] bg-white text-sm font-bold"
              >
                {selectedIds.size === paginatedFiles.length ? 'Desmarcar' : 'Selecionar tudo'}
              </button>
              <button onClick={() => { setIsBulkMode(false); setSelectedIds(new Set()); }} className="h-8 px-3 border border-[#ccd0d4] rounded-[3px] bg-white text-sm">Cancelar</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[13px] text-[#50575e]">
            A mostrar {paginatedFiles.length} de {filteredFiles.length} itens
          </div>
          {!externalSearchQuery && isModal && (
            <div className="relative flex-1 md:max-w-xs">
              <input 
                type="text" 
                placeholder="Procurar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2 border border-[#ccd0d4] rounded-[3px] text-sm outline-none focus:border-[#2271b1]"
              />
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#50575e]" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto p-4 ${loading ? 'flex items-center justify-center' : ''}`}>
        {loading ? (
          <RefreshCw className="w-8 h-8 animate-spin text-[#2271b1]" />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {paginatedFiles.map((file) => (
              <div 
                key={file.name}
                onClick={() => isBulkMode ? toggleSelect(file.name) : onSelect?.(getPublicUrl(file.name))}
                className={`aspect-square relative border cursor-pointer overflow-hidden bg-[#f0f0f1] ${
                  selectedIds.has(file.name) ? 'ring-4 ring-[#2271b1] ring-inset' : 'border-[#ccd0d4]'
                }`}
              >
                <img src={getPublicUrl(file.name)} className="w-full h-full object-cover" alt="" />
                {selectedIds.has(file.name) && (
                  <div className="absolute top-1 right-1 bg-[#2271b1] text-white p-0.5 rounded-sm">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {!loading && visibleCount < filteredFiles.length && (
          <div className="flex justify-center py-8">
            <button 
              onClick={() => setVisibleCount(prev => prev + itemsPerBatch)}
              className="px-6 py-1.5 border border-[#2271b1] text-[#2271b1] text-sm font-semibold hover:bg-[#f6f7f7]"
            >
              Carregar mais
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
