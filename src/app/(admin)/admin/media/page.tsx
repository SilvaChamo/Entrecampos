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
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check
} from 'lucide-react';
import { SkeletonGrid, SkeletonHeader } from '@/components/Admin/Skeleton';

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

export default function MediaGallery() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('todas');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  
  // Edição Avançada de Imagem
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editWidth, setEditWidth] = useState(0);
  const [editHeight, setEditHeight] = useState(0);
  const [editFormat, setEditFormat] = useState<'original' | 'webp' | 'jpeg'>('original');
  const [processingImage, setProcessingImage] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  
  // Metadados
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
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      if (error) throw error;
      setFiles(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar imagens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // Extrair anos únicos dos ficheiros
  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(
      files.map(f => {
        const date = f.created_at || f.updated_at;
        return date ? new Date(date).getFullYear() : new Date().getFullYear();
      })
    )).sort((a, b) => b - a);
    return uniqueYears;
  }, [files]);

  // Lógica de Paginação e Filtragem
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = fileTypeFilter === 'todos' || 
        (fileTypeFilter === 'imagens' && /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(f.name)) ||
        (fileTypeFilter === 'videos' && /\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i.test(f.name)) ||
        (fileTypeFilter === 'documentos' && /\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt)$/i.test(f.name)) ||
        (fileTypeFilter === 'pdf' && /\.pdf$/i.test(f.name)) ||
        (fileTypeFilter === 'audio' && /\.(mp3|wav|aac|ogg|flac|m4a|wma)$/i.test(f.name));
      const fileDateStr = f.created_at || f.updated_at;
      const fileYear = fileDateStr 
        ? new Date(fileDateStr).getFullYear()
        : new Date().getFullYear();
      const matchesDate = dateFilter === 'todas' || fileYear.toString() === dateFilter;
      return matchesSearch && matchesType && matchesDate;
    });
  }, [files, searchQuery, fileTypeFilter, dateFilter]);

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFiles.slice(start, start + itemsPerPage);
  }, [filteredFiles, currentPage]);

  // Ações de Seleção
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map(f => f.name)));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Deseja eliminar permanentemente os ${selectedIds.size} itens selecionados?`)) return;

    try {
      setLoading(true);
      const idsArray = Array.from(selectedIds);
      const { error } = await supabase.storage.from(BUCKET_NAME).remove(idsArray);
      if (error) throw error;
      
      // Limpar metadados se existirem
      await supabase.from('media_details').delete().in('file_name', idsArray);

      setSelectedIds(new Set());
      setIsBulkMode(false);
      loadImages();
      alert('Itens eliminados com sucesso!');
    } catch (err: any) {
      alert('Erro ao eliminar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSingle = async (filename: string) => {
    if (!confirm(`Eliminar "${filename}"?`)) return;
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([filename]);
      if (error) throw error;
      await supabase.from('media_details').delete().eq('file_name', filename);
      setFiles(files.filter(f => f.name !== filename));
      if (selectedFile?.name === filename) setSelectedFile(null);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const copyUrl = (filename: string) => {
    const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);
    navigator.clipboard.writeText(publicUrl);
    alert('URL copiada!');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getPublicUrl = (filename: string) => {
    return supabase.storage.from(BUCKET_NAME).getPublicUrl(filename).data.publicUrl;
  };

  const openDetails = async (file: StorageFile) => {
    setSelectedFile(file);
    setIsEditingImage(false); // Reset edit mode
    // Carregar metadados do DB
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

  // Função para estimar tamanho final
  useEffect(() => {
    if (isEditingImage && selectedFile) {
      const timer = setTimeout(async () => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = getPublicUrl(selectedFile.name);
        await new Promise(r => { img.onload = r; });

        const canvas = document.createElement('canvas');
        canvas.width = editWidth || img.width;
        canvas.height = editHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const mimeType = editFormat === 'webp' ? 'image/webp' : editFormat === 'jpeg' ? 'image/jpeg' : selectedFile.metadata?.mimetype;
        canvas.toBlob((blob) => {
          if (blob) setEstimatedSize(blob.size);
        }, mimeType, 0.85);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [editWidth, editHeight, editFormat, isEditingImage]);

  // Função para processar e guardar imagem editada
  const applyImageEdits = async () => {
    if (!selectedFile) return;
    setProcessingImage(true);
    
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = getPublicUrl(selectedFile.name);
      
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const finalWidth = editWidth || img.width;
      const finalHeight = editHeight || img.height;
      
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
      }

      const mimeType = editFormat === 'webp' ? 'image/webp' : editFormat === 'jpeg' ? 'image/jpeg' : selectedFile.metadata?.mimetype;
      const extension = editFormat === 'webp' ? '.webp' : editFormat === 'jpeg' ? '.jpg' : '.' + selectedFile.name.split('.').pop();
      
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), mimeType, 0.85); // 0.85 qualidade otimizada
      });

      const newFileName = selectedFile.name.replace(/\.[^/.]+$/, "") + (editFormat !== 'original' ? `_edited${extension}` : extension);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(newFileName, blob, { contentType: mimeType, upsert: true });

      if (uploadError) throw uploadError;

      alert('Imagem processada e guardada com sucesso!');
      setIsEditingImage(false);
      loadImages();
    } catch (err: any) {
      alert('Erro ao editar imagem: ' + err.message);
    } finally {
      setProcessingImage(false);
    }
  };

  const saveMetadata = async () => {
    if (!selectedFile) return;
    setSavingMetadata(true);
    try {
      await supabase.from('media_details').upsert({
        file_name: selectedFile.name,
        ...metadata,
        updated_at: new Date().toISOString()
      }, { onConflict: 'file_name' });
      alert('Guardado!');
    } catch (err: any) {
      alert('Erro ao guardar');
    } finally {
      setSavingMetadata(false);
    }
  };

  return (
    <div className="min-h-screen text-[#2c3338] p-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Header Estilo WP */}
        <div className="pt-0 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-normal">Biblioteca multimédia</h1>
            <label className="px-3 py-1 bg-white border border-[#2271b1] text-[#2271b1] rounded-[3px] text-sm font-semibold hover:bg-[#f6f7f7] cursor-pointer transition-all">
              {uploading ? 'A carregar...' : 'Adicionar ficheiros multimédia'}
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                multiple
                onChange={async (e) => {
                  const filesToUpload = e.target.files;
                  if (!filesToUpload || filesToUpload.length === 0) return;
                  
                  setUploading(true);
                  let successCount = 0;
                  
                  for (let i = 0; i < filesToUpload.length; i++) {
                    const file = filesToUpload[i];
                    const cleanName = `${Date.now()}-${file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\.-]/g, '_')}`;
                    const { error } = await supabase.storage.from(BUCKET_NAME).upload(cleanName, file);
                    if (!error) successCount++;
                  }
                  
                  if (successCount > 0) {
                    alert(`${successCount} ficheiro(s) carregado(s) com sucesso!`);
                    loadImages();
                  }
                  setUploading(false);
                }} 
              />
            </label>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Procurar itens multimédia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-2 border-[#ccd0d4] rounded-[3px] text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] w-64"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#50575e]" />
          </div>
        </div>
      </div>

        {/* Toolbar de Filtros - AGORA FIXA */}
        <div className="sticky top-0 z-40 bg-[#f0f0f1] pt-4 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-[#ccd0d4] p-2 gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              {isBulkMode && (
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === paginatedFiles.length && paginatedFiles.length > 0}
                  onChange={() => {
                    if (selectedIds.size === paginatedFiles.length) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(paginatedFiles.map(f => f.name)));
                    }
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
              )}
              
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-[#f0f0f1] text-[#2271b1]' : 'text-[#50575e] hover:text-[#2271b1]'}`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-[#f0f0f1] text-[#2271b1]' : 'text-[#50575e] hover:text-[#2271b1]'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>

              <select 
                className="ml-2 h-8 text-sm border-[#ccd0d4] rounded-md bg-white px-2"
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
              >
                <option value="todos">Todos os ficheiros</option>
                <option value="imagens">Imagens</option>
                <option value="videos">Vídeos</option>
                <option value="documentos">Documentos</option>
                <option value="pdf">PDF</option>
                <option value="audio">Áudio</option>
              </select>
              
              <select 
                className="h-8 text-sm border-[#ccd0d4] rounded-md bg-white px-2"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="todas">Todas as datas</option>
                {years.map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>

              {!isBulkMode ? (
                <button 
                  onClick={() => setIsBulkMode(true)}
                  className="ml-2 h-8 px-4 text-sm font-semibold border border-[#ccd0d4] rounded-md bg-white hover:bg-[#f6f7f7] whitespace-nowrap"
                >
                  Seleção em massa
                </button>
              ) : (
                <div className="flex items-center gap-3 ml-2 flex-nowrap">
                  <span 
                    onClick={selectedIds.size > 0 ? deleteSelected : undefined}
                    className={`text-sm whitespace-nowrap ${selectedIds.size > 0 ? 'text-[#d63638] cursor-pointer hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    Eliminar {selectedIds.size} de imagens selecionadas
                  </span>
                  <button 
                    onClick={() => { setIsBulkMode(false); setSelectedIds(new Set()); }}
                    className="h-8 px-4 text-sm font-semibold border border-[#ccd0d4] rounded-md bg-white hover:bg-[#f6f7f7] whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 flex-nowrap">
              {/* Paginação Superior */}
              <div className="flex items-center gap-2 text-[13px] text-[#50575e] whitespace-nowrap">
                <span>{filteredFiles.length} itens</span>
                <div className="flex items-center gap-1 ml-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1 border border-[#ccd0d4] bg-white rounded-md disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-medium">
                    {currentPage} <span className="font-normal text-gray-400">de</span> {totalPages || 1}
                  </span>
                  <button 
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1 border border-[#ccd0d4] bg-white rounded-md disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonGrid count={8} />
        ) : viewMode === 'grid' ? (
          /* Grid View - 7 COLUNAS */
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
            {paginatedFiles.map((file) => (
              <div 
                key={file.name}
                onClick={() => isBulkMode ? toggleSelect(file.name) : openDetails(file)}
                className={`aspect-square relative bg-white border cursor-pointer overflow-hidden group ${
                  selectedIds.has(file.name) ? 'ring-[3px] ring-[#2271b1] ring-inset' : 'border-[#ccd0d4]'
                }`}
              >
                <img 
                  src={getPublicUrl(file.name)} 
                  className="w-full h-full object-cover" 
                  alt="" 
                />
                
                {isBulkMode && (
                  <div className={`absolute top-1 right-1 w-5 h-5 rounded-sm border flex items-center justify-center ${
                    selectedIds.has(file.name) ? 'bg-[#2271b1] border-[#2271b1]' : 'bg-white border-[#ccd0d4]'
                  }`}>
                    {selectedIds.has(file.name) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                )}
                
                {!isBulkMode && (
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List View (Table) */
          <div className="bg-white border border-[#ccd0d4] overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white text-left text-[13px] font-bold border-b border-[#ccd0d4]">
                  <th className="p-2 w-10">
                    <input type="checkbox" checked={selectedIds.size === filteredFiles.length} onChange={toggleSelectAll} />
                  </th>
                  <th className="p-3">Ficheiro</th>
                  <th className="p-3">Autor</th>
                  <th className="p-3">Carregado em</th>
                  <th className="p-3">Data</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiles.map((file) => (
                  <tr key={file.name} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7] text-[13px]">
                    <td className="p-2">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(file.name)} 
                        onChange={() => toggleSelect(file.name)} 
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3 max-w-[400px]">
                        <div className="w-16 h-16 border border-[#ccd0d4] bg-[#f0f0f1] flex-shrink-0">
                          <img src={getPublicUrl(file.name)} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <button 
                            onClick={() => openDetails(file)}
                            className="text-[#2271b1] font-bold hover:text-[#135e96] text-left truncate whitespace-nowrap block w-full"
                          >
                            {file.name}
                          </button>
                          <span className="text-[#50575e] text-xs font-mono truncate">{file.metadata?.mimetype}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[#50575e]">admin</td>
                    <td className="p-3 text-[#50575e]">(Desanexado)</td>
                    <td className="p-3 text-[#50575e]">
                      {file.created_at ? new Date(file.created_at).toLocaleDateString('pt-PT') : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDetails(file)} className="text-[#2271b1] hover:underline">Editar</button>
                        <span className="text-[#ccd0d4]">|</span>
                        <button onClick={() => deleteSingle(file.name)} className="text-[#d63638] hover:underline">Eliminar</button>
                        <span className="text-[#ccd0d4]">|</span>
                        <button onClick={() => copyUrl(file.name)} className="text-[#2271b1] hover:underline">Ver</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal WP Style */}
        {selectedFile && (
          <div className="fixed inset-0 bg-white z-[100] flex flex-col">
            <div className="flex items-center justify-between px-4 h-12 border-b bg-[#f6f7f7]">
              <h2 className="text-lg font-bold">Detalhes do anexo</h2>
              <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-[#ccd0d4]"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f0f0f1]">
              {/* Image Preview Area */}
              <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-auto bg-checkerboard">
                {!isEditingImage ? (
                  <>
                    <img 
                      src={getPublicUrl(selectedFile.name)} 
                      className="max-w-full max-h-[70vh] shadow-lg border border-[#ccd0d4] bg-white"
                      alt="" 
                    />
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => {
                          const img = new Image();
                          img.src = getPublicUrl(selectedFile.name);
                          img.onload = () => {
                            setEditWidth(img.width);
                            setEditHeight(img.height);
                            setIsEditingImage(true);
                          };
                        }}
                        className="px-4 py-1.5 bg-[#2271b1] text-white text-sm font-semibold rounded-[3px] hover:bg-[#135e96]"
                      >
                        Editar imagem
                      </button>
                      <button onClick={() => window.open(getPublicUrl(selectedFile.name), '_blank')} className="px-4 py-1.5 border border-[#2271b1] text-[#2271b1] bg-white text-sm font-semibold rounded-[3px] hover:bg-[#f6f7f7]">
                        Ver ficheiro completo
                      </button>
                    </div>
                  </>
                ) : (
                  /* Interface de Edição de Imagem */
                  <div className="w-full max-w-4xl bg-white border border-[#ccd0d4] shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold">Ferramentas de Edição</h3>
                      <button onClick={() => setIsEditingImage(false)} className="text-sm text-[#2271b1] hover:underline">Voltar aos detalhes</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col items-center justify-center bg-[#f0f0f1] border p-4">
                        <img 
                          src={getPublicUrl(selectedFile.name)} 
                          className="max-w-full max-h-[40vh] object-contain"
                          alt="Preview" 
                        />
                      </div>

                      <div className="space-y-6">
                        {/* Redimensionar */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm border-b pb-1">Redimensionar</h4>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">Largura</label>
                              <input 
                                type="number" 
                                value={editWidth}
                                onChange={(e) => setEditWidth(parseInt(e.target.value))}
                                className="w-24 h-8 border border-[#ccd0d4] text-sm px-2 outline-none focus:border-[#2271b1]"
                              />
                            </div>
                            <span className="mt-4 text-gray-400">×</span>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">Altura</label>
                              <input 
                                type="number" 
                                value={editHeight}
                                onChange={(e) => setEditHeight(parseInt(e.target.value))}
                                className="w-24 h-8 border border-[#ccd0d4] text-sm px-2 outline-none focus:border-[#2271b1]"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditWidth(Math.round(editWidth*0.5)); setEditHeight(Math.round(editHeight*0.5)); }} className="text-[11px] text-[#2271b1] hover:underline">50%</button>
                            <button onClick={() => { setEditWidth(Math.round(editWidth*0.75)); setEditHeight(Math.round(editHeight*0.75)); }} className="text-[11px] text-[#2271b1] hover:underline">75%</button>
                          </div>
                          
                          <div className="bg-[#f6f7f7] p-2 border border-[#ccd0d4] rounded-[2px] mt-2">
                            <p className="text-[11px] text-gray-600">Tamanho atual: <strong>{formatSize(selectedFile.metadata?.size || 0)}</strong></p>
                            <p className="text-[11px] text-[#2271b1]">Tamanho final estimado: <strong>{estimatedSize ? formatSize(estimatedSize) : 'A calcular...'}</strong></p>
                          </div>
                        </div>

                        {/* Conversão */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm border-b pb-1">Formato e Otimização</h4>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="radio" checked={editFormat === 'original'} onChange={() => setEditFormat('original')} />
                              <span>Manter original ({selectedFile.metadata?.mimetype})</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="radio" checked={editFormat === 'webp'} onChange={() => setEditFormat('webp')} />
                              <span className="font-medium text-green-700">Converter para WebP (Otimizado para Web)</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="radio" checked={editFormat === 'jpeg'} onChange={() => setEditFormat('jpeg')} />
                              <span>Converter para JPEG</span>
                            </label>
                          </div>
                        </div>

                        <div className="pt-6 border-t flex gap-3">
                          <button 
                            onClick={applyImageEdits}
                            disabled={processingImage}
                            className="px-6 py-2 bg-[#2271b1] text-white text-sm font-semibold rounded-[3px] hover:bg-[#135e96] disabled:opacity-50"
                          >
                            {processingImage ? 'A processar...' : 'Guardar Alterações'}
                          </button>
                          <button 
                            onClick={() => setIsEditingImage(false)}
                            className="px-6 py-2 border border-[#ccd0d4] text-sm font-semibold rounded-[3px] hover:bg-[#f6f7f7]"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detail Sidebar */}
              <div className="w-full md:w-[300px] bg-[#f6f7f7] border-l border-[#ccd0d4] overflow-y-auto p-4 space-y-4">
                <div className="text-[12px] text-[#50575e] space-y-1">
                  <p><strong>Carregado em:</strong> {selectedFile.created_at ? new Date(selectedFile.created_at).toLocaleDateString('pt-PT') : '-'}</p>
                  <p><strong>Nome:</strong> {selectedFile.name}</p>
                  <p><strong>Tipo:</strong> {selectedFile.metadata?.mimetype}</p>
                  <p><strong>Tamanho:</strong> {formatSize(selectedFile.metadata?.size || 0)}</p>
                </div>

                <hr className="border-[#ccd0d4]" />

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-[#50575e]">Texto alternativo</label>
                    <textarea 
                      value={metadata.alt_text}
                      onChange={(e) => setMetadata({...metadata, alt_text: e.target.value})}
                      className="w-full text-xs border border-[#ccd0d4] p-1.5 focus:border-[#2271b1] outline-none h-14 rounded-[3px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-[#50575e]">Título</label>
                    <input 
                      type="text"
                      value={metadata.title}
                      onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                      className="w-full text-xs border border-[#ccd0d4] p-1.5 focus:border-[#2271b1] outline-none rounded-[3px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-[#50575e]">Legenda</label>
                    <textarea 
                      value={metadata.caption}
                      onChange={(e) => setMetadata({...metadata, caption: e.target.value})}
                      className="w-full text-xs border border-[#ccd0d4] p-1.5 focus:border-[#2271b1] outline-none h-14 rounded-[3px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-[#50575e]">Descrição</label>
                    <textarea 
                      value={metadata.description}
                      onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                      className="w-full text-xs border border-[#ccd0d4] p-1.5 focus:border-[#2271b1] outline-none h-20 rounded-[3px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-[#50575e]">URL do ficheiro</label>
                    <input 
                      type="text"
                      readOnly
                      value={getPublicUrl(selectedFile.name)}
                      className="w-full text-[11px] border border-[#ccd0d4] p-1.5 bg-[#f0f0f1] rounded-[3px]"
                    />
                    <button onClick={() => copyUrl(selectedFile.name)} className="text-[11px] text-[#2271b1] hover:underline text-left mt-1">Copiar URL</button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#ccd0d4] flex justify-between items-center">
                  <button onClick={() => deleteSingle(selectedFile.name)} className="text-[12px] text-[#d63638] hover:underline">Eliminar permanentemente</button>
                  <button 
                    onClick={saveMetadata}
                    disabled={savingMetadata}
                    className="px-4 py-1.5 bg-[#2271b1] text-white text-sm font-semibold rounded-[3px] hover:bg-[#135e96] disabled:opacity-50"
                  >
                    {savingMetadata ? 'A guardar...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .bg-checkerboard {
          background-image: linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}
