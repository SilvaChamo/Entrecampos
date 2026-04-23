'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Copy, ExternalLink, RefreshCw, ImageIcon, Upload } from 'lucide-react';

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
    cacheControl: string;
  };
}

export default function MediaGallery() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BUCKET_NAME = 'news-images';

  // Carregar imagens do Storage
  const loadImages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .list();

      if (error) {
        throw error;
      }

      setFiles(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar imagens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // Deletar imagem
  const deleteImage = async (filename: string) => {
    if (!confirm(`Tem certeza que deseja eliminar "${filename}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .remove([filename]);

      if (error) {
        throw error;
      }

      setFiles(files.filter(f => f.name !== filename));
      if (selectedFile?.name === filename) {
        setSelectedFile(null);
      }
      
      alert('Imagem eliminada com sucesso!');
    } catch (err: any) {
      alert('Erro ao eliminar: ' + err.message);
    }
  };

  // Copiar URL para clipboard
  const copyUrl = (filename: string) => {
    const { data: { publicUrl } } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);
    
    navigator.clipboard.writeText(publicUrl);
    alert('URL copiada para clipboard!');
  };

  // Upload de nova imagem
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const filename = `${Date.now()}-${file.name}`;
      
      const { error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(filename, file);

      if (error) {
        throw error;
      }

      await loadImages();
      alert('Imagem carregada com sucesso!');
    } catch (err: any) {
      alert('Erro ao carregar: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Formatar tamanho
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Obter URL pública
  const getPublicUrl = (filename: string) => {
    const { data: { publicUrl } } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);
    return publicUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Galeria de Mídia</h1>
                <p className="text-sm text-gray-500">Gerir imagens do Supabase Storage</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadImages}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              
              <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                {uploading ? 'A carregar...' : 'Carregar Imagem'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
            <span className="ml-3 text-gray-600">A carregar imagens...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma imagem encontrada</h3>
            <p className="text-gray-500 mb-4">O bucket está vazio. Carregue algumas imagens.</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Carregar Imagem
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        ) : (
          <>
            {/* Estatísticas */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Total de imagens: <strong className="text-gray-900">{files.length}</strong>
                </span>
                <span className="text-gray-600">
                  Tamanho total: <strong className="text-gray-900">
                    {formatSize(files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0))}
                  </strong>
                </span>
              </div>
            </div>

            {/* Grid de imagens */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {files.map((file) => (
                <div
                  key={file.name}
                  className={`group relative bg-white rounded-lg shadow-sm border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    selectedFile?.name === file.name ? 'ring-2 ring-green-500' : ''
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  {/* Preview */}
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={getPublicUrl(file.name)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                      }}
                    />
                    
                    {/* Overlay com ações */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyUrl(file.name);
                        }}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Copiar URL"
                      >
                        <Copy className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getPublicUrl(file.name), '_blank');
                        }}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Ver imagem"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(file.name);
                        }}
                        className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatSize(file.metadata?.size || 0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(file.created_at).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Preview da imagem selecionada */}
        {selectedFile && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-lg">{selectedFile.name}</h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <img
                  src={getPublicUrl(selectedFile.name)}
                  alt={selectedFile.name}
                  className="max-w-full max-h-96 object-contain mx-auto"
                />
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nome:</span>
                    <span className="ml-2 font-medium">{selectedFile.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tamanho:</span>
                    <span className="ml-2 font-medium">{formatSize(selectedFile.metadata?.size || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <span className="ml-2 font-medium">{selectedFile.metadata?.mimetype}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Criado em:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedFile.created_at).toLocaleString('pt-PT')}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => copyUrl(selectedFile.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar URL
                  </button>
                  <button
                    onClick={() => window.open(getPublicUrl(selectedFile.name), '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Original
                  </button>
                  <button
                    onClick={() => deleteImage(selectedFile.name)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
