'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload, User } from 'lucide-react';
import { SkeletonContent, SkeletonHeader } from '@/components/Admin/Skeleton';
import MobileSelect from '@/components/Admin/MobileSelect';
import { uploadToLibrary } from '@/components/Admin/ImageChooser';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';
import type { Columnist } from '@/lib/columnists';

type PostOption = { slug: string; title: string };
const EMPTY: Columnist = { id: '', nome: '', handle: '', foto: '', noticia: '', facebook: '', instagram: '', linkedin: '', x: '' };
const SOCIALS: { key: 'facebook' | 'instagram' | 'linkedin' | 'x'; label: string; placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/...' },
];

const inputCls = 'w-full h-9 px-3 text-[13px] border border-[#ccd0d4] rounded-md bg-white';
const labelCls = 'block text-[13px] text-[#1d2327] mb-1';

function Avatar({ src, className = 'h-9 w-9' }: { src: string; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[#f0f0f1] text-[#8c8f94]`}>
      <User className="h-4 w-4" />
    </span>
  );
}

/** Formulário de colunista (o mesmo para criar e para editar). */
function ColumnistForm({ title, form, setForm, posts, onSave, onCancel, saving }: { title: string; form: Columnist; setForm: (c: Columnist) => void; posts: PostOption[]; onSave: () => void; onCancel: () => void; saving: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const pick = async (file: File) => {
    setUploading(true);
    setUploadError('');
    try {
      setForm({ ...form, foto: await uploadToLibrary(file, form.nome) });
    } catch (err: any) {
      setUploadError(err?.message || 'Não foi possível enviar a foto.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#f6f7f7] border border-[#ccd0d4] rounded-lg p-4">
      <h3 className="mb-4 text-[17px] text-[#1d2327]">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nome</label>
          <input type="text" maxLength={80} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} placeholder="Ex: Hae-won Jeon" />
        </div>
        <div>
          <label className={labelCls}>Utilizador (sem o @)</label>
          <input type="text" maxLength={40} value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} className={inputCls} placeholder="Ex: haewonjeon" />
        </div>
        <div>
          <label className={labelCls}>Foto</label>
          <div className="flex items-center gap-2">
            <Avatar src={form.foto} />
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="flex h-9 items-center gap-2 px-4 text-[13px] border border-[#ccd0d4] bg-white rounded-md hover:bg-[#f6f7f7] disabled:opacity-60">
              <Upload className="w-4 h-4" /> {uploading ? 'A enviar...' : form.foto ? 'Mudar foto' : 'Carregar foto'}
            </button>
            {form.foto && (
              <button type="button" onClick={() => setForm({ ...form, foto: '' })} className="flex h-9 items-center gap-2 px-3 text-[13px] border border-[#ccd0d4] bg-white rounded-md hover:bg-[#f6f7f7]">
                <X className="w-4 h-4" /> Tirar
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
          </div>
          {uploadError && <p className="mt-1 text-[12px] text-red-700">{uploadError}</p>}
        </div>
        <div>
          <label className={labelCls}>Notícia do botão Ler artigo (o título do card é o da notícia)</label>
          <MobileSelect
            ariaLabel="Notícia do colunista"
            value={form.noticia}
            onChange={(noticia) => setForm({ ...form, noticia })}
            options={[{ value: '', label: 'Escolher notícia...' }, ...posts.map((p) => ({ value: p.slug, label: p.title.length > 70 ? `${p.title.slice(0, 70)}...` : p.title }))]}
          />
        </div>
        {SOCIALS.map((s) => (
          <div key={s.key}>
            <label className={labelCls}>{s.label}</label>
            <input type="url" maxLength={300} value={form[s.key]} onChange={(e) => setForm({ ...form, [s.key]: e.target.value })} className={inputCls} placeholder={s.placeholder} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button onClick={onSave} disabled={saving || uploading} className="flex h-9 items-center gap-2 px-4 text-[13px] bg-[#00a651] text-white rounded-md hover:bg-[#008f45] disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving ? 'A guardar...' : 'Guardar'}
        </button>
        <button onClick={onCancel} className="flex h-9 items-center gap-2 px-4 text-[13px] border border-[#ccd0d4] bg-white rounded-md hover:bg-[#f6f7f7]">
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>
    </div>
  );
}

export default function ColunistasPage() {
  const [list, setList] = useState<Columnist[]>(() => adminCacheGet<Columnist[]>('columnists-page') ?? []);
  const [posts, setPosts] = useState<PostOption[]>(() => adminCacheGet<PostOption[]>('columnists-posts') ?? []);
  const [loading, setLoading] = useState(() => adminCacheGet('columnists-page') === undefined);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Columnist>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/admin/colunistas', { cache: 'no-store', credentials: 'include' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao carregar os colunistas.`);
        return body as { columnists: Columnist[]; posts: PostOption[] };
      })
      .then((data) => {
        if (!alive) return;
        adminCacheSet('columnists-page', data.columnists);
        adminCacheSet('columnists-posts', data.posts);
        setList(data.columnists);
        setPosts(data.posts);
      })
      .catch((err) => alive && setError(err?.message || 'Não foi possível carregar os colunistas.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const save = async () => {
    if (!form.nome.trim()) return setError('Indique o nome do colunista.');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/colunistas', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao guardar.`);
      adminCacheSet('columnists-page', body.columnists);
      setList(body.columnists);
      setError(null);
      setEditing(null);
      setAdding(false);
      setForm(EMPTY);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível guardar o colunista.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Columnist) => {
    if (!confirm(`Tem a certeza que deseja eliminar o colunista ${c.nome}?`)) return;
    try {
      const res = await fetch(`/api/admin/colunistas?id=${encodeURIComponent(c.id)}`, { method: 'DELETE', credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao eliminar.`);
      adminCacheSet('columnists-page', body.columnists);
      setList(body.columnists);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível eliminar o colunista.');
    }
  };

  const titleOf = (slug: string) => posts.find((p) => p.slug === slug)?.title || (slug ? slug : 'Sem notícia');

  return (
    <div className="ec-page text-[#2c3338]">
      {loading ? (
        <>
          <SkeletonHeader />
          <SkeletonContent />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl text-[#1d2327]">Colunistas</h1>
              <p className="text-[#50575e] mt-1">Os colunistas que aparecem na home, antes dos vídeos</p>
            </div>
            <button
              onClick={() => {
                setForm(EMPTY);
                setEditing(null);
                setAdding(true);
              }}
              className="flex h-9 items-center gap-2 px-4 text-[13px] bg-[#00a651] text-white rounded-md hover:bg-[#008f45]"
            >
              <Plus className="w-4 h-4" /> Adicionar colunista
            </button>
          </div>

          {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700">{error}</div>}

          {adding && (
            <div className="mb-6">
              <ColumnistForm title="Novo colunista" form={form} setForm={setForm} posts={posts} onSave={save} onCancel={() => setAdding(false)} saving={saving} />
            </div>
          )}

          <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f6f7f7] text-left border-b border-[#ccd0d4]">
                  <th className="p-4 font-normal">Colunista</th>
                  <th className="p-4 font-normal hidden md:table-cell">Notícia</th>
                  <th className="p-4 text-right font-normal">Acções</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-[#50575e]">Ainda não há colunistas. Enquanto não houver, o bloco não aparece na home.</td>
                  </tr>
                )}
                {list.map((c, idx) =>
                  editing === c.id ? (
                    <tr key={c.id} className="border-b border-[#f0f0f1] bg-white">
                      <td colSpan={3} className="p-3">
                        <ColumnistForm title={`Editar colunista ${c.nome}`} form={form} setForm={setForm} posts={posts} onSave={save} onCancel={() => setEditing(null)} saving={saving} />
                      </td>
                    </tr>
                  ) : (
                    <tr key={c.id} className={`border-b border-[#f0f0f1] hover:bg-[#f6f7f7] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-2">
                          <Avatar src={c.foto} />
                          <div className="min-w-0">
                            <div className="truncate text-[#1d2327]">{c.nome}</div>
                            {c.handle && <div className="truncate text-[12px] text-[#50575e]">@{c.handle}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 text-[#50575e] hidden md:table-cell">
                        <span className="line-clamp-2">{titleOf(c.noticia)}</span>
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            aria-label={`Editar ${c.nome}`}
                            onClick={() => {
                              setAdding(false);
                              setForm(c);
                              setEditing(c.id);
                            }}
                            className="p-2 text-[#2271b1] hover:bg-green-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button aria-label={`Eliminar ${c.nome}`} onClick={() => remove(c)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-[13px] text-[#50575e]">{list.length} colunistas</div>
        </>
      )}
    </div>
  );
}
