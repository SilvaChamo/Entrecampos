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

/**
 * Cores das etiquetas: verdes do site EntreCAMPOS (Elementor/tema) e vermelhos da marca,
 * em várias tonalidades, alternados para categorias vizinhas se distinguirem.
 */
const CATEGORY_COLORS: Record<string, string> = {
  agricultura: '#3F9B1E', // verde claro
  comunidade: '#D6101C', // vermelho da marca
  'agro-negocio': '#037E02',
  curiosidade: '#B00D17',
  'sector-agrario': '#2E7C04',
  ambiente: '#E53935',
  'turismo-rural': '#589442',
  'mulher-agrario': '#8E0B13',
  fruticultura: '#225E3B',
  oportunidades: '#C62828',
  receitas: '#A50F1A',
};
const DEFAULT_COLOR = '#D6101C';

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
  const color = CATEGORY_COLORS[key] ?? DEFAULT_COLOR;
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
