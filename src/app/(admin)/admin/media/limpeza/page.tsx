'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle,
  ChevronLeft,
  Search,
  ExternalLink,
  Eye,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface StorageFile {
  name: string;
  metadata?: {
    size: number;
    mimetype: string;
  };
}

export default function MediaCleanupPage() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [usedUrls, setUsedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewNews, setPreviewNews] = useState<any[] | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 48;

  const BUCKET_NAME = 'news-images';
  const PROTECTED_KEYWORDS = ['logo', 'background', 'bg', 'banner', 'footer', 'header', 'branding', 'site', 'brand'];

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all files in bucket
      const { data: storageData, error: storageError } = await supabase.storage.from(BUCKET_NAME).list('', {
        limit: 1000
      });
      if (storageError) throw storageError;

      // 2. Fetch all used URLs in news
      const { data: newsData, error: newsError } = await supabase.from('news').select('image_url');
      if (newsError) throw newsError;

      const urls = newsData?.map((n: any) => n.image_url).filter(Boolean) as string[];
      
      setFiles(storageData || []);
      setUsedUrls(urls);
    } catch (err: any) {
      alert('Erro ao carregar dados: ' + err.message);
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

  const isProtected = (name: string) => {
    const lowerName = name.toLowerCase();
    return PROTECTED_KEYWORDS.some(k => lowerName.includes(k));
  };

  const isUsed = (fileName: string) => {
    if (!fileName) return false;
    
    // 1. Limpar o nome do ficheiro (ex: remover timestamps do Supabase)
    // Ex: "1777018297806-imagem.jpg" -> "imagem.jpg"
    const cleanFileName = fileName.split('-').slice(1).join('-').toLowerCase() || fileName.toLowerCase();
    const originalFileName = fileName.toLowerCase();

    return usedUrls.some(url => {
      if (!url) return false;
      const cleanUrl = url.replace('<![CDATA[', '').replace(']]>', '').toLowerCase();
      
      // 2. Verificar se o nome (com ou sem timestamp) aparece no URL da base de dados
      return cleanUrl.includes(originalFileName) || 
             (cleanFileName.length > 5 && cleanUrl.includes(cleanFileName));
    });
  };

  const findMatchingNews = async (fileName: string) => {
    setPreviewFileName(fileName);
    setPreviewNews([]);
    
    try {
      // Procurar notícias que possam mencionar este ficheiro no image_url ou conteúdo
      const { data } = await supabase
        .from('news')
        .select('id, title, image_url')
        .or(`image_url.ilike.%${fileName}%,content.ilike.%${fileName}%`)
        .limit(5);
      
      setPreviewNews(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const orphans = files.filter(f => {
    const used = isUsed(f.name);
    const protected_file = isProtected(f.name);
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return !used && !protected_file && matchesSearch;
  });

  const toggleSelect = (name: string) => {
    const next = new Set(selectedNames);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedNames(next);
  };

  const deleteSelected = async () => {
    if (selectedNames.size === 0) return;
    if (!confirm(`Deseja eliminar permanentemente os ${selectedNames.size} ficheiros selecionados? Esta ação não pode ser revertida.`)) return;

    setDeleting(true);
    try {
      const names = Array.from(selectedNames);
      const { error } = await supabase.storage.from(BUCKET_NAME).remove(names);
      if (error) throw error;

      alert(`${names.length} ficheiros eliminados com sucesso!`);
      setSelectedNames(new Set());
      loadData();
    } catch (err: any) {
      alert('Erro ao eliminar: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-normal text-[#1d2327]">Auditoria de Media</h1>
          <p className="text-[13px] text-[#50575e]">Identifique e remova imagens que não estão associadas a nenhuma notícia.</p>
        </div>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#ccd0d4] rounded-[3px] text-sm font-semibold hover:bg-[#f6f7f7]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 border border-[#ccd0d4] rounded-lg shadow-sm">
            <p className="text-sm text-[#50575e] uppercase font-bold mb-1">Total de Ficheiros</p>
            <p className="text-4xl font-black text-[#1d2327]">{files.length}</p>
          </div>
          <div className="bg-white p-6 border border-[#ccd0d4] rounded-lg shadow-sm border-l-4 border-l-green-500">
            <p className="text-sm text-[#50575e] uppercase font-bold mb-1">Em Uso / Protegidos</p>
            <p className="text-4xl font-black text-green-600">{files.length - orphans.length}</p>
          </div>
          <div className="bg-white p-6 border border-[#ccd0d4] rounded-lg shadow-sm border-l-4 border-l-amber-500">
            <p className="text-sm text-[#50575e] uppercase font-bold mb-1">Imagens Órfãs (Lixo)</p>
            <p className="text-4xl font-black text-amber-600">{orphans.length}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white border border-[#ccd0d4] p-4 rounded-t-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input 
                type="text" 
                placeholder="Pesquisar entre as órfãs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border-[#ccd0d4] rounded-[3px] text-sm outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#50575e]" />
            </div>
            <button 
              onClick={() => {
                if (selectedNames.size === orphans.length) setSelectedNames(new Set());
                else setSelectedNames(new Set(orphans.map(f => f.name)));
              }}
              className="text-sm text-[#2271b1] hover:underline font-medium whitespace-nowrap"
            >
              {selectedNames.size === orphans.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-sm text-[#50575e]">{selectedNames.size} selecionados</span>
            <button 
              onClick={deleteSelected}
              disabled={selectedNames.size === 0 || deleting}
              className="flex items-center gap-2 px-6 py-2 bg-[#d63638] text-white rounded-[3px] text-sm font-bold hover:bg-[#b32d2e] disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'A eliminar...' : 'Eliminar Permanentemente'}
            </button>
          </div>
        </div>

        {/* Orphans Grid with Pagination */}
        <div className="bg-white border-x border-b border-[#ccd0d4] p-6 rounded-b-lg min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-12 h-12 text-[#2271b1] animate-spin mb-4" />
              <p className="text-[#50575e]">A analisar a biblioteca e base de dados...</p>
            </div>
          ) : orphans.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {orphans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((file) => (
                  <div 
                    key={file.name}
                    className={`relative aspect-square border rounded overflow-hidden transition-all flex flex-col ${
                      selectedNames.has(file.name) 
                        ? 'ring-4 ring-[#2271b1] border-[#2271b1]' 
                        : 'border-[#ccd0d4] hover:border-[#2271b1]'
                    }`}
                  >
                    <div 
                      onClick={() => toggleSelect(file.name)}
                      className="flex-1 cursor-pointer bg-[#f0f0f1]"
                    >
                      <img 
                        src={getPublicUrl(file.name)} 
                        className="w-full h-full object-cover"
                        alt={file.name}
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="bg-white p-1.5 border-t border-[#f0f0f1] flex items-center justify-between gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          findMatchingNews(file.name);
                        }}
                        className="flex-1 h-7 bg-[#f6f7f7] border border-[#ccd0d4] rounded-[3px] text-[11px] font-semibold hover:bg-white transition-all flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Detalhes
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Eliminar "${file.name}" permanentemente?`)) {
                            setDeleting(true);
                            try {
                              await supabase.storage.from(BUCKET_NAME).remove([file.name]);
                              loadData();
                            } catch (err) { alert('Erro ao eliminar'); }
                            finally { setDeleting(false); }
                          }
                        }}
                        className="w-8 h-7 bg-[#d63638]/10 text-[#d63638] border border-[#d63638]/20 rounded-[3px] hover:bg-[#d63638] hover:text-white transition-all flex items-center justify-center"
                        title="Eliminar agora"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {selectedNames.has(file.name) && (
                      <div className="absolute top-2 right-2 bg-[#2271b1] text-white p-1 rounded-sm pointer-events-none">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {orphans.length > ITEMS_PER_PAGE && (
                <div className="mt-8 flex items-center justify-center gap-4 border-t pt-6">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="px-4 py-2 border border-[#ccd0d4] rounded text-sm disabled:opacity-30"
                  >
                    Anterior
                  </button>
                  <span className="text-sm font-medium">Página {currentPage} de {Math.ceil(orphans.length / ITEMS_PER_PAGE)}</span>
                  <button 
                    disabled={currentPage >= Math.ceil(orphans.length / ITEMS_PER_PAGE)}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-4 py-2 border border-[#ccd0d4] rounded text-sm disabled:opacity-30"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-[#1d2327]">Biblioteca Limpa!</h3>
              <p className="text-[#50575e] max-w-md">Não foram encontradas imagens órfãs. Todos os ficheiros estão em uso ou são ficheiros de sistema protegidos.</p>
            </div>
          )}
        </div>

        {/* Warning Section */}
        <div className="mt-8 bg-amber-50 border border-amber-200 p-6 rounded-lg flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-amber-900 mb-1">Como funciona esta ferramenta?</h4>
            <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
              <li>Identificamos imagens que <strong>não aparecem</strong> em nenhuma notícia na base de dados.</li>
              <li>Ficheiros que contêm palavras como "logo" ou "background" são <strong>protegidos automaticamente</strong>.</li>
              <li>Se carregou uma imagem mas não a usou em nenhuma notícia, ela aparecerá aqui como órfã.</li>
              <li><strong>Recomendação:</strong> Verifique as miniaturas antes de apagar.</li>
            </ul>
          </div>
        </div>

        {/* PREVIEW MODAL */}
        {previewFileName && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-[#ccd0d4]">
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  <div className="w-32 h-32 border rounded overflow-hidden shrink-0">
                    <img src={getPublicUrl(previewFileName)} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1d2327] mb-2 truncate max-w-[300px]">{previewFileName}</h3>
                    <p className="text-sm text-[#50575e]">Estamos a verificar se existe alguma notícia que possa usar esta imagem.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#50575e] uppercase tracking-wider">Notícias Relacionadas (Potenciais)</h4>
                  {previewNews && previewNews.length > 0 ? (
                    previewNews.map(news => (
                      <div key={news.id} className="p-3 bg-amber-50 border border-amber-200 rounded flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-900 truncate max-w-[300px]">{news.title}</span>
                        </div>
                        <Link href={`/admin/noticias/editar/${news.id}`} className="text-xs text-[#2271b1] hover:underline">Ver Notícia</Link>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-800">Nenhuma notícia encontrada com este nome de ficheiro.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-[#f6f7f7] p-4 flex justify-end border-t border-[#ccd0d4]">
                <button 
                  onClick={() => { setPreviewFileName(null); setPreviewNews(null); }}
                  className="px-6 py-2 bg-[#2271b1] text-white text-sm font-bold rounded hover:bg-[#135e96]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
