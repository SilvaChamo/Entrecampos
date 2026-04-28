'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Trash2, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ROLES = ['Administrador', 'Editor', 'Actor', 'Subscritor', 'Contribuidor'];

export default function AddUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    alcunha: '',
    displayNameType: 'full_name',
    email: '',
    website: '',
    bio: '',
    telefone: '',
    profissao: '',
    cargo: '',
    role: 'Subscritor'
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const finalSize = 400; // Suficiente para um avatar
          
          // Lógica de "Smart Crop" para focar na cara (parte superior/central)
          const sourceSize = Math.min(img.width, img.height);
          let sx = (img.width - sourceSize) / 2;
          let sy = (img.height - sourceSize) / 2;

          // Se a foto for vertical (corpo inteiro), subimos o corte para focar na cabeça
          if (img.height > img.width) {
            sy = (img.height - sourceSize) * 0.15; // Foca no topo (15% de margem)
          }

          canvas.width = finalSize;
          canvas.height = finalSize;
          const ctx = canvas.getContext('2d');
          
          // Desenha apenas o recorte quadrado selecionado
          ctx?.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, finalSize, finalSize);

          // Comprimir para garantir que NÃO EXCEDE 100KB (usamos qualidade 0.6)
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Falha na compressão'));
          }, 'image/jpeg', 0.6);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = null;

      // 1. Upload avatar if exists
      if (avatarFile) {
        // Comprimir imagem antes do upload
        const compressedBlob = await compressImage(avatarFile);
        const compressedFile = new File([compressedBlob], avatarFile.name, { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('bucket', 'avatars');

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Erro ao carregar imagem');
        
        avatarUrl = uploadData.url;
      }

      // 2. Create user via API
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          password,
          avatarUrl
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      router.push('/admin/utilizadores?added=true');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="p-6 text-[#2c3338] max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Adicionar novo utilizador</h1>
        <p className="text-[13px] text-[#50575e] mt-1">
          Crie um novo utilizador e adicione-o a este site.
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-2 bg-red-50 border border-red-200 text-[#d63638] text-sm rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSave}>
        <table className="w-full border-collapse">
          <tbody>
            <tr><td colSpan={2} className="pt-2 pb-2 border-b border-[#ccd0d4]">
              <h2 className="text-[15px] font-bold text-[#1d2327]">Nome</h2>
            </td></tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] w-48 align-top pt-4">
                Nome de utilizador (obrigatório)
              </th>
              <td className="p-3">
                <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">E-mail (obrigatório)</th>
              <td className="p-3">
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Nome próprio <span className="text-[#d63638]">*</span></th>
              <td className="p-3">
                <input type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Apelido <span className="text-[#d63638]">*</span></th>
              <td className="p-3">
                <input type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Alcunha</th>
              <td className="p-3">
                <input type="text" value={form.alcunha} onChange={e => setForm({...form, alcunha: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
                <p className="text-[12px] text-gray-500 mt-1">Opcional. Se preenchida, aparecerá como o nome do autor.</p>
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Exibir o nome publicamente como</th>
              <td className="p-3">
                <select 
                  value={form.displayNameType} 
                  onChange={e => setForm({...form, displayNameType: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1] bg-white"
                >
                  <option value="first_name">{form.firstName || 'Nome próprio'}</option>
                  <option value="last_name">{form.lastName || 'Apelido'}</option>
                  <option value="full_name">{`${form.firstName} ${form.lastName}`.trim() || 'Nome e Apelido'}</option>
                  <option value="alcunha">{form.alcunha || 'Alcunha'}</option>
                </select>
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Website</th>
              <td className="p-3">
                <input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Telefone</th>
              <td className="p-3">
                <input type="tel" value={form.telefone || ''} onChange={e => setForm({...form, telefone: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]"
                  placeholder="+258 84 123 4567" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Profissão</th>
              <td className="p-3">
                <input type="text" value={form.profissao || ''} onChange={e => setForm({...form, profissao: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]"
                  placeholder="Ex: Jornalista, Engenheiro, etc." />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Cargo</th>
              <td className="p-3">
                <input type="text" value={form.cargo || ''} onChange={e => setForm({...form, cargo: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]"
                  placeholder="Ex: Editor Chefe, Repórter, etc." />
              </td>
            </tr>

            {/* Foto de perfil */}
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Foto de perfil</th>
              <td className="p-3">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-24 h-24 rounded-full border border-[#ccd0d4] object-cover" alt="avatar" />
                    ) : (
                      <img 
                        src="https://secure.gravatar.com/avatar/ad516503a11cd5ca435acc9bb6523536?s=150&d=mm&r=g" 
                        className="w-24 h-24 rounded-full border border-[#ccd0d4] object-cover" 
                        alt="default avatar" 
                      />
                    )}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="h-8 px-3 border border-[#ccd0d4] bg-white text-[13px] font-semibold rounded-md hover:bg-[#f6f7f7] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Selecionar foto
                    </button>
                    {avatarPreview && (
                      <button type="button" onClick={() => { setAvatarPreview(null); setAvatarFile(null); }} className="h-8 px-3 border border-[#ccd0d4] bg-white text-[#d63638] text-[13px] font-semibold rounded-md hover:bg-red-50 flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </td>
            </tr>

            <tr><td colSpan={2} className="pt-8 pb-2 border-b border-[#ccd0d4]">
              <h2 className="text-[15px] font-bold text-[#1d2327]">Palavra-passe</h2>
            </td></tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Palavra-passe (obrigatório)</th>
              <td className="p-3">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Confirmar palavra-passe <span className="text-[#d63638]">*</span></th>
              <td className="p-3">
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr><td colSpan={2} className="pt-8 pb-2 border-b border-[#ccd0d4]">
              <h2 className="text-[15px] font-bold text-[#1d2327]">Papel</h2>
            </td></tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Papel</th>
              <td className="p-3">
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] bg-white outline-none focus:border-[#2271b1]">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={saving} className="h-9 px-5 bg-[#2271b1] text-white text-[13px] font-semibold rounded-md hover:bg-[#135e96] transition-all disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Adicionar novo utilizador
          </button>
          <Link href="/admin/utilizadores" className="h-9 px-4 flex items-center text-[13px] text-[#50575e] hover:text-[#135e96]">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
