'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trash2, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  ImageIcon, 
  Upload, 
  X,
  LayoutGrid,
  List as ListIcon,
  Search,
  Filter,
  Check,
  Plus,
  AlertCircle,
  FileDown
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
  const [activeFile, setActiveFile] = useState<StorageFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [visibleCount, setVisibleCount] = useState(70);
  
  // Advanced Editor States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editWidth, setEditWidth] = useState(0);
  const [editHeight, setEditHeight] = useState(0);
  const [editFormat, setEditFormat] = useState<'original' | 'webp' | 'jpeg'>('original');
  const [processingImage, setProcessingImage] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<{ blob: Blob; mimeType: string; extension: string } | null>(null);
  
  // Metadata States
  const [metadata, setMetadata] = useState({
    alt_text: '',
    title: '',
    caption: '',
    description: ''
  });
  const [savingMetadata, setSavingMetadata] = useState(false);

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

  const getPublicUrl = (filename: string) => {
    return supabase.storage.from(BUCKET_NAME).getPublicUrl(filename).data.publicUrl;
  };

  const openDetails = async (file: StorageFile) => {
    setActiveFile(file);
    setIsEditingImage(false);
    
    // Fetch metadata from DB
    const { data } = await supabase.from('media_details').select('*').eq('file_name', file.name).single();
    if (data) {
      setMetadata({
        alt_text: data.alt_text || '',
        title: data.title || '',
        caption: data.caption || '',
        description: data.description || ''
      });
    } else {
      setMetadata({
        alt_text: '',
        title: file.name.split('-').slice(0, -1).join('-') || file.name,
        caption: '',
        description: ''
      });
    }
  };

  const saveMetadata = async () => {
    if (!activeFile) return;
    setSavingMetadata(true);
    try {
      await supabase.from('media_details').upsert({
        file_name: activeFile.name,
        ...metadata,
        updated_at: new Date().toISOString()
      }, { onConflict: 'file_name' });
      alert('Metadados guardados!');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMetadata(false);
    }
  };

  const deleteSingle = async (filename: string) => {
    if (!confirm('Eliminar esta imagem permanentemente?')) return;
    setLoading(true);
    await supabase.storage.from(BUCKET_NAME).remove([filename]);
    await supabase.from('media_details').delete().eq('file_name', filename);
    setActiveFile(null);
    setIsEditorOpen(false);
    loadImages();
  };

  const deleteBulk = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Eliminar ${selectedIds.size} itens?`)) return;
    setLoading(true);
    const ids = Array.from(selectedIds);
    await supabase.storage.from(BUCKET_NAME).remove(ids);
    await supabase.from('media_details').delete().in('file_name', ids);
    setSelectedIds(new Set());
    setIsBulkMode(false);
    loadImages();
  };

  const applyImageEdits = async () => {
    if (!activeFile) return;
    setProcessingImage(true);
    
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = getPublicUrl(activeFile.name);
      await new Promise((resolve, reject) => { 
        img.onload = resolve;
        img.onerror = () => reject(new Error('Falha ao carregar imagem para edição.'));
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const finalWidth = editWidth || img.width;
      const finalHeight = editHeight || img.height;
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      if (ctx) ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      const mimeType = editFormat === 'webp' ? 'image/webp' : editFormat === 'jpeg' ? 'image/jpeg' : activeFile.metadata?.mimetype || 'image/jpeg';
      const extension = editFormat === 'webp' ? '.webp' : editFormat === 'jpeg' ? '.jpg' : '.' + activeFile.name.split('.').pop();
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), mimeType, 0.85);
      });

      setPendingBlob({ blob, mimeType, extension });
      setIsSaveConfirmOpen(true);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setProcessingImage(false);
    }
  };

  const confirmSave = async (replace: boolean) => {
    if (!activeFile || !pendingBlob) return;
    setProcessingImage(true);
    
    try {
      let fileName = activeFile.name;
      
      if (replace) {
        // Just use original name. If extension changed, we might want to update name or just overwrite.
        // For simplicity, if replace is chosen, we keep the original name even if format changed 
        // (Supabase will handle the content type).
      } else {
        fileName = activeFile.name.replace(/\.[^/.]+$/, "") + `_edited_${Date.now()}${pendingBlob.extension}`;
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, pendingBlob.blob, { 
          contentType: pendingBlob.mimeType,
          upsert: true 
        });

      if (uploadError) throw uploadError;

      alert(replace ? 'Imagem original substituída com sucesso!' : 'Imagem guardada como novo ficheiro!');
      setIsSaveConfirmOpen(false);
      setPendingBlob(null);
      setIsEditingImage(false);
      setIsEditorOpen(false);
      loadImages();
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setProcessingImage(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white ${isModal ? 'h-[80vh]' : ''} flex flex-col relative`}>
      {/* Toolbar Superior */}
      <div className="bg-white border-b border-[#ccd0d4] p-2 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-[#50575e] hover:text-[#2271b1]"><ListIcon className="w-5 h-5" /></button>
          <button className="p-1.5 bg-[#f0f0f1] text-[#2271b1] rounded-[3px]"><LayoutGrid className="w-5 h-5" /></button>
          
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
          <div className="text-[13px] text-[#50575e]">{filteredFiles.length} itens</div>
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
        {/* Grid Principal */}
        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-[#f0f0f1]">
          {loading && files.length === 0 ? (
            <div className="flex items-center justify-center h-full"><RefreshCw className="w-8 h-8 animate-spin text-[#2271b1]" /></div>
          ) : (
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${activeFile && !isBulkMode ? 'lg:grid-cols-4 xl:grid-cols-6' : 'lg:grid-cols-6 xl:grid-cols-8'} gap-3 transition-all`}>
              {paginatedFiles.map((file) => (
                <div 
                  key={file.name}
                  onClick={() => {
                    if (isBulkMode) {
                      toggleSelect(file.name);
                    } else if (isModal && onSelect) {
                      // Seleção direta em modal - fecha imediatamente
                      onSelect(getPublicUrl(file.name));
                    } else {
                      openDetails(file);
                    }
                  }}
                  className={`aspect-square relative border cursor-pointer overflow-hidden bg-white shadow-sm transition-all ${
                    selectedIds.has(file.name) || activeFile?.name === file.name 
                      ? 'ring-4 ring-[#2271b1] ring-inset' 
                      : 'border-[#ccd0d4] hover:border-[#2271b1]'
                  }`}
                >
                  <img src={getPublicUrl(file.name)} className="w-full h-full object-cover" alt="" loading="lazy" />
                  {selectedIds.has(file.name) && (
                    <div className="absolute top-1 right-1 bg-[#2271b1] text-white p-0.5 rounded-sm"><Check className="w-3 h-3" /></div>
                  )}
                  {isModal && onSelect && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <span className="bg-[#2271b1] text-white px-3 py-1 text-xs font-bold rounded">Selecionar</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {!loading && visibleCount < filteredFiles.length && (
            <div className="flex justify-center py-8">
              <button onClick={() => setVisibleCount(prev => prev + 70)} className="px-8 py-2 border border-[#2271b1] text-[#2271b1] text-sm font-bold rounded-[3px] hover:bg-white transition-all">Carregar mais</button>
            </div>
          )}
        </div>

        {/* Barra Lateral WordPress */}
        {activeFile && !isBulkMode && (
          <aside className="w-80 bg-[#f6f7f7] border-l border-[#ccd0d4] overflow-y-auto shrink-0 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-[#ccd0d4] bg-white">
              <h3 className="font-bold text-[13px] text-[#1d2327] uppercase tracking-wider">Detalhes do anexo</h3>
              <button onClick={() => setActiveFile(null)} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 space-y-6">
              <div className="aspect-video bg-checkerboard border border-[#ccd0d4] rounded-sm overflow-hidden flex items-center justify-center p-2">
                <img src={getPublicUrl(activeFile.name)} className="max-w-full max-h-full object-contain" alt="" />
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Texto alternativo</label>
                  <textarea value={metadata.alt_text} onChange={(e) => setMetadata({...metadata, alt_text: e.target.value})} className="w-full text-xs border border-[#ccd0d4] p-2 focus:border-[#2271b1] outline-none h-14 rounded-[3px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Título</label>
                  <input type="text" value={metadata.title} onChange={(e) => setMetadata({...metadata, title: e.target.value})} className="w-full text-xs border border-[#ccd0d4] p-2 focus:border-[#2271b1] outline-none rounded-[3px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Legenda</label>
                  <textarea value={metadata.caption} onChange={(e) => setMetadata({...metadata, caption: e.target.value})} className="w-full text-xs border border-[#ccd0d4] p-2 focus:border-[#2271b1] outline-none h-14 rounded-[3px]" />
                </div>
              </div>

              <div className="pt-4 border-t border-[#ccd0d4] flex flex-wrap gap-2">
                <button onClick={() => setIsEditorOpen(true)} className="flex-1 h-9 bg-white border border-[#2271b1] text-[#2271b1] rounded-[3px] text-sm font-bold hover:bg-gray-100">Editar Imagem</button>
                <button onClick={saveMetadata} disabled={savingMetadata} className="flex-1 h-9 bg-[#2271b1] text-white rounded-[3px] text-sm font-bold hover:bg-[#135e96] disabled:opacity-50">{savingMetadata ? '...' : 'Salvar'}</button>
                <button onClick={() => deleteSingle(activeFile.name)} className="h-9 px-3 border border-red-600 text-red-600 rounded-[3px] hover:bg-red-600 hover:text-white"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* MODAL DE EDIÇÃO AVANÇADA (WP STYLE) */}
      {isEditorOpen && activeFile && (
        <div className="fixed inset-0 z-[9999] bg-[#f0f0f1] flex flex-col">
          <div className="h-14 bg-white border-b border-[#ccd0d4] flex items-center justify-between px-6 shrink-0 shadow-sm">
            <h2 className="text-[18px] font-normal text-[#1d2327]">Editar Imagem</h2>
            <button onClick={() => setIsEditorOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white border border-[#ccd0d4] rounded-[3px] hover:bg-gray-50"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 bg-[#f0f0f1] flex items-center justify-center p-12 overflow-hidden">
              <div className="max-w-full max-h-full shadow-2xl bg-white p-2 bg-checkerboard">
                <img src={getPublicUrl(activeFile.name)} className="max-w-full max-h-[70vh] object-contain" alt="" />
              </div>
            </div>

            <aside className="w-[400px] bg-white border-l border-[#ccd0d4] overflow-y-auto p-6 space-y-8 shadow-[-5px_0_15px_rgba(0,0,0,0.05)]">
              <div className="space-y-4">
                <h3 className="font-bold text-sm border-b pb-2 uppercase tracking-wider text-gray-500">Escalar Imagem</h3>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-400">Largura</span>
                    <input type="number" value={editWidth} onChange={(e) => setEditWidth(parseInt(e.target.value))} className="w-20 h-8 border border-[#ccd0d4] px-2 text-sm" />
                  </div>
                  <X className="w-4 h-4 mt-4 text-gray-300" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-400">Altura</span>
                    <input type="number" value={editHeight} onChange={(e) => setEditHeight(parseInt(e.target.value))} className="w-20 h-8 border border-[#ccd0d4] px-2 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditWidth(Math.round(editWidth*0.5)); setEditHeight(Math.round(editHeight*0.5)); }} className="text-[11px] text-[#2271b1] hover:underline">50%</button>
                  <button onClick={() => { setEditWidth(Math.round(editWidth*0.75)); setEditHeight(Math.round(editHeight*0.75)); }} className="text-[11px] text-[#2271b1] hover:underline">75%</button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm border-b pb-2 uppercase tracking-wider text-gray-500">Formato e Otimização</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" checked={editFormat === 'original'} onChange={() => setEditFormat('original')} /><span>Original ({activeFile.metadata?.mimetype})</span></label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" checked={editFormat === 'webp'} onChange={() => setEditFormat('webp')} /><span className="font-medium text-green-700">WebP (Super Leve)</span></label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" checked={editFormat === 'jpeg'} onChange={() => setEditFormat('jpeg')} /><span>JPEG</span></label>
                </div>
              </div>

              <div className="pt-8 border-t flex flex-col gap-3">
                <button onClick={applyImageEdits} disabled={processingImage} className="w-full py-3 bg-[#2271b1] text-white font-bold rounded-[3px] hover:bg-[#135e96] disabled:opacity-50">{processingImage ? 'A processar...' : 'Guardar Como Novo'}</button>
                <button onClick={() => setIsEditorOpen(false)} className="w-full py-3 border border-[#ccd0d4] font-bold rounded-[3px] hover:bg-gray-50">Cancelar</button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* CUSTOM SAVE CONFIRMATION POPUP (ENTRECAMPOS STYLE) */}
      {isSaveConfirmOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-[#ccd0d4] animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1d2327]">Como deseja guardar?</h3>
                  <p className="text-sm text-[#50575e]">Escolha como aplicar as edições feitas na imagem.</p>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => confirmSave(true)}
                  disabled={processingImage}
                  className="w-full flex items-center justify-between p-4 border border-[#ccd0d4] rounded-lg hover:border-[#2271b1] hover:bg-blue-50 transition-all group text-left"
                >
                  <div>
                    <span className="block font-bold text-[#1d2327] group-hover:text-[#2271b1]">Substituir Original</span>
                    <span className="text-xs text-[#50575e]">O ficheiro antigo será removido e substituído por este.</span>
                  </div>
                  <RefreshCw className="w-5 h-5 text-[#ccd0d4] group-hover:text-[#2271b1]" />
                </button>

                <button 
                  onClick={() => confirmSave(false)}
                  disabled={processingImage}
                  className="w-full flex items-center justify-between p-4 border border-[#ccd0d4] rounded-lg hover:border-[#2271b1] hover:bg-blue-50 transition-all group text-left"
                >
                  <div>
                    <span className="block font-bold text-[#1d2327] group-hover:text-[#2271b1]">Guardar Como Novo</span>
                    <span className="text-xs text-[#50575e]">Cria uma nova versão da imagem mantendo a original intacta.</span>
                  </div>
                  <FileDown className="w-5 h-5 text-[#ccd0d4] group-hover:text-[#2271b1]" />
                </button>
              </div>
            </div>

            <div className="bg-[#f6f7f7] p-4 flex justify-end gap-3 border-t border-[#ccd0d4]">
              <button 
                onClick={() => { setIsSaveConfirmOpen(false); setPendingBlob(null); }}
                className="px-6 py-2 text-sm font-bold text-[#50575e] hover:text-[#1d2327]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .bg-checkerboard {
          background-image: linear-gradient(45deg, #f0f0f1 25%, transparent 25%), linear-gradient(-45deg, #f0f0f1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f1 75%), linear-gradient(-45deg, transparent 75%, #f0f0f1 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}
