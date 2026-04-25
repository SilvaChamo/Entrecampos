'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const MOCK_USERS: Record<string, any> = {
  '1': { id: '1', username: 'admin', firstName: 'Silva', lastName: 'Chamo', email: 'admin@ecamposmz.com', role: 'Administrador', bio: 'Administrador do site EntreCAMPOS.', website: 'https://entrecampos.co.mz', isAdmin: true },
  '2': { id: '2', username: 'fosterbethune0', firstName: '', lastName: '', email: 'costanza@b.fruitingbodymushrooms.online', role: 'Subscritor', bio: '', website: '' },
  '3': { id: '3', username: 'Redacao', firstName: 'Redação', lastName: 'EntreCAMPOS', email: 'silvanochamo@gmail.com', role: 'Actor', bio: '', website: '' },
  '4': { id: '4', username: 'Silva', firstName: 'Silva', lastName: 'Chamo', email: 'silva.chamo@gmail.com', role: 'Editor', bio: '', website: '' },
  '5': { id: '5', username: 'tessakosovich3', firstName: '', lastName: '', email: 'tessa.kosovich@williamjons.dynainbox.com', role: 'Subscritor', bio: '', website: '' },
};

const ROLES = ['Administrador', 'Editor', 'Actor', 'Subscritor', 'Contribuidor'];

export default function EditUserPage() {
  const params = useParams();
  const id = params?.id as string;
  const original = MOCK_USERS[id];

  const [form, setForm] = useState(original || {});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!original) {
    return (
      <div className="p-6 text-[#2c3338]">
        <p className="text-red-500">Utilizador não encontrado.</p>
        <Link href="/admin/utilizadores" className="text-[#2271b1] hover:underline mt-2 inline-block">← Voltar aos Utilizadores</Link>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert('As palavras-passe não coincidem.');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
        {/* Nome */}
        <table className="w-full border-collapse">
          <tbody>

            {/* Secção: Informações pessoais */}
            <tr><td colSpan={2} className="pt-6 pb-2 border-b border-[#ccd0d4]">
              <h2 className="text-[15px] font-bold text-[#1d2327]">Informações pessoais</h2>
            </td></tr>

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
