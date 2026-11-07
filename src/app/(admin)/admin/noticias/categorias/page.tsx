'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Folder, Plus, Edit2, Trash2, Save, X, Check, Palette, ChevronDown } from 'lucide-react';
import { SkeletonContent, SkeletonHeader } from '@/components/Admin/Skeleton';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';
import { CATEGORY_HUES, CATEGORY_PALETTE, defaultCategoryColor } from '@/lib/category-palette';

const INITIAL_CATEGORIES = [
  { id: 1, name: 'Agricultura', slug: 'agricultura', count: 0, description: 'Notícias sobre agricultura em geral' },
  { id: 2, name: 'Agro-pecuária', slug: 'agro-pecuaria', count: 0, description: 'Criação de animais e pecuária' },
  { id: 3, name: 'Agro-processamento', slug: 'agro-processamento', count: 0, description: 'Processamento de produtos agrícolas' },
  { id: 4, name: 'Apicultura', slug: 'apicultura', count: 0, description: 'Criação de abelhas e produção de mel' },
  { id: 5, name: 'Segurança Alimentar', slug: 'seguranca-alimentar', count: 0, description: 'Segurança e soberania alimentar' },
  { id: 6, name: 'Agro-negócio', slug: 'agro-negocio', count: 0, description: 'Negócios e empreendedorismo agrícola' },
  { id: 7, name: 'Ambiente', slug: 'ambiente', count: 0, description: 'Meio ambiente e sustentabilidade' },
  { id: 8, name: 'Comunidade', slug: 'comunidade', count: 0, description: 'Notícias da comunidade rural' },
];

const DESCRIPTION_MAX = 160;

type CategoryForm = { name: string; slug: string; description: string; color: string };
const EMPTY_FORM: CategoryForm = { name: '', slug: '', description: '', color: CATEGORY_PALETTE[0] };

const slugFrom = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Cor clara? (o visto da cor escolhida passa a escuro para se ver) */
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 170;
};

