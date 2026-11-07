/**
 * Cores das etiquetas de categoria: verdes do site EntreCAMPOS (Elementor/tema) e vermelhos da marca,
 * em várias tonalidades, alternados para categorias vizinhas se distinguirem.
 */
export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  agricultura: '#3F9B1E', // verde claro
  comunidade: '#D6101C', // vermelho da marca
  'agro-negocio': '#037E02',
  curiosidade: '#B00D17',
  'sector-publico': '#2E7C04',
  ambiente: '#E53935',
  'turismo-rural': '#589442',
  'mulher-agrario': '#8E0B13',
  fruticultura: '#225E3B',
  oportunidades: '#1BB35A', // verde vivo, distinto do da Agricultura
  receitas: '#A50F1A',
};
export const DEFAULT_CATEGORY_COLOR = '#D6101C';

/** Tonalidades por cor, do mais escuro ao mais claro: cada cor é uma linha da paleta do painel (escuro à esquerda, claro à direita). */
export const CATEGORY_HUES = [
  ['#06260F', '#0F3D1E', '#225E3B', '#037E02', '#3F9B1E', '#1BB35A', '#6CCB7A', '#B5E6B8'], // verde
  ['#1E3A0C', '#33591A', '#4F7F22', '#6FA52A', '#8FC73E', '#AEDB62', '#CBEA8D', '#E4F5BF'], // verde-lima
  ['#3E0408', '#5E070D', '#8E0B13', '#B00D17', '#D6101C', '#E53935', '#F28B82', '#F9C4C0'], // vermelho
  ['#4A0A1F', '#7A0F2E', '#A61240', '#CC1A52', '#E8386B', '#F06A8F', '#F79AB3', '#FBCFDB'], // vermelho-carmim
  ['#6B3000', '#9C4A00', '#C25E00', '#E86F00', '#F57C00', '#FB9A2E', '#FFB866', '#FFD9A8'], // laranja
  ['#000000', '#171717', '#212121', '#424242', '#616161', '#8A8A8A', '#B5B5B5', '#E0E0E0'], // preto e cinzas
];

/** Paleta que o painel oferece para escolher a cor de uma categoria: 6 linhas (uma por cor), de 8 tonalidades cada. */
export const CATEGORY_PALETTE = CATEGORY_HUES.flat();

export const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);

export const defaultCategoryColor = (slug: string) => DEFAULT_CATEGORY_COLORS[slug] ?? DEFAULT_CATEGORY_COLOR;
