'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { supabase, STORAGE_BUCKET as BUCKET_NAME } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  Trash2, 
  Archive, 
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
  Check,
  FileArchive
} from 'lucide-react';
import { SkeletonMediaGrid } from '@/components/Admin/Skeleton';
import { prepareImage } from '@/lib/client-image';
import ArquivoFolders, { type FolderInfo } from '@/components/Admin/ArquivoFolders';

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

/** Tipo de ficheiro pela extensão. */
function kindOf(name: string): string {
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/i.test(name)) return 'imagens';
  if (/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i.test(name)) return 'videos';
  if (/\.pdf$/i.test(name)) return 'pdf';
  if (/\.(mp3|wav|aac|ogg|flac|m4a|wma)$/i.test(name)) return 'audio';
  return 'documentos';
}

/** Miniatura: foto para imagens; para os outros tipos, um quadro com a extensão. */
function FileThumb({ name, url, className = 'w-full h-full object-cover' }: { name: string; url: string; className?: string }) {
  if (kindOf(name) === 'imagens') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} className={className} alt="" loading="lazy" />;
  }
  const ext = (name.split('.').pop() || '').toUpperCase();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#f6f7f7] text-[#50575e]">
      <span className="text-[11px] font-bold tracking-wider">{ext}</span>
      <span className="max-w-full truncate px-2 text-[10px]">{name.split('/').pop()}</span>
    </div>
  );
}

export type MediaSource = 'galeria' | 'arquivo' | 'partilhado';

export type MediaGalleryViewProps = {
  /** Biblioteca mostrada: galeria geral, uma pasta do arquivo de fotos ou as fotos partilhadas (e-mail). */
  source?: MediaSource;
  /** Pasta do arquivo (quando source = "arquivo"). */
  pasta?: string;
  title?: string;
  /** Modo "escolher": clicar numa foto devolve o seu endereço (as de outras bibliotecas passam antes para a galeria). */
  pick?: (url: string) => void | Promise<void>;
  /** Sem a margem de página (para ficar dentro de outra página). */
  embedded?: boolean;
  /** Linha própria, por cima da barra de menu, à esquerda (separadores Galeria / Arquivo / Partilhadas). */
  tabsRow?: ReactNode;
  /** Mudar este valor volta a ler a lista. */
  reloadKey?: number;
  /** Filtro inicial pelo nome (ex.: as fotos que saíram de um zip). */
  initialQuery?: string;
  /** Zips de fotos (fotos partilhadas): aparecem no selector de tipo; escolher um descompacta-o na página. */
  zipOptions?: { path: string; label: string }[];
  onPickZip?: (path: string) => void;
  /** Texto de estado por zip (ex.: "A descompactar…"), mostrado dentro do mosaico do zip. */
  zipStatus?: Record<string, string>;
  /** Arquivo sem pasta aberta: mostra as pastas no lugar das fotos, com o mesmo cabeçalho da galeria. */
  folders?: FolderInfo[];
  onOpenFolder?: (slug: string) => void;
  /** O botão "Adicionar" fica visível mas inutilizado (fotos partilhadas e arquivo, que têm o seu sítio próprio). */
  uploadDisabled?: boolean;
  /** Só a grelha de fotos (sem cabeçalho nem barra de menu): para mostrar dentro de outra página. */
  bare?: boolean;
  /** Na grelha simples: mostrar a reciclagem (fotos eliminadas) em vez das fotos. */
  binMode?: boolean;
  /** Grelha simples com no máximo 4 colunas (2 em ecrã pequeno), em vez das 7 da galeria. */
  fourCols?: boolean;
};

