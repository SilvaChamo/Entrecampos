import Link from 'next/link';
import {
  Apple,
  Briefcase,
  Flower2,
  Leaf,
  Lightbulb,
  Palmtree,
  Sprout,
  Tag,
  Tractor,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import { defaultCategoryColor } from '@/lib/category-palette';

const ICONS: Record<string, LucideIcon> = {
  agricultura: Sprout,
  'sector-agrario': Tractor,
  comunidade: Users,
  'agro-negocio': Briefcase,
  curiosidade: Lightbulb,
  fruticultura: Apple,
  oportunidades: Briefcase,
  ambiente: Leaf,
  'turismo-rural': Palmtree,
  'mulher-agrario': Flower2,
  receitas: Utensils,
};

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Etiqueta de categoria: caixa quadrada com o ícone da categoria à esquerda
 * e o nome ao lado, com cantos suavemente arredondados.
 */
export default function CategoryBadge({
  label,
  slug,
  className = '',
  tabIndex,
}: {
  label: string;
  slug?: string;
  className?: string;
  tabIndex?: number;
}) {
  const key = slug || toSlug(label);
  const Icon = ICONS[key] ?? Tag;
  // A cor escolhida no painel chega por variável CSS (--cat-<slug>), posta pelo layout; sem ela vale a cor de origem.
  const color = `var(--cat-${key}, ${defaultCategoryColor(key)})`;
  return (
    // Clicável: abre a categoria. Não colocar dentro de outro <a>.
    <Link
      href={`/categoria/${key}`}
      tabIndex={tabIndex}
      className={`inline-flex items-stretch overflow-hidden align-middle text-white transition hover:brightness-110 ${className}`}
      style={{ backgroundColor: color }}
    >
      <span className="flex items-center justify-center bg-black/25 px-2.5">
        <Icon className="h-[1.1em] w-[1.1em]" strokeWidth={2.5} />
      </span>
      <span className="px-3 py-1.5 font-bold uppercase leading-none tracking-wide">{label}</span>
    </Link>
  );
}
