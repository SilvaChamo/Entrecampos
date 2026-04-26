'use client';

import { useState } from 'react';
import { X, ImageIcon, Upload, RefreshCw, Check, AlertCircle, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MediaLibrary from './MediaLibrary';
import ImageEditor from './ImageEditor';

interface ImageSelectorProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  currentImageUrl?: string;
}

export default function ImageSelector({ onSelect, onClose, currentImageUrl }: ImageSelectorProps) {
  const [tab, setTab] = useState<'upload' | 'library'>('upload');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState<{ exists: boolean; url?: string; name?: string } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editedBlob, setEditedBlob] = useState<Blob | null>(null);

  const BUCKET_NAME = 'news-images';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      
      // Check for duplicates
      setUploading(true);
      try {
        const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
          search: file.name
        });
        
        if (data && data.length > 0) {
          const existingFile = data.find((f: any) => f.name === file.name);
          if (existingFile) {
            const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(existingFile.name);
            setDuplicateCheck({ exists: true, url: urlData.publicUrl, name: existingFile.name });
          } else {
            setDuplicateCheck(null);
          }
        } else {
          setDuplicateCheck(null);
        }
      } catch (err) {
        console.error('Error checking duplicate:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  const uploadAndSelect = async (useExisting = false) => {
    if (useExisting && duplicateCheck?.url) {
      onSelect(duplicateCheck.url);
      onClose();
      return;
    }

    if (!uploadFile && !editedBlob) return;

    setUploading(true);
    try {
      let fileName: string;
      let fileToUpload: Blob | File;

      if (editedBlob) {
        // Usar imagem editada (sempre PNG)
        const baseName = uploadFile?.name.replace(/\.[^/.]+$/, '') || 'image';
        fileName = `${baseName}_edited_${Date.now()}.png`;
        fileToUpload = editedBlob;
      } else if (uploadFile) {
        // Usar arquivo original
        fileName = uploadFile.name;
        if (!useExisting && duplicateCheck?.exists) {
          const ext = fileName.split('.').pop();
          const baseName = fileName.replace(`.${ext}`, '');
          fileName = `${baseName}_${Date.now()}.${ext}`;
        }
        fileToUpload = uploadFile;
      } else {
        return;
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileToUpload, {
          contentType: 'image/png',
        });
      
      if (error) throw error;
      
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
      
      onSelect(data.publicUrl);
      onClose();
    } catch (err: any) {
      alert('Erro ao carregar: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handler para salvar do editor
  const handleEditorSave = (blob: Blob, fileName: string) => {
    setEditedBlob(blob);
    setShowEditor(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#ccd0d4] bg-white shrink-0">
        <h2 className="text-[18px] font-semibold text-[#1d2327]">Imagem de destaque</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#ccd0d4] bg-white shrink-0">
        <button 
          onClick={() => setTab('upload')}
          className={`px-6 py-3 text-[13px] font-medium transition-all ${
            tab === 'upload' 
              ? 'border-b-2 border-[#2271b1] text-[#2271b1]' 
              : 'text-[#50575e] hover:text-[#2271b1]'
          }`}
        >
          Carregar ficheiros
        </button>
        <button 
          onClick={() => setTab('library')}
          className={`px-6 py-3 text-[13px] font-medium transition-all ${
            tab === 'library' 
              ? 'border-b-2 border-[#2271b1] text-[#2271b1]' 
              : 'text-[#50575e] hover:text-[#2271b1]'
          }`}
        >
          Biblioteca multimédia
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#f0f0f1]">
        {tab === 'upload' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-0">
            {!uploadFile ? (
              <div className="max-w-md w-full text-center">
                <div className="mb-6 p-12 border-2 border-dashed border-[#ccd0d4] rounded-lg bg-white/50 flex flex-col items-center">
                  <Upload className="w-12 h-12 text-[#ccd0d4] mb-4" />
                  <p className="text-[16px] text-[#3c434a] mb-4">Largue o ficheiro aqui para carregar</p>
                  <p className="text-[13px] text-[#50575e] mb-4">ou</p>
                  <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2271b1] text-white rounded-[4px] text-[13px] font-bold hover:bg-[#135e96] cursor-pointer transition-all shadow-sm">
                    <span>Seleccionar ficheiro</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
                <p className="text-[12px] text-[#50575e]">Tamanho máximo do ficheiro: 1 GB.</p>
              </div>
            ) : (
              <div className="max-w-2xl w-full bg-white border border-[#ccd0d4] rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex gap-6">
                    <div className="w-48 h-48 shrink-0 border border-[#ccd0d4] rounded bg-gray-50 overflow-hidden shadow-inner relative">
                      {editedBlob ? (
                        <img 
                          src={URL.createObjectURL(editedBlob)} 
                          className="w-full h-full object-cover" 
                          alt="Preview Editado" 
                        />
                      ) : (
                        <img 
                          src={URL.createObjectURL(uploadFile)} 
                          className="w-full h-full object-cover" 
                          alt="Preview" 
                        />
                      )}
                      <button
                        onClick={() => setShowEditor(true)}
                        className="absolute bottom-2 right-2 p-2 bg-[#2271b1] text-white rounded-full shadow-lg hover:bg-[#135e96] transition-all"
                        title="Editar imagem"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-bold text-[#1d2327] mb-1">{uploadFile.name}</h3>
                        <p className="text-xs text-[#50575e]">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        {editedBlob && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-100 text-green-700 text-[11px] rounded font-medium">
                            <Check className="w-3 h-3" />
                            Editada (será gravada como PNG)
                          </span>
                        )}
                      </div>

                      {duplicateCheck?.exists && (
                        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded flex gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          <div className="text-sm">
                            <p className="font-bold text-amber-800 mb-1">Este ficheiro já existe!</p>
                            <p className="text-amber-700">Uma imagem com o nome <strong>{duplicateCheck.name}</strong> já está na biblioteca.</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                        {duplicateCheck?.exists ? (
                          <>
                            <button
                              onClick={() => uploadAndSelect(true)}
                              className="px-4 py-2 bg-white border border-[#2271b1] text-[#2271b1] text-[13px] font-bold rounded hover:bg-[#f6f7f7] transition-all flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" /> Usar existente
                            </button>
                            <button
                              onClick={() => uploadAndSelect(false)}
                              disabled={uploading}
                              className="px-4 py-2 bg-[#2271b1] text-white text-[13px] font-bold rounded hover:bg-[#135e96] transition-all disabled:opacity-50"
                            >
                              {uploading ? 'A carregar...' : (editedBlob ? 'Gravar PNG novo' : 'Carregar como novo')}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => uploadAndSelect(false)}
                            disabled={uploading}
                            className="px-6 py-2.5 bg-[#2271b1] text-white text-[13px] font-bold rounded hover:bg-[#135e96] transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploading ? 'A carregar...' : (editedBlob ? 'Gravar PNG e definir' : 'Carregar e definir')}
                          </button>
                        )}
                        <button
                          onClick={() => { setUploadFile(null); setDuplicateCheck(null); setEditedBlob(null); }}
                          disabled={uploading}
                          className="px-4 py-2 border border-[#ccd0d4] text-[#50575e] text-[13px] font-bold rounded hover:bg-gray-50 transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <MediaLibrary 
              isModal 
              onSelect={(url) => {
                onSelect(url);
                onClose();
              }} 
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#ccd0d4] bg-[#f6f7f7] flex justify-between items-center shrink-0">
        <div className="text-xs text-[#50575e]">
          {tab === 'upload' ? 'Os ficheiros carregados serão guardados permanentemente.' : 'Seleccione uma imagem da sua biblioteca.'}
        </div>
        <button 
          onClick={onClose}
          className="px-6 py-2 bg-[#2271b1] text-white text-[13px] font-bold rounded-[4px] hover:bg-[#135e96] transition-all"
        >
          Fechar
        </button>
      </div>

      {/* Image Editor Modal */}
      {showEditor && uploadFile && (
        <ImageEditor
          imageUrl={URL.createObjectURL(uploadFile)}
          onSave={handleEditorSave}
          onClose={() => setShowEditor(false)}
          originalFileName={uploadFile.name}
        />
      )}
    </div>
  );
}
