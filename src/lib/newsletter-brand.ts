import { defaultCategoryColor } from '@/lib/category-palette';

/** Dados da empresa para o cabeçalho e o rodapé da newsletter (os mesmos da página de contactos do site). */
export const BRAND = {
  name: 'EntreCAMPOS',
  tagline: 'Agricultura Sustentável em Moçambique',
  /** Título do cabeçalho, por cima da morada. */
  headline: 'O seu blog de notícias agro',
  address: 'Av. Kar Marx nº 177, Maputo, Moçambique',
  phones: ['+258 82 52 88 318', '+258 85 73 96 739'],
  emails: ['redação@entrecamposblog.com'],
  /** Redes sociais do rodapé do e-mail; `icon` é o ficheiro em /images/social. */
  social: [
    { key: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/258825288318' },
    { key: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/j.entrecampos.co.mz' },
    { key: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/entrecampos.co.mz/' },
    { key: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/company/65832996/' },
  ],
};

/** Verde dos botões «Ler mais» e vermelho da marca. */
export const GREEN = '#3e6611';
export const RED = '#d6101c';

export const categoryColor = (slug: string) => defaultCategoryColor(slug || '');

/** Largura do e-mail, em píxeis. */
export const EMAIL_WIDTH = 680;

/** Data por extenso, como nos cards do site (hora de Maputo). */
export const longDate = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Maputo' });

/** Ícone de cada categoria, o mesmo das etiquetas do site público (ficheiro em /images/categorias/<nome>.png). */
export const CATEGORY_ICON: Record<string, string> = {
  agricultura: 'sprout',
  'sector-agrario': 'tractor',
  comunidade: 'users',
  'agro-negocio': 'briefcase',
  curiosidade: 'lightbulb',
  fruticultura: 'apple',
  oportunidades: 'briefcase',
  ambiente: 'leaf',
  'turismo-rural': 'palmtree',
  'mulher-agrario': 'flower-2',
  receitas: 'utensils',
};
export const categoryIcon = (slug: string) => CATEGORY_ICON[slug] ?? 'tag';

/** A cor da caixa do ícone: a da categoria escurecida em 25% (o site põe preto a 25% por cima). */
export function darken(hex: string, amount = 0.25) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount)).toString(16).padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

/** Espaços de publicidade da newsletter: posição + tamanho (em píxeis), peso máximo da imagem (KB) e o nome de cada um. O preço define-se no painel. */
export const AD_POSITIONS = {
  topo: 'Em cima do cabeçalho',
  cabecalho: 'No cabeçalho',
  depois: 'Depois do cabeçalho',
  meio: 'No meio das notícias',
  rodape: 'Em cima do rodapé',
} as const;
export type AdPosition = keyof typeof AD_POSITIONS;
export const AD_LETTER: Record<AdPosition, string> = { topo: 'A', cabecalho: 'B', depois: 'C', meio: 'D', rodape: 'E' };
export const AD_SIZES = {
  faixa: 'Faixa (altura de um cartão de notícia)',
  destaque: 'Grande (altura máxima de 200 px)',
  caixa: 'Caixa (ao lado dos contactos)',
} as const;
export type AdSize = keyof typeof AD_SIZES;
/** Nome curto do tamanho, sem a explicação. */
export const adSizeName = (size: AdSize) => AD_SIZES[size].split(' (')[0];
export const AD_SLOTS: { key: string; position: AdPosition; size: AdSize; w: number; h: number; kb: number }[] = [
  { key: 'topo:faixa', position: 'topo', size: 'faixa', w: 680, h: 150, kb: 100 },
  { key: 'topo:destaque', position: 'topo', size: 'destaque', w: 680, h: 200, kb: 120 },
  { key: 'cabecalho:caixa', position: 'cabecalho', size: 'caixa', w: 200, h: 92, kb: 30 },
  { key: 'depois:faixa', position: 'depois', size: 'faixa', w: 680, h: 150, kb: 100 },
  { key: 'depois:destaque', position: 'depois', size: 'destaque', w: 680, h: 200, kb: 120 },
  { key: 'meio:faixa', position: 'meio', size: 'faixa', w: 680, h: 150, kb: 100 },
  { key: 'meio:destaque', position: 'meio', size: 'destaque', w: 680, h: 200, kb: 120 },
  { key: 'rodape:faixa', position: 'rodape', size: 'faixa', w: 680, h: 150, kb: 100 },
  { key: 'rodape:destaque', position: 'rodape', size: 'destaque', w: 680, h: 200, kb: 120 },
];
export const slotLabel = (key: string) => {
  const s = AD_SLOTS.find((x) => x.key === key);
  return s ? `${AD_POSITIONS[s.position]} · ${adSizeName(s.size)} (${s.w} × ${s.h}, até ${s.kb} KB)` : key;
};
export const formatPrice = (n: number | undefined) => (typeof n === 'number' && n > 0 ? `${n.toLocaleString('pt-PT')} MT` : 'Sob consulta');