export default function MediaGalleryView({ source = 'galeria', pasta = '', title = 'Biblioteca multimédia', pick, embedded, tabsRow, reloadKey = 0, initialQuery = '', zipOptions, onPickZip, zipStatus, folders: folderList, onOpenFolder, uploadDisabled, bare, binMode, fourCols }: MediaGalleryViewProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [busyMsg, setBusyMsg] = useState('');
  // Na grelha simples, a seleção em massa sobe para a linha dos separadores da página (se existir).
  const [bulkSlot, setBulkSlot] = useState<HTMLElement | null>(null);
  const [checkSlot, setCheckSlot] = useState<HTMLElement | null>(null);
  // Confirmação de eliminar (popup da própria página: os diálogos nativos do navegador podem não aparecer).
  const [pendingDel, setPendingDel] = useState<{ names: string[]; single: boolean } | null>(null);
  useEffect(() => {
    if (!bare) return;
    setBulkSlot(document.getElementById('ec-bulk-slot'));
    setCheckSlot(document.getElementById('ec-bulk-check'));
  }, [bare]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const { user } = useAuth();
  // Contribuidor manda para o lixo; só administrador e editor veem o lixo, restauram e eliminam para sempre.
  const canSeeTrash = user?.role === 'admin' || user?.role === 'editor';
  const [view, setView] = useState<'galeria' | 'arquivo' | 'lixo'>('galeria');
  const showTrash = view === 'lixo';
  const special = view !== 'galeria'; // arquivadas ou lixo
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


  const loadImages = async () => {
    if (folderList) { setLoading(false); return; }
    setLoading(true);
    try {
      // Pelo servidor: devolve todas as imagens do site (a biblioteca geral) a quem tem acesso a multimédia.
      const qs = new URLSearchParams();
      if (special) qs.set('view', showTrash ? 'trash' : 'archive');
      if (source !== 'galeria') qs.set('source', source);
      if (source === 'arquivo') qs.set('pasta', pasta);
      const res = await fetch(`/api/admin/media/list${qs.size ? `?${qs}` : ''}`, { credentials: 'include' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Não foi possível carregar a biblioteca.');
      setFiles(body.files || []);
    } catch (err: any) {
      console.error('Erro ao carregar imagens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectedFile(null);
    setCurrentPage(1);
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, source, pasta, reloadKey]);

  useEffect(() => { setSearchQuery(initialQuery); }, [initialQuery]);
  useEffect(() => { if (bare) setView(binMode ? 'lixo' : 'galeria'); }, [bare, binMode]);
  // A lixeira da página avisa-se por eventos: a página sabe quantas fotos estão selecionadas e pede a confirmação de eliminar.
  useEffect(() => {
    if (!bare) return;
    window.dispatchEvent(new CustomEvent('ec-bulk-count', { detail: selectedIds.size }));
    return () => { window.dispatchEvent(new CustomEvent('ec-bulk-count', { detail: 0 })); };
  }, [bare, selectedIds]);
  useEffect(() => {
    if (!bare) return;
    const ask = () => { if (selectedIds.size > 0) setPendingDel({ names: Array.from(selectedIds), single: false }); };
    window.addEventListener('ec-bulk-delete', ask);
    return () => window.removeEventListener('ec-bulk-delete', ask);
  }, [bare, selectedIds]);


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

  const notify = (msg: string) => {
    setBusyMsg(msg);
    setTimeout(() => setBusyMsg((cur) => (cur === msg ? '' : cur)), 7000);
  };

  /** Elimina de verdade (para o lixo, ou para sempre quando já se está no lixo). Chamado depois da confirmação. */
  const performDelete = async (names: string[]) => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/media/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: showTrash ? 'purge' : 'trash', names }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível eliminar.');

      setSelectedIds(new Set());
      setIsBulkMode(false);
      setSelectedFile(null);
      loadImages();
      notify(showTrash ? 'Eliminada para sempre.' : 'Movida para o lixo.');
    } catch (err: any) {
      notify('Erro ao eliminar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    setPendingDel({ names: Array.from(selectedIds), single: false });
  };

  const archive = async (names: string[]) => {
    try {
      const res = await fetch('/api/admin/media/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', names }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível arquivar.');
      setSelectedFile(null);
      setSelectedIds(new Set());
      setIsBulkMode(false);
      loadImages();
      notify('Arquivada. Vê-a no botão das arquivadas da galeria.');
    } catch (err: any) {
      notify('Erro: ' + err.message);
    }
  };

  const restore = async (names: string[]) => {
    try {
      const res = await fetch('/api/admin/media/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', names }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível restaurar.');
      setSelectedFile(null);
      setSelectedIds(new Set());
      setIsBulkMode(false);
      loadImages();
      notify('Restaurada.');
    } catch (err: any) {
      notify('Erro: ' + err.message);
    }
  };

  const deleteSingle = (filename: string) => setPendingDel({ names: [filename], single: true });

  /** Copia fotos para a galeria geral ou para uma pasta do arquivo (o original fica onde está). */
  const transfer = async (names: string[], to: 'galeria' | 'arquivo', toPasta?: string) => {
    const res = await fetch('/api/admin/media/transfer', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names, to, pasta: toPasta }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Não foi possível copiar.');
    return body.done as { from: string; name: string; url: string }[];
  };

  /** Modo escolher: devolve o endereço da foto; se vier do arquivo ou das partilhadas, passa antes para a galeria. */
  const choose = async (file: StorageFile) => {
    if (!pick) return;
    setBusyMsg('A usar a foto…');
    try {
      let url = getPublicUrl(file.name);
      if (source !== 'galeria') url = (await transfer([file.name], 'galeria'))[0].url;
      await pick(url);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setBusyMsg('');
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
        img.src = `${getPublicUrl(selectedFile.name)}?edit=${Date.now()}`;
        await new Promise(r => { img.onload = r; img.onerror = r; });
        if (!img.width) return;

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
      // Nunca fica à espera para sempre: falha de carregamento ou demora a mais dão erro claro.
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('A imagem demorou demasiado a carregar.')), 20000);
        img.onload = () => { clearTimeout(timer); resolve(); };
        img.onerror = () => { clearTimeout(timer); reject(new Error('Não foi possível carregar a imagem para edição.')); };
        img.src = `${getPublicUrl(selectedFile.name)}?edit=${Date.now()}`; // sem isto o navegador reutiliza a cópia da grelha (sem CORS) e a edição falha
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const finalWidth = editWidth || img.width;
      const finalHeight = editHeight || img.height;

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      if (ctx) {
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
      }

      const original = selectedFile.metadata?.mimetype || (/\.png$/i.test(selectedFile.name) ? 'image/png' : /\.webp$/i.test(selectedFile.name) ? 'image/webp' : 'image/jpeg');
      const mimeType = editFormat === 'webp' ? 'image/webp' : editFormat === 'jpeg' ? 'image/jpeg' : original;
      const extension = editFormat === 'webp' ? '.webp' : editFormat === 'jpeg' ? '.jpg' : '.' + selectedFile.name.split('.').pop();

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível processar a imagem.'))), mimeType, 0.85); // 0.85 qualidade otimizada
      });

      const newFileName = selectedFile.name.replace(/\.[^/.]+$/, "") + (editFormat !== 'original' ? `_edited${extension}` : extension);

      // Grava pelo servidor (a gravação a partir do navegador falha sem aviso).
      const form = new FormData();
      form.append('file', new File([blob], newFileName.split('/').pop() || 'imagem', { type: blob.type || mimeType }));
      form.append('name', newFileName);
      const res = await fetch('/api/admin/media/replace', { method: 'POST', credentials: 'include', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível guardar a imagem.');

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
    <div className={embedded ? 'text-[#2c3338]' : 'min-h-screen text-[#2c3338] p-6'}>
      <div className="w-full">
        {!bare && (
        <>
        {/* Header Estilo WP */}
        <div className="pt-0 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:flex-nowrap">
            <h1 className="whitespace-nowrap text-2xl font-normal">{title}</h1>
            <div className="flex max-w-full flex-nowrap items-center gap-1.5 overflow-x-auto sm:gap-2">
            {/* O botão está sempre na linha; fica inutilizado onde não serve (arquivo fora da pasta e fotos partilhadas). */}
            <label
              aria-disabled={uploadDisabled || !!folderList}
              title={uploadDisabled || folderList ? (source === 'partilhado' ? 'As fotos partilhadas chegam por e-mail.' : 'No Arquivo, as fotos adicionam-se dentro de cada pasta (menu Arquivo de fotos).') : undefined}
              className={`inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap px-1.5 sm:px-2 2xl:px-3 text-center bg-white border border-[#00a651] text-[#008f45] rounded-[3px] text-[10px] sm:text-xs 2xl:text-sm font-semibold transition-all ${uploadDisabled || folderList ? 'cursor-not-allowed opacity-40' : 'hover:bg-[#f6f7f7] cursor-pointer'}`}
            >
              {uploading ? 'A carregar...' : (<><span className="2xl:hidden">Adicionar</span><span className="hidden 2xl:inline">Adicionar ficheiros multimédia</span></>)}
              <input
                type="file"
                className="hidden"
                disabled={uploadDisabled || !!folderList}
                accept={source !== 'galeria' ? 'image/*' : 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt'}
                multiple
                onChange={async (e) => {
                  const filesToUpload = e.target.files ? Array.from(e.target.files) : [];
                  e.target.value = '';
                  if (filesToUpload.length === 0) return;

                  setUploading(true);
                  let successCount = 0;
                  let lastError = '';

                  for (const original of filesToUpload) {
                    setBusyMsg(`A carregar ${successCount + 1} de ${filesToUpload.length}…`);
                    if (source !== 'galeria') {
                      const file = await prepareImage(original);
                      const form = new FormData();
                      form.append('file', file);
                      if (source === 'arquivo') form.append('pasta', pasta);
                      else form.append('destino', 'partilhado');
                      const res = await fetch('/api/admin/arquivo/upload', { method: 'POST', credentials: 'include', body: form });
                      if (res.ok) successCount++;
                      else lastError = (await res.json().catch(() => ({}))).error || 'Erro ao carregar.';
                    } else {
                      // Mantém o nome original; se já existir, acrescenta -2, -3… (nunca substitui uma foto)
                      const safe = original.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\.-]/g, '_');
                      const dot = safe.lastIndexOf('.');
                      const stem = dot > 0 ? safe.slice(0, dot) : safe;
                      const ext = dot > 0 ? safe.slice(dot) : '';
                      let error: { message: string } | null = null;
                      for (let n = 1; n <= 30; n++) {
                        ({ error } = await supabase.storage.from(BUCKET_NAME).upload(`${stem}${n > 1 ? `-${n}` : ''}${ext}`, original));
                        if (!error || !/exist|duplicate|409/i.test(error.message)) break;
                      }
                      if (!error) successCount++;
                      else lastError = error.message;
                    }
                  }

                  setBusyMsg('');
                  if (successCount > 0) {
                    alert(`${successCount} ficheiro(s) carregado(s) com sucesso!${lastError ? `\n\nAlguns falharam: ${lastError}` : ''}`);
                    loadImages();
                  } else if (lastError) alert('Não foi possível carregar: ' + lastError);
                  setUploading(false);
                }}
              />
            </label>
            {tabsRow}
            </div>
          </div>

          <div className="flex items-center gap-2 max-md:w-full">
          <div className="relative max-md:flex-1">
            <input 
              type="text" 
              placeholder="Procurar itens multimédia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-2 border-[#ccd0d4] rounded-[3px] text-sm outline-none focus:border-[#00a651] focus:ring-1 focus:ring-[#00a651] w-40 lg:w-48 2xl:w-64 max-md:w-full"
            />
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#50575e]" />
          </div>
          {canSeeTrash && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView((v) => (v === 'arquivo' ? 'galeria' : 'arquivo'))}
                title={view === 'arquivo' ? 'Voltar à galeria' : 'Arquivadas'}
                aria-pressed={view === 'arquivo'}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${view === 'arquivo' ? 'border-[#00a651] bg-[#00a651] text-white' : 'border-[#ccd0d4] bg-white text-[#50575e] hover:bg-[#f6f7f7]'}`}
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView((v) => (v === 'lixo' ? 'galeria' : 'lixo'))}
                title={view === 'lixo' ? 'Voltar à galeria' : 'Lixo'}
                aria-pressed={view === 'lixo'}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${view === 'lixo' ? 'border-[#d63638] bg-[#d63638] text-white' : 'border-[#ccd0d4] bg-white text-[#50575e] hover:bg-[#f6f7f7]'}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

        {/* Toolbar de Filtros - AGORA FIXA */}
        <div className="ec-sticky-bar sticky z-40 bg-[#f0f0f1] pt-4 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-[#ccd0d4] p-2 gap-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 max-md:w-full">
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
                className="ml-2 max-md:ml-0 h-8 max-md:min-w-[130px] max-md:flex-1 text-sm border-[#ccd0d4] rounded-md bg-white px-2"
                value={fileTypeFilter}
                onChange={(e) => {
                  if (e.target.value.startsWith('zip:')) onPickZip?.(e.target.value.slice(4)); // descompacta na página; o filtro fica como estava
                  else setFileTypeFilter(e.target.value);
                }}
              >
                <option value="todos">Todos os ficheiros</option>
                <option value="imagens">Imagens</option>
                <option value="videos">Vídeos</option>
                <option value="documentos">Documentos</option>
                <option value="pdf">PDF</option>
                <option value="audio">Áudio</option>
                {zipOptions && zipOptions.length > 0 && (
                  <optgroup label="Zip de fotos partilhadas">
                    {zipOptions.map((z) => <option key={z.path} value={`zip:${z.path}`}>{z.label}</option>)}
                  </optgroup>
                )}
              </select>
              
              <select 
                className="h-8 max-md:min-w-[130px] max-md:flex-1 text-sm border-[#ccd0d4] rounded-md bg-white px-2"
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
                  className="ml-2 max-md:ml-0 h-8 px-4 text-sm font-normal border border-[#ccd0d4] rounded-md bg-white hover:bg-[#f6f7f7] whitespace-nowrap"
                >
                  Seleção em massa
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 ml-2 max-md:ml-0">
                  {canSeeTrash && view === 'galeria' && (
                    <span
                      onClick={selectedIds.size > 0 ? () => archive(Array.from(selectedIds)) : undefined}
                      className={`text-sm whitespace-nowrap ${selectedIds.size > 0 ? 'text-[#2271b1] cursor-pointer hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
                    >
                      Arquivar ({selectedIds.size})
                    </span>
                  )}
                  {view !== 'arquivo' && <span 
                    onClick={selectedIds.size > 0 ? deleteSelected : undefined}
                    className={`text-sm whitespace-nowrap ${selectedIds.size > 0 ? 'text-[#d63638] cursor-pointer hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    {showTrash ? 'Eliminar para sempre' : 'Mover para o lixo'} ({selectedIds.size})
                  </span>}
                  {special && (
                    <span
                      onClick={selectedIds.size > 0 ? () => restore(Array.from(selectedIds)) : undefined}
                      className={`text-sm whitespace-nowrap ${selectedIds.size > 0 ? 'text-[#2271b1] cursor-pointer hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
                    >
                      Restaurar ({selectedIds.size})
                    </span>
                  )}
                  <button 
                    onClick={() => { setIsBulkMode(false); setSelectedIds(new Set()); }}
                    className="h-8 px-4 text-sm font-semibold border border-[#ccd0d4] rounded-md bg-white hover:bg-[#f6f7f7] whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              {/* Paginação Superior */}
              <div className="flex items-center gap-2 text-[13px] text-[#50575e] whitespace-nowrap">
                <span>{folderList ? folderList.length : filteredFiles.length} itens</span>
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

        </>
        )}

        {busyMsg && !selectedFile && (
          <div role="status" className="mb-2 rounded border border-[#00a651] bg-white px-3 py-2 text-sm font-semibold text-[#008f45]">{busyMsg}</div>
        )}

        {/* Content */}
        {folderList ? (
          folderList.length === 0 ? (
            <p className="py-6 text-sm text-[#50575e]">Ainda não há pastas no arquivo. Crie uma em “Arquivo de fotos”.</p>
          ) : (
            <ArquivoFolders folders={folderList.filter((f) => f.nome.toLowerCase().includes(searchQuery.toLowerCase()))} onOpen={onOpenFolder} fourCols />
          )
        ) : loading ? (
          <SkeletonMediaGrid count={14} />
        ) : bare && viewMode === 'grid' ? (
          <>
          {checkSlot && createPortal(
            <input
              type="checkbox"
              aria-label="Seleção em massa"
              title="Seleção em massa"
              checked={isBulkMode}
              onChange={() => { if (isBulkMode) { setIsBulkMode(false); setSelectedIds(new Set()); } else setIsBulkMode(true); }}
              className="h-4 w-4 cursor-pointer accent-[#00a651]"
            />,
            checkSlot,
          )}
          {bulkSlot && createPortal(
            isBulkMode ? (
              <>
                <span className="text-sm whitespace-nowrap text-[#50575e]">{selectedIds.size} {selectedIds.size === 1 ? 'selecionada' : 'selecionadas'}</span>
                {special && (
                  <span
                    onClick={selectedIds.size > 0 ? () => restore(Array.from(selectedIds)) : undefined}
                    className={`text-sm whitespace-nowrap ${selectedIds.size > 0 ? 'text-[#2271b1] cursor-pointer hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    Restaurar
                  </span>
                )}
                <button type="button" onClick={() => { setIsBulkMode(false); setSelectedIds(new Set()); }} className="text-sm text-[#d63638] underline-offset-2 hover:underline whitespace-nowrap">Cancelar</button>
              </>
            ) : (
              <span className="text-[13px] text-[#50575e]">{filteredFiles.length} itens</span>
            ),
            bulkSlot,
          )}
          <div className={`grid ${fourCols ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-2'}`}>
            {view !== 'lixo' && (zipOptions ?? []).map((z) => (
              <button
                key={z.path}
                type="button"
                onClick={() => onPickZip?.(z.path)}
                aria-label={`Abrir o zip ${z.label}`}
                className="flex aspect-square flex-col items-center justify-center gap-1 border border-[#ccd0d4] bg-white p-2 text-[#50575e] hover:border-[#00a651]"
              >
                <FileArchive className={`h-12 w-12 text-[#00a651] ${zipStatus?.[z.path] === 'A descompactar…' ? 'animate-pulse' : ''}`} strokeWidth={1.5} aria-hidden="true" />
                <span className="max-w-full truncate text-[10px]">{z.label}</span>
                {zipStatus?.[z.path] && (
                  <span role="status" title={zipStatus[z.path]} className={`max-w-full truncate text-[9px] leading-none ${zipStatus[z.path].startsWith('Erro') ? 'text-[#d63638]' : 'text-[#008f45]'}`}>{zipStatus[z.path]}</span>
                )}
              </button>
            ))}
            {paginatedFiles.length === 0 && !(zipOptions && zipOptions.length > 0 && view !== 'lixo') && (
              <p className="col-span-full py-6 text-sm text-[#50575e]">{view === 'lixo' ? 'A reciclagem está vazia.' : source === 'arquivo' ? 'Esta pasta ainda não tem fotos. Use “Adicionar fotos”.' : 'Ainda não há fotos.'}</p>
            )}
            {paginatedFiles.map((file) => (
              <div
                key={file.name}
                onClick={() => (isBulkMode ? toggleSelect(file.name) : openDetails(file))}
                className={`aspect-square relative bg-white border cursor-pointer overflow-hidden group ${selectedIds.has(file.name) ? 'ring-[3px] ring-[#00a651] ring-inset' : 'border-[#ccd0d4]'}`}
              >
                <FileThumb name={file.name} url={getPublicUrl(file.name)} />
                {isBulkMode && (
                  <div className={`absolute top-1 right-1 w-5 h-5 rounded-sm border flex items-center justify-center ${selectedIds.has(file.name) ? 'bg-[#00a651] border-[#00a651]' : 'bg-white border-[#ccd0d4]'}`}>
                    {selectedIds.has(file.name) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        ) : viewMode === 'grid' ? (
          /* Grid View - 7 COLUNAS */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-2">
            {paginatedFiles.map((file) => (
              <div 
                key={file.name}
                onClick={() => pick ? choose(file) : isBulkMode ? toggleSelect(file.name) : openDetails(file)}
                className={`aspect-square relative bg-white border cursor-pointer overflow-hidden group ${
                  selectedIds.has(file.name) ? 'ring-[3px] ring-[#00a651] ring-inset' : 'border-[#ccd0d4]'
                }`}
              >
                <FileThumb name={file.name} url={getPublicUrl(file.name)} />
                
                {isBulkMode && (
                  <div className={`absolute top-1 right-1 w-5 h-5 rounded-sm border flex items-center justify-center ${
                    selectedIds.has(file.name) ? 'bg-[#00a651] border-[#00a651]' : 'bg-white border-[#ccd0d4]'
                  }`}>
                    {selectedIds.has(file.name) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                )}
                
                {!isBulkMode && (
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                {pick && (
                  <div className="absolute inset-x-0 bottom-0 bg-[#00a651] py-1 text-center text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">Usar esta foto</div>
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
                {paginatedFiles.map((file, idx) => (
                  <tr key={file.name} className={`border-b border-[#f0f0f1] hover:bg-[#f6f7f7] text-[13px] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
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
                          <FileThumb name={file.name} url={getPublicUrl(file.name)} />
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
              <h2 className="text-lg font-bold truncate">Detalhes do anexo</h2>
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
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
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
                        className="px-4 py-1.5 bg-[#00a651] text-white text-sm font-semibold rounded-[3px] hover:bg-[#008f45]"
                      >
                        Editar imagem
                      </button>
                      <button onClick={() => window.open(getPublicUrl(selectedFile.name), '_blank')} className="px-4 py-1.5 border border-[#00a651] text-[#008f45] bg-white text-sm font-semibold rounded-[3px] hover:bg-[#f6f7f7]">
                        Ver ficheiro completo
                      </button>
                    </div>
                  </>
                ) : (
                  /* Interface de Edição de Imagem */
                  <div className="w-full max-w-4xl bg-white border border-[#ccd0d4] shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
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
                                className="w-24 h-8 border border-[#ccd0d4] text-sm px-2 outline-none focus:border-[#00a651]"
                              />
                            </div>
                            <span className="mt-4 text-gray-400">×</span>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-500">Altura</label>
                              <input 
                                type="number" 
                                value={editHeight}
                                onChange={(e) => setEditHeight(parseInt(e.target.value))}
                                className="w-24 h-8 border border-[#ccd0d4] text-sm px-2 outline-none focus:border-[#00a651]"
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

                        <div className="pt-6 border-t flex flex-wrap gap-3">
                          <button 
                            onClick={applyImageEdits}
                            disabled={processingImage}
                            className="px-6 py-2 bg-[#00a651] text-white text-sm font-semibold rounded-[3px] hover:bg-[#008f45] disabled:opacity-50"
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
                <div className="text-[12px] text-[#50575e] space-y-1 break-all">
                  <p><strong>Carregado em:</strong> {selectedFile.created_at ? new Date(selectedFile.created_at).toLocaleDateString('pt-PT') : '-'}</p>
                  <p><strong>Nome:</strong> {selectedFile.name.split('/').pop()}</p>
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
                      className="w-full text-xs border border-[#ccd0d4] p-1.5 focus:border-[#00a651] outline-none h-14 rounded-[3px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-[#50575e]">Título</label>
                    <input 
                      type="text"
                      value={metadata.title}
                      onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                      className="w-full text-xs border border-[#ccd0d4] p-1.5 focus:border-[#00a651] outline-none rounded-[3px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-[#50575e]">Legenda</label>
                    <textarea 
                      value={metadata.caption}
                      onChange={(e) => setMetadata({...metadata, caption: e.target.value})}
                      className="w-full text-xs border border-[#ccd0d4] p-1.5 focus:border-[#00a651] outline-none h-14 rounded-[3px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-[#50575e]">Descrição</label>
                    <textarea 
                      value={metadata.description}
                      onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                      className="w-full text-xs border border-[#ccd0d4] p-1.5 focus:border-[#00a651] outline-none h-20 rounded-[3px]"
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

                {busyMsg && <p className="text-xs font-semibold text-[#008f45]">{busyMsg}</p>}

                <div className="pt-4 border-t border-[#ccd0d4] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {view !== 'arquivo' && <button onClick={() => deleteSingle(selectedFile.name)} className="text-[12px] text-[#d63638] hover:underline">{showTrash ? 'Eliminar para sempre' : 'Mover para o lixo'}</button>}
                    {canSeeTrash && view === 'galeria' && <button onClick={() => archive([selectedFile.name])} className="text-[12px] text-[#2271b1] hover:underline">Arquivar</button>}
                    {special && <button onClick={() => restore([selectedFile.name])} className="text-[12px] text-[#2271b1] hover:underline">Restaurar</button>}
                  </div>
                  <button 
                    onClick={saveMetadata}
                    disabled={savingMetadata}
                    className="px-4 py-1.5 bg-[#00a651] text-white text-sm font-semibold rounded-[3px] hover:bg-[#008f45] disabled:opacity-50"
                  >
                    {savingMetadata ? 'A guardar...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {pendingDel && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Confirmar eliminação">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
            <h3 className="text-center text-[16px] font-semibold text-[#1d2327]">Eliminar fotos</h3>
            <p className="mt-2 text-center text-sm text-[#3c434a]">
              Quer mesmo eliminar {pendingDel.single ? 'esta foto' : pendingDel.names.length === 1 ? 'a foto selecionada' : `as ${pendingDel.names.length} fotos selecionadas`}?
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" onClick={() => setPendingDel(null)} className="rounded-[3px] border border-[#ccd0d4] bg-white px-4 py-1.5 text-sm font-semibold text-[#50575e] hover:bg-[#f6f7f7]">Cancelar</button>
              <button type="button" onClick={async () => { const n = pendingDel.names; setPendingDel(null); await performDelete(n); }} className="rounded-[3px] bg-[#d63638] px-5 py-1.5 text-sm font-semibold text-white hover:bg-[#b32d2e]">Sim</button>
            </div>
          </div>
        </div>
      )}

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
