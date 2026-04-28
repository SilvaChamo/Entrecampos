'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

const ROLES = ['Administrador', 'Editor', 'Actor', 'Subscritor', 'Contribuidor'];

export default function MeuPerfilPage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
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
    role: 'Subscritor',
    isAdmin: false
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Carregar dados do usuário
  useEffect(() => {
    if (authUser?.email) {
      fetch(`/api/admin/users/me?email=${encodeURIComponent(authUser.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            setForm(data.user);
            setAvatarPreview(data.user.avatar);
          } else {
            // Usuário não encontrado no Supabase - usar dados do AuthContext como fallback
            const fallbackUser = {
              id: authUser.id || '1',
              firstName: authUser.name?.split(' ')[0] || '',
              lastName: authUser.name?.split(' ').slice(1).join(' ') || '',
              email: authUser.email,
              role: authUser.role === 'admin' ? 'Administrador' : 'Subscritor',
              avatar: null,
              username: authUser.email?.split('@')[0] || 'user',
              alcunha: '',
              displayNameType: 'full_name',
              bio: '',
              website: '',
              telefone: '',
              profissao: '',
              cargo: '',
              isAdmin: authUser.role === 'admin'
            };
            setUser(fallbackUser);
            setForm(fallbackUser);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Erro na requisição:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [authUser?.email]);

  // Handler para alterar avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Comprimir imagem
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const finalSize = 400;
          const sourceSize = Math.min(img.width, img.height);
          let sx = (img.width - sourceSize) / 2;
          let sy = (img.height - sourceSize) / 2;
          if (img.height > img.width) {
            sy = (img.height - sourceSize) * 0.15;
          }
          canvas.width = finalSize;
          canvas.height = finalSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, finalSize, finalSize);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Falha na compressão'));
          }, 'image/jpeg', 0.6);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handler para salvar
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    // Validar senhas
    if (newPassword && newPassword !== confirmPassword) {
      alert('As palavras-passe não coincidem.');
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      let finalAvatarUrl = avatarPreview;

      // Upload avatar se houver novo arquivo
      if (avatarFile) {
        const compressedBlob = await compressImage(avatarFile);
        const compressedFile = new File([compressedBlob], avatarFile.name, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', compressedFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.url) finalAvatarUrl = uploadData.url;
      }

      // Atualizar usuário
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          firstName: form.firstName,
          lastName: form.lastName,
          alcunha: form.alcunha,
          displayNameType: form.displayNameType,
          role: form.role,
          bio: form.bio,
          website: form.website,
          avatarUrl: finalAvatarUrl,
          password: newPassword || undefined,
          telefone: form.telefone,
          profissao: form.profissao,
          cargo: form.cargo
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSaved(true);
      setNewPassword('');
      setConfirmPassword('');
      setAvatarFile(null);
      
      // Atualizar dados locais
      setUser({ ...user, ...form, avatar: finalAvatarUrl });
      
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2271b1] mx-auto mb-2" />
        <p className="text-sm text-gray-500">A carregar perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-[#2c3338]">
        <p className="text-red-500">Perfil não encontrado.</p>
      </div>
    );
  }

  const displayName = form.displayNameType === 'alcunha' && form.alcunha 
    ? form.alcunha 
    : [form.firstName, form.lastName].filter(Boolean).join(' ') || form.email?.split('@')[0] || 'user';

  return (
    <div className="p-6 text-[#2c3338]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327]">O seu perfil</h1>
          <p className="text-[13px] text-[#50575e] mt-1">
            <Link href="/admin/utilizadores" className="text-[#2271b1] hover:underline">Utilizadores</Link>
            {' '}&rsaquo; O seu perfil
          </p>
        </div>
        {saved && (
          <div className="px-4 py-2 bg-green-50 border border-green-300 text-green-700 text-sm rounded-md">
            ✓ Perfil atualizado com sucesso.
          </div>
        )}
      </div>

      <form onSubmit={handleSave}>
        <div className="bg-white border border-[#ccd0d4] rounded-md overflow-hidden mb-4">
          {/* Avatar e nome - Header */}
          <div className="p-6 border-b border-[#ccd0d4] flex items-center gap-5">
            {avatarPreview ? (
              <div className="relative w-24 h-24 flex-shrink-0">
                <img src={avatarPreview} className="w-24 h-24 rounded-full border border-gray-200 object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
            ) : (
              <div className="relative w-24 h-24 flex-shrink-0">
                <div className="w-24 h-24 rounded-full border border-gray-200 flex items-center justify-center bg-[#1d2327]">
                  <span className="text-3xl font-black text-[#00a651]">
                    {(form.email?.charAt(0) || 'U').toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-[#1d2327]">{displayName}</h2>
              <p className="text-[13px] text-[#50575e]">@{form.email?.split('@')[0] || 'user'}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-[#f6f7f7] border border-[#ccd0d4] text-[11px] font-semibold rounded-md text-[#50575e]">
                {form.role}
              </span>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="h-8 px-3 border border-[#ccd0d4] bg-white text-[13px] font-semibold rounded-md hover:bg-[#f6f7f7] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Alterar foto
                </button>
                {avatarPreview && (
                  <button type="button" onClick={() => { setAvatarPreview(null); setAvatarFile(null); }} className="h-8 px-3 border border-[#ccd0d4] bg-white text-[#d63638] text-[13px] font-semibold rounded-md hover:bg-red-50 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Remover
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Conteúdo em 2 colunas - EDITÁVEL */}
          <div className="p-6">
            {/* Secção: Informações pessoais */}
            <div className="mb-6">
              <h3 className="text-[15px] font-bold text-[#1d2327] pb-2 border-b border-[#ccd0d4] mb-4">
                Informações pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {/* Coluna da Esquerda - Campos principais */}
                <div>
                  {/* Nome próprio */}
                  <div className="py-3 border-b border-[#f0f0f1]">
                    <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Nome próprio</dt>
                    <dd>
                      <input 
                        type="text" 
                        value={form.firstName || ''} 
                        onChange={e => setForm({...form, firstName: e.target.value})}
                        className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1]"
                        placeholder="Seu nome"
                      />
                    </dd>
                  </div>
                  
                  {/* Apelido */}
                  <div className="py-3 border-b border-[#f0f0f1]">
                    <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Apelido</dt>
                    <dd>
                      <input 
                        type="text" 
                        value={form.lastName || ''} 
                        onChange={e => setForm({...form, lastName: e.target.value})}
                        className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1]"
                        placeholder="Seu apelido"
                      />
                    </dd>
                  </div>
                  
                  {/* Alcunha */}
                  <div className="py-3 border-b border-[#f0f0f1]">
                    <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Alcunha</dt>
                    <dd>
                      <input 
                        type="text" 
                        value={form.alcunha || ''} 
                        onChange={e => setForm({...form, alcunha: e.target.value})}
                        className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1]"
                        placeholder="Como quer ser chamado"
                      />
                    </dd>
                  </div>
                  
                  {/* E-mail */}
                  <div className="py-3 border-b border-[#f0f0f1]">
                    <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">E-mail <span className="text-[#d63638]">*</span></dt>
                    <dd>
                      <input 
                        type="email" 
                        value={form.email || ''} 
                        onChange={e => setForm({...form, email: e.target.value})}
                        required
                        className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1]"
                      />
                    </dd>
                  </div>
                </div>
                
                {/* Coluna da Direita - Campos adicionais */}
                <div>
                  {/* Telefone */}
                  <div className="py-3 border-b border-[#f0f0f1]">
                    <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Telefone</dt>
                    <dd>
                      <input 
                        type="tel" 
                        value={form.telefone || ''} 
                        onChange={e => setForm({...form, telefone: e.target.value})}
                        className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1]"
                        placeholder="+258 84 123 4567"
                      />
                    </dd>
                  </div>
                  
                  {/* Profissão */}
                  <div className="py-3 border-b border-[#f0f0f1]">
                    <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Profissão</dt>
                    <dd>
                      <input 
                        type="text" 
                        value={form.profissao || ''} 
                        onChange={e => setForm({...form, profissao: e.target.value})}
                        className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1]"
                        placeholder="Ex: Jornalista, Engenheiro"
                      />
                    </dd>
                  </div>
                  
                  {/* Cargo */}
                  <div className="py-3 border-b border-[#f0f0f1]">
                    <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Cargo</dt>
                    <dd>
                      <input 
                        type="text" 
                        value={form.cargo || ''} 
                        onChange={e => setForm({...form, cargo: e.target.value})}
                        className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1]"
                        placeholder="Ex: Editor Chefe"
                      />
                    </dd>
                  </div>
                  
                  {/* Website */}
                  <div className="py-3 border-b border-[#f0f0f1]">
                    <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Website</dt>
                    <dd>
                      <input 
                        type="url" 
                        value={form.website || ''} 
                        onChange={e => setForm({...form, website: e.target.value})}
                        className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1]"
                        placeholder="https://..."
                      />
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Secção: Sobre - Biografia */}
            <div className="mb-6">
              <h3 className="text-[15px] font-bold text-[#1d2327] pb-2 border-b border-[#ccd0d4] mb-4">
                Sobre
              </h3>
              <textarea 
                value={form.bio || ''} 
                onChange={e => setForm({...form, bio: e.target.value})} 
                rows={4}
                className="px-3 py-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[600px] outline-none focus:border-[#2271b1] resize-none"
                placeholder="Escreva uma breve biografia sobre si..."
              />
            </div>

            {/* Secção: Informações da conta */}
            <div className="mb-6">
              <h3 className="text-[15px] font-bold text-[#1d2327] pb-2 border-b border-[#ccd0d4] mb-4">
                Informações da conta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div className="py-3 border-b border-[#f0f0f1]">
                  <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Nome de utilizador</dt>
                  <dd className="text-[13px] text-[#50575e]">{form.email?.split('@')[0] || 'user'}</dd>
                </div>
                <div className="py-3 border-b border-[#f0f0f1]">
                  <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Papel</dt>
                  <dd className="text-[13px] text-[#50575e]">{form.role}</dd>
                </div>
                <div className="py-3 border-b border-[#f0f0f1]">
                  <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Exibir nome como</dt>
                  <dd>
                    <select 
                      value={form.displayNameType} 
                      onChange={e => setForm({...form, displayNameType: e.target.value})}
                      className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1] bg-white"
                    >
                      <option value="first_name">{form.firstName || 'Nome próprio'}</option>
                      <option value="last_name">{form.lastName || 'Apelido'}</option>
                      <option value="full_name">{`${form.firstName} ${form.lastName}`.trim() || 'Nome completo'}</option>
                      <option value="alcunha">{form.alcunha || 'Alcunha'}</option>
                    </select>
                  </dd>
                </div>
              </div>
            </div>

            {/* Secção: Palavra-passe */}
            <div className="mb-6">
              <h3 className="text-[15px] font-bold text-[#1d2327] pb-2 border-b border-[#ccd0d4] mb-4">
                Alterar palavra-passe
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div className="py-3 border-b border-[#f0f0f1]">
                  <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Nova palavra-passe</dt>
                  <dd>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)}
                      className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1]"
                      placeholder="Deixe em branco para não alterar"
                    />
                  </dd>
                </div>
                <div className="py-3 border-b border-[#f0f0f1]">
                  <dt className="text-[13px] font-semibold text-[#1d2327] mb-1">Confirmar palavra-passe</dt>
                  <dd>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="h-8 px-2 border border-[#ccd0d4] rounded-md text-[13px] w-full max-w-[280px] outline-none focus:border-[#2271b1]"
                      placeholder="Repita a nova palavra-passe"
                    />
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-[#d63638] mt-1">As palavras-passe não coincidem.</p>
                    )}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-9 px-5 bg-[#2271b1] text-white text-[13px] font-semibold rounded-md hover:bg-[#135e96] transition-all disabled:opacity-60"
          >
            {saving ? 'A guardar...' : 'Guardar alterações'}
          </button>
          <Link href="/admin/utilizadores" className="h-9 px-4 flex items-center text-[13px] text-[#50575e] hover:text-[#135e96]">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