/** Botão da cor (como o do Word): mostra a cor actual e, ao clicar, abre a paleta para escolher outra. */
function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Escolher a cor"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 px-3 border border-[#ccd0d4] rounded-md bg-white hover:bg-[#f6f7f7]"
      >
        <span className="flex flex-col items-center">
          <Palette className="w-4 h-4 text-[#1d2327]" />
          <span className="mt-0.5 h-1 w-4 rounded-sm" style={{ backgroundColor: value }} />
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#50575e]" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-1 flex w-max flex-col gap-1 rounded-md border border-[#ccd0d4] bg-white p-2 shadow-lg">
          {CATEGORY_HUES.map((hue) => (
            <div key={hue[0]} className="flex gap-1">
              {hue.map((c) => {
                const selected = value.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={`Cor ${c}`}
                    aria-pressed={selected}
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border ${selected ? 'border-[#1d2327] ring-2 ring-[#1d2327]/30' : 'border-black/10'}`}
                    style={{ backgroundColor: c }}
                  >
                    {selected && <Check className="w-3 h-3" style={{ color: isLight(c) ? '#1d2327' : '#fff' }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Formulário de categoria (o mesmo para criar e para editar): nome e slug lado a lado, descrição em largura total, cor e botões. */
function CategoryFormBox({
  title,
  form,
  setForm,
  onSave,
  onCancel,
}: {
  title: string;
  form: CategoryForm;
  setForm: (f: CategoryForm) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-[#f6f7f7] border border-[#ccd0d4] rounded-lg p-4">
      <h3 className="mb-4 text-[17px] font-bold text-[#1d2327]">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1d2327] mb-1">Nome</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-9 px-3 border border-[#ccd0d4] rounded-md bg-white"
            placeholder="Ex: Agricultura"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1d2327] mb-1">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full h-9 px-3 border border-[#ccd0d4] rounded-md bg-white"
            placeholder="Ex: agricultura"
          />
        </div>
        <div className="md:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-[#1d2327]">Descrição</label>
            <span className="text-[12px] text-[#50575e]">{form.description.length}/{DESCRIPTION_MAX}</span>
          </div>
          <textarea
            rows={1}
            maxLength={DESCRIPTION_MAX}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full min-h-9 px-3 py-2 border border-[#ccd0d4] rounded-md bg-white resize-y leading-5"
            placeholder="Breve descrição"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2 mt-2">
        <div>
          <label className="block text-sm font-medium text-[#1d2327] mb-1">Cor da etiqueta no site</label>
          <div className="flex items-center gap-2">
            <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
            <span className="inline-flex h-9 items-center text-[11px] text-white" style={{ backgroundColor: form.color }}>
              <span className="px-3 font-bold uppercase leading-none tracking-wide">{form.name || 'Categoria'}</span>
            </span>
          </div>
        </div>
        <button onClick={onSave} className="ml-2 flex h-9 items-center gap-2 px-4 bg-[#00a651] text-white rounded-md hover:bg-[#008f45]">
          <Save className="w-4 h-4" /> Guardar
        </button>
        <button onClick={onCancel} className="flex h-9 items-center gap-2 px-4 border border-[#ccd0d4] bg-white rounded-md hover:bg-[#f6f7f7]">
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>
    </div>
  );
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState(() => adminCacheGet<typeof INITIAL_CATEGORIES>('categories-page') ?? INITIAL_CATEGORIES);
  // Cores escolhidas no painel (slug -> #rrggbb); sem escolha vale a cor de origem da categoria.
  const [colors, setColors] = useState<Record<string, string>>(() => adminCacheGet<Record<string, string>>('categories-colors') ?? {});
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<CategoryForm>(EMPTY_FORM);
  const [newForm, setNewForm] = useState<CategoryForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => adminCacheGet('categories-page') === undefined);

  const colorOf = (slug: string) => colors[slug] ?? defaultCategoryColor(slug);

  useEffect(() => {
    let alive = true;
    // Contagens reais: vêm das notícias publicadas (as mesmas contas do site público).
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: { slug: string; label: string; count: number }[]; colors?: Record<string, string> }) => {
        if (!alive) return;
        const real = data.items ?? [];
        if (data.colors) {
          adminCacheSet('categories-colors', data.colors);
          setColors(data.colors);
        }
        setCategories((prev) => {
          const known = new Map(prev.map((c) => [c.slug, c]));
          const merged = real.map((r, i) => ({
            id: known.get(r.slug)?.id ?? 1000 + i,
            name: known.get(r.slug)?.name ?? r.label,
            slug: r.slug,
            count: r.count,
            description: known.get(r.slug)?.description ?? '',
          }));
          const rest = prev.filter((c) => !real.some((r) => r.slug === c.slug)).map((c) => ({ ...c, count: 0 }));
          const all = [...merged, ...rest];
          adminCacheSet('categories-page', all);
          return all;
        });
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  /** Grava a cor no servidor (é ela que o site público usa nas etiquetas). Sem alteração, não pede nada. */
  const saveColor = async (slug: string, color: string) => {
    if (color.toLowerCase() === colorOf(slug).toLowerCase()) return true;
    try {
      const res = await fetch('/api/admin/categories/colors', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, color }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao guardar a cor.`);
      adminCacheSet('categories-colors', body.colors);
      setColors(body.colors);
      setError(null);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Não foi possível guardar a cor.');
      return false;
    }
  };

  const handleEdit = (category: typeof INITIAL_CATEGORIES[0]) => {
    setIsEditing(category.id);
    setEditForm({ name: category.name, slug: category.slug, description: category.description, color: colorOf(category.slug) });
  };

  /** Grava o nome no servidor (é ele que o site e o formulário de notícias usam). Sem alteração, não pede nada. */
  const saveName = async (slug: string, name: string, before: string) => {
    const clean = name.trim();
    if (!clean || clean === before) return true;
    try {
      const res = await fetch('/api/admin/categories/names', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name: clean }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao guardar o nome.`);
      setError(null);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Não foi possível guardar o nome.');
      return false;
    }
  };

  const handleSave = async (id: number) => {
    const { color, ...rest } = editForm;
    const original = categories.find((c) => c.id === id);
    if (!(await saveName(rest.slug, rest.name, original?.name ?? ''))) return;
    if (!(await saveColor(rest.slug, color))) return;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...rest } : c)));
    setIsEditing(null);
  };

  const handleAdd = async () => {
    if (!newForm.name) return;
    const slug = slugFrom(newForm.slug || newForm.name);
    if (!(await saveColor(slug, newForm.color))) return;
    const newCategory = { id: Date.now(), name: newForm.name, slug, count: 0, description: newForm.description };
    setCategories((prev) => [...prev, newCategory]);
    setNewForm(EMPTY_FORM);
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Tem a certeza que deseja eliminar esta categoria?')) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

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
              <h1 className="text-2xl font-bold text-[#1d2327]">Categorias</h1>
              <p className="text-[#50575e] mt-1">Faça a gestão das categorias das notícias</p>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="flex h-9 items-center gap-2 px-4 text-[13px] bg-[#00a651] text-white rounded-md hover:bg-[#008f45]"
            >
              <Plus className="w-4 h-4" /> Adicionar Categoria
            </button>
          </div>

          {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700">{error}</div>}

          {isAdding && (
            <div className="mb-6">
              <CategoryFormBox title="Nova Categoria" form={newForm} setForm={setNewForm} onSave={handleAdd} onCancel={() => setIsAdding(false)} />
            </div>
          )}

          {/* Categories Table */}
          <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f6f7f7] text-left font-bold border-b border-[#ccd0d4]">
                  <th className="p-4">Nome</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4 text-center">Artigos</th>
                  <th className="p-4 text-right">Acções</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, idx) =>
                  isEditing === category.id ? (
                    <tr key={category.id} className="border-b border-[#f0f0f1] bg-white">
                      <td colSpan={5} className="p-3">
                        <CategoryFormBox
                          title={`Editar Categoria ${category.name}`}
                          form={editForm}
                          setForm={setEditForm}
                          onSave={() => handleSave(category.id)}
                          onCancel={() => setIsEditing(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={category.id} className={`group border-b border-[#f0f0f1] hover:bg-[#f6f7f7] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4" style={{ color: colorOf(category.slug) }} />
                          <Link
                            href={`/admin/noticias?categoria=${category.slug}`}
                            className="font-medium text-[#1d2327] hover:text-[#00a651] hover:underline"
                          >
                            {category.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 text-[#50575e]">
                        <span className="font-mono text-xs">{category.slug}</span>
                      </td>
                      <td className="px-4 py-1.5 text-[#50575e]">{category.description}</td>
                      <td className="px-4 py-1.5 text-center">
                        <span className="px-2 py-1 bg-[#00a651]/10 text-[#008f45] rounded-full text-xs font-semibold">{category.count}</span>
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 hover:opacity-100">
                          <button onClick={() => handleEdit(category)} className="p-2 text-[#2271b1] hover:bg-green-50 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(category.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
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

          <div className="mt-4 text-[13px] text-[#50575e]">{categories.length} categorias</div>
        </>
      )}
    </div>
  );
}
