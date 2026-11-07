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
/** Altura fixa da foto da notícia em destaque (todas iguais, cortadas ao centro). */
export const LEAD_IMAGE_HEIGHT = 340;
export const EMAIL_WIDTH = 680;

/** Data por extenso, como nos cards do site (hora de Maputo). */
export const longDate = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Maputo' });

/** Ícone de cada categoria, o mesmo das etiquetas do site público (ficheiro em /images/categorias/<nome>.png). */
export const CATEGORY_ICON: Record<string, string> = {
  agricultura: 'sprout',
  'sector-publico': 'tractor',
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

/** Espaços de publicidade da newsletter: cada um tem uma única medida (píxeis) e um peso máximo da imagem (KB). O preço define-se no painel. */
export const AD_POSITIONS = {
  topo: 'Em cima do cabeçalho',
  cabecalho: 'No cabeçalho',
  depois: 'Depois do cabeçalho',
  meio: 'No meio das notícias',
  rodape: 'Em cima do rodapé',
} as const;
export type AdPosition = keyof typeof AD_POSITIONS;
export const AD_LETTER: Record<AdPosition, string> = { topo: 'A', cabecalho: 'B', depois: 'C', meio: 'D', rodape: 'E' };
/** `key` é a própria posição. O espaço do meio é o mais alto (500 px). */
export const AD_SLOTS: { key: AdPosition; position: AdPosition; w: number; h: number; kb: number }[] = [
  { key: 'topo', position: 'topo', w: 680, h: 200, kb: 120 },
  { key: 'cabecalho', position: 'cabecalho', w: 230, h: 120, kb: 30 },
  { key: 'depois', position: 'depois', w: 680, h: 200, kb: 120 },
  { key: 'meio', position: 'meio', w: 680, h: 500, kb: 300 },
  { key: 'rodape', position: 'rodape', w: 680, h: 200, kb: 120 },
];
/** Medida e peso de um espaço, como se mostra depois do nome: «Medida: 680x120px, Tamanho: 80kb». */
export const adMeasure = (s: { w: number; h: number; kb: number }) => `Medida: ${s.w}x${s.h}px, Tamanho: ${s.kb}kb`;
export const slotLabel = (key: string) => {
  const s = AD_SLOTS.find((x) => x.key === key);
  return s ? `${AD_POSITIONS[s.position]} — ${adMeasure(s)}` : key;
};
export const formatPrice = (n: number | undefined) => (typeof n === 'number' && n > 0 ? `${n.toLocaleString('pt-PT')} MT` : 'Sob consulta');
