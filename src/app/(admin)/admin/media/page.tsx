'use client';

import MediaLibrary from '@/components/Admin/MediaLibrary';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function MediaAdminPage() {
  const BUCKET_NAME = 'news-images';
  const [searchQuery, setSearchQuery] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    alert('A carregar ficheiros... Por favor, aguarde a conclusão.');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cleanName = `${Date.now()}-${file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\.-]/g, '_')}`;
      await supabase.storage.from(BUCKET_NAME).upload(cleanName, file);
    }
    
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-normal">Biblioteca multimédia</h1>
          <label className="px-3 py-1 bg-white border border-[#2271b1] text-[#2271b1] rounded-[3px] text-sm font-semibold hover:bg-[#f6f7f7] cursor-pointer transition-all">
            Adicionar nova
            <input type="file" multiple className="hidden" accept="image/*" onChange={handleUpload} />
          </label>
        </div>

        <div className="relative">
          <input 
            type="text" 
            placeholder="Procurar itens multimédia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-2 border border-[#ccd0d4] rounded-[3px] text-sm outline-none focus:border-[#2271b1] w-64 shadow-sm"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#50575e]" />
        </div>
      </div>

      <div className="bg-white border border-[#ccd0d4] shadow-sm">
        <MediaLibrary externalSearchQuery={searchQuery} />
      </div>
    </div>
  );
}
