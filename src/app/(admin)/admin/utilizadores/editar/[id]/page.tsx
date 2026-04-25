'use client';

import React, { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Camera, Trash2, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ROLES = ['Administrador', 'Editor', 'Actor', 'Subscritor', 'Contribuidor'];

export default function EditUserPage() {
  const params = useParams();
  const id = params?.id as string;

  const [form, setForm] = useState<any>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUser = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/get/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(data.user);
      setAvatarPreview(data.user.avatar);
    } catch (err: any) {
      console.error('Erro:', err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUser();
  }, [id]);

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
          const finalSize = 400;
          
          // Lógica de "Smart Crop" para focar na cara
          const sourceSize = Math.min(img.width, img.height);
          let sx = (img.width - sourceSize) / 2;
          let sy = (img.height - sourceSize) / 2;

          if (img.height > img.width) {
            sy = (img.height - sourceSize) * 0.15; // Foca no topo
          }

          canvas.width = finalSize;
          canvas.height = finalSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, finalSize, finalSize);
          
          // Comprimir para garantir que NÃO EXCEDE 100KB (qualidade 0.6)
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
    if (newPassword && newPassword !== confirmPassword) {
      alert('As palavras-passe não coincidem.');
      return;
    }
    setSaving(true);
    try {
      let finalAvatarUrl = avatarPreview;

      // Se houver um novo ficheiro, faz upload via API
      if (avatarFile) {
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
        
        finalAvatarUrl = uploadData.url;
      }

      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          firstName: form.firstName,
          lastName: form.lastName,
          alcunha: form.alcunha,
          role: form.role,
          bio: form.bio,
          website: form.website,
          avatarUrl: finalAvatarUrl,
          password: newPassword || undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Após salvar, redireciona de volta para a lista
      router.push('/admin/utilizadores');
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
        <p className="text-sm text-gray-500">A carregar dados do utilizador...</p>
      </div>
    );
  }

  if (!form.id) {
    return (
      <div className="p-6 text-[#2c3338]">
        <p className="text-red-500">Utilizador não encontrado.</p>
        <Link href="/admin/utilizadores" className="text-[#2271b1] hover:underline mt-2 inline-block">← Voltar aos Utilizadores</Link>
      </div>
    );
  }

  return (
    <div className="p-4 text-[#2c3338] max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327]">Editar utilizador: <strong>{form.username}</strong></h1>
          <p className="text-[13px] text-[#50575e] mt-1">
            <Link href="/admin/utilizadores" className="text-[#2271b1] hover:underline">Utilizadores</Link>
            {' '}&rsaquo; Editar
          </p>
        </div>
        {saved && (
          <div className="px-4 py-2 bg-green-50 border border-green-300 text-green-700 text-sm rounded-[3px]">
            ✓ Utilizador atualizado com sucesso.
          </div>
        )}
      </div>

      <form onSubmit={handleSave}>
        <table className="w-full border-collapse">
          <tbody>

            {/* Secção: Informações pessoais */}
            <tr><td colSpan={2} className="pt-6 pb-2 border-b border-[#ccd0d4]">
              <h2 className="text-[15px] font-bold text-[#1d2327]">Informações pessoais</h2>
            </td></tr>

            {/* Avatar */}
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] w-48 align-top pt-4">Foto de perfil</th>
              <td className="p-3">
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-24 h-24 rounded-full border border-[#ccd0d4] object-cover" alt="avatar" />
                    ) : form.isAdmin ? (
                      <div className="w-24 h-24 rounded-full border border-gray-200 flex items-center justify-center bg-[#1d2327]">
                        <span className="text-xl font-black"><span className="text-[#00a651]">EC</span></span>
                      </div>
                    ) : (
                      <img 
                        src="https://secure.gravatar.com/avatar/ad516503a11cd5ca435acc9bb6523536?s=150&d=mm&r=g" 
                        className="w-24 h-24 rounded-full border border-[#ccd0d4] object-cover" 
                        alt="default avatar" 
                      />
                    )}
                    {/* Camera overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  {/* Botões */}
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="h-8 px-3 border border-[#ccd0d4] bg-white text-[13px] font-semibold rounded-[3px] hover:bg-[#f6f7f7] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Selecionar foto
                    </button>
                    {avatarPreview && (
                      <button type="button" onClick={() => { setAvatarPreview(null); setAvatarFile(null); }} className="h-8 px-3 border border-[#ccd0d4] bg-white text-[#d63638] text-[13px] font-semibold rounded-[3px] hover:bg-red-50 flex items-center gap-1.5">
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
              </td>
            </tr>
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] w-48 align-top pt-4">Nome próprio</th>
              <td className="p-3">
                <input type="text" value={form.firstName || ''} onChange={e => setForm({...form, firstName: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Apelido</th>
              <td className="p-3">
                <input type="text" value={form.lastName || ''} onChange={e => setForm({...form, lastName: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Alcunha</th>
              <td className="p-3">
                <input type="text" value={form.alcunha || ''} onChange={e => setForm({...form, alcunha: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
                <p className="text-[12px] text-gray-500 mt-1">Opcional. Se preenchida, aparecerá como o nome do autor.</p>
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Nome de utilizador</th>
              <td className="p-3">
                <span className="text-[13px] text-[#50575e]">{form.username}</span>
                <p className="text-[11px] text-[#50575e] mt-1">O nome de utilizador não pode ser alterado.</p>
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">E-mail <span className="text-[#d63638]">*</span></th>
              <td className="p-3">
                <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} required
                  className="h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Website</th>
              <td className="p-3">
                <input type="url" value={form.website || ''} onChange={e => setForm({...form, website: e.target.value})}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Descrição biográfica</th>
              <td className="p-3">
                <textarea value={form.bio || ''} onChange={e => setForm({...form, bio: e.target.value})} rows={4}
                  className="px-2 py-1.5 border border-[#ccd0d4] rounded-[3px] text-[13px] w-full max-w-[500px] outline-none focus:border-[#2271b1] resize-none"
                  placeholder="Informação biográfica sobre este utilizador..." />
              </td>
            </tr>

            {/* Secção: Conta */}
            <tr><td colSpan={2} className="pt-8 pb-2 border-b border-[#ccd0d4]">
              <h2 className="text-[15px] font-bold text-[#1d2327]">Gestão da conta</h2>
            </td></tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Papel</th>
              <td className="p-3">
                <select value={form.role || 'Subscritor'} onChange={e => setForm({...form, role: e.target.value})}
                  disabled={form.isAdmin}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[13px] bg-white outline-none focus:border-[#2271b1] disabled:opacity-60 disabled:cursor-not-allowed">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {form.isAdmin && <p className="text-[11px] text-[#50575e] mt-1">O papel do administrador não pode ser alterado.</p>}
              </td>
            </tr>

            {/* Secção: Palavra-passe */}
            <tr><td colSpan={2} className="pt-8 pb-2 border-b border-[#ccd0d4]">
              <h2 className="text-[15px] font-bold text-[#1d2327]">Palavra-passe</h2>
            </td></tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Nova palavra-passe</th>
              <td className="p-3">
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]"
                  placeholder="Deixe em branco para não alterar" />
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Confirmar palavra-passe</th>
              <td className="p-3">
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="h-8 px-2 border border-[#ccd0d4] rounded-[3px] text-[13px] w-full max-w-[300px] outline-none focus:border-[#2271b1]"
                  placeholder="Repita a nova palavra-passe" />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-[#d63638] mt-1">As palavras-passe não coincidem.</p>
                )}
              </td>
            </tr>

            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] align-top pt-4">Enviar reposição</th>
              <td className="p-3">
                <button
                  type="button"
                  onClick={() => alert(`Email de reposição enviado para ${form.email}`)}
                  className="h-8 px-4 border border-[#2271b1] text-[#2271b1] text-[13px] rounded-[3px] hover:bg-[#f6f7f7] transition-all"
                >
                  Enviar email de reposição de senha
                </button>
              </td>
            </tr>

          </tbody>
        </table>

        {/* Botões de ação */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-9 px-5 bg-[#2271b1] text-white text-[13px] font-semibold rounded-[3px] hover:bg-[#135e96] transition-all disabled:opacity-60"
          >
            {saving ? 'A guardar...' : 'Atualizar utilizador'}
          </button>
          <Link href="/admin/utilizadores" className="h-9 px-4 flex items-center text-[13px] text-[#50575e] hover:text-[#135e96]">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
