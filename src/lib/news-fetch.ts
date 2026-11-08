/**
 * Busca diária de notícias (agricultura, clima e ambiente) para a fila de pendentes. Mesmo sistema da Base de Dados Agro
 * (app/api/cron/news-fetch): feeds RSS de fontes de Moçambique, filtro de relevância pelo TÍTULO, texto e imagem
 * extraídos da página da fonte. Chamada pela rota /api/cron/buscar-noticias.
 */

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Fontes com feed RSS directo. As generalistas só passam pelo filtro de relevância (rede de pesca). */
export const FEEDS: { url: string; label: string }[] = [
  { url: 'https://www.agricultura.gov.mz/feed/', label: 'Ministério da Agricultura' },
  { url: 'https://revistaterraonline.com/destaques/feed/', label: 'Revista Terra' },
  { url: 'https://jornalnoticias.co.mz/feed/', label: 'Jornal Notícias' },
  { url: 'https://opais.co.mz/feed/', label: 'O País' },
  { url: 'https://cartamz.com/feed/', label: 'Carta de Moçambique' },
  { url: 'https://jornaldomingo.co.mz/feed/', label: 'Jornal Domingo' },
  { url: 'https://360mozambique.com/feed/', label: '360 Mozambique' },
];

/** Só interessam as notícias do dia: as das últimas 48 horas (a busca corre à 1h da manhã). */
export const MAX_AGE_HOURS = 48;

const AGRI_TERMS = [
    // Núcleo agrícola / agro / agrário
    'agr[ií]cola', 'agricultur\\w*', 'agr[oó]nom\\w*', 'agroneg[oó]cio',
    'agr[oó]\\s?-?\\s?ind[uú]stri\\w*', 'agropecu[aá]ri\\w*', 'agro\\s?-?\\s?pecu[aá]ri\\w*',
    'agr[aá]ri[oa]s?', 'agroprocessa\\w*', 'agroflorest\\w*', 'agro-?ecolog\\w*',
    // Pecuária e criação animal
    'pecu[aá]ri\\w*', 'avicultur\\w*', 'suinicultur\\w*', 'bovinicultur\\w*',
    'piscicultur\\w*', 'aqui?cultur\\w*', 'apicultur\\w*',
    '\\bgado\\b', 'rebanho\\w*', 'bovin[oa]s?', '\\bzebus?\\b', 'caprinos?', 'su[ií]nos?', 'capoeira',
    // Gente do campo
    'campon[eê]s\\w*', 'agricultor\\w*', 'lavrador\\w*', 'pequenos? produtor\\w*',
    // Actividade agrícola
    'lavoura\\w*', 'colheita\\w*', '\\bsafra\\b', 'campanha agr[aá]ria', 'planta[çc][aã]o',
    'sementeir\\w*', '\\bsementes?\\b', 'plant[ií]o', '\\bcultivo\\w*', 'produ[çc][aã]o agr[ií]cola',
    'produ[çc][aã]o de alimentos', 'produ[çc][aã]o alimentar', 'produtiv\\w* agr[ií]cola',
    // Água, solo, insumos
    'irriga[çc]\\w*', 'regadio', 'fertilizante\\w*', '\\baduba?o\\w*', 'cal[çc][aá]rio agr[ií]cola',
    'insumos? agr[ií]cola\\w*', 'mecaniza[çc][aã]o agr[ií]cola', 'semente\\w* melhorada\\w*',
    // Pragas / sanidade
    '\\bpraga\\w*', 'gafanhoto\\w*', 'lagarta\\w*', 'peste su[ií]na', 'gripe aviária',
    'fitossanit[aá]ri\\w*',
    // Culturas
    '\\bmilho\\b', '\\barroz\\b', '\\btrigo\\b', '\\bfeij[aã]o\\b', '\\bsoja\\b', 'mapira',
    'mexoeira', '\\bsorgo\\b', 'mandioca', 'batata\\s?-?doce', 'hort[ií]cola\\w*',
    'hortali[çc]a\\w*', 'oler[ií]cola\\w*', 'gergelim', 'amendoim', 'girassol',
    'cana\\s?-?de\\s?-?a[çc][uú]car', '\\btabaco\\b', 'cajueiro\\w*', 'castanha de caju',
    '\\bcaju\\b', 'algod[aã]o', 'macad[aâ]mia', '\\bcitrinos\\b',
    // Sistema agrário / instituições especializadas
    'extens[aã]o rural', 'desenvolvimento rural', 'seguran[çc]a alimentar',
    'soberania alimentar', 'cadeia\\w* de valor agr\\w*', 'sistema\\w* alimentar\\w*',
    '\\bIIAM\\b', '\\bINIR\\b', '\\bSETSAN\\b',
    // Inglês (Club of Mozambique publica em inglês)
    'agricultur\\w*', 'agri-?business', 'agronom\\w*', '\\bfarm(?:ers?|ing|land|s)\\b',
    '\\bcrops?\\b', '\\bharvest\\w*', '\\blivestock\\b', '\\birrigation\\b',
    '\\bfertili[sz]er\\w*', '\\bseeds?\\b', '\\bmaize\\b', '\\bcassava\\b',
    '\\bsmallholder\\w*', 'food security', 'food production', 'agri-?food',
    'beekeep\\w*', 'apicultur\\w*', '\\bpoultry\\b', '\\bcattle\\b', '\\bgrain\\b',
    'horticultur\\w*', 'plantation\\w*', 'greenhouse\\w*', 'estufas? agr\\w*',
];
const AGRI_PATTERN = new RegExp(AGRI_TERMS.join('|'), 'i');

// Clima + tempo + ambiente + desastres naturais. O utilizador quer estes
// temas TODOS, mesmo sem ligação directa à lavoura ("chuvas cortam
// estradas", "ciclone destrói Quelimane", "nível do mar sobe").
const CLIMATE_ENV_TERMS = [
    // Clima / carbono
    'clima\\b', 'clim[aá]tic\\w*', 'mudan[çc]as? clim\\w*', 'altera[çc][õo]es? clim\\w*',
    'aquecimento global', 'crise clim\\w*', 'emerg[êe]ncia clim\\w*', 'resili[êe]ncia clim\\w*',
    'ac[çc][aã]o clim\\w*', 'adapta[çc][aã]o clim\\w*', 'clima-?smart', 'climate-?smart', 'climate change',
    'gases? com efeito de estufa', 'emiss[õo]es de (?:carbono|gases|co2|di[óo]xido)',
    'cr[ée]ditos? de carbono', 'neutralidade carb[óo]nica', 'pegada de carbono', 'sequestro de carbono',
    'transi[çc][aã]o energ[ée]tica', 'energias? renov\\w*', 'fotovoltaic\\w*', 'e[óo]lic[ao]s?\\b',
    // Seca / água / desertificação
    '\\bseca\\b', '\\bsecas\\b', 'estiagem', 'aridez', 'desertifica[çc][aã]o',
    'degrada[çc][aã]o (?:do solo|da terra|dos solos)', 'eros[aã]o (?:do solo|costeira|dos solos)',
    'd[ée]fice h[ií]drico', 'stress h[ií]drico', 'escassez de [aá]gua', 'seguran[çc]a h[ií]drica',
    'recursos h[ií]dricos', 'bacia hidrogr[aá]fica', 'barragem\\w*', 'len[çc]ol fre[aá]tico',
    // Chuva / tempo / meteorologia
    '\\bchuvas?\\b', 'precipita[çc][aã]o', '[ée]poca chuvosa', '\\bsequeiro\\b', 'irregularidade das chuvas',
    'meteorolog\\w*', '\\bINAM\\b', 'previs[aã]o do tempo', 'mau tempo', 'vento\\w* fort\\w*',
    'ventos? ciclonic\\w*', 'temporal\\b', 'trovoada\\w*', 'granizo', 'onda de calor', 'vaga de calor',
    // Ciclones / cheias / calamidades
    '\\bcheias?\\b', 'inunda[çc][õo]es?', 'enxurrada\\w*', 'aluvi[aã]o', 'ciclone\\w*',
    'depress[aã]o tropical', 'tempestade tropical', 'desliza\\w* de terras?', 'calamidade\\w*',
    'desastres? naturais?', 'cat[aá]strofe\\w* natural\\w*', '\\bINGD\\b', 'popula[çc][õo]es? afectad\\w*',
    'el ni[nñ]o', 'la ni[nñ]a', 'fen[óo]meno\\w* clim\\w*', 'eventos? clim\\w*', 'extremos clim\\w*',
    'n[íi]vel do mar', 'zona\\w* costeira\\w*',
    // Ambiente / natureza / floresta
    'meio ambiente', 'ambient(?:al|ais)\\w*', 'ambientalist\\w*', 'sustentabilidade', 'desenvolvimento sustent\\w*',
    'biodiversidade', 'ecossistema\\w*', 'conserva[çc][aã]o (?:da natureza|ambiental|de recursos|marinha)',
    '[aá]reas? de conserva[çc][aã]o', '[aá]reas? protegidas?', 'parque nacional', 'reserva natural',
    '\\bfauna\\b', 'vida selvagem', 'esp[ée]cies? amea[çc]ad\\w*', 'ca[çc]a furtiva',
    'floresta\\w*', 'desfloresta[çc][aã]o', 'reflorest\\w*', 'queimadas?', 'inc[êe]ndios? florest\\w*',
    '\\bmangal\\b', 'mangais', 'polui[çc][aã]o', 'res[íi]duos s[óo]lidos', 'lixo pl[aá]stico',
    // Inglês
    '\\bdrought\\b', '\\brainfall\\b', 'greenhouse gas', 'climate resilien\\w*', 'sea[- ]level',
    'deforestation', 'biodiversity', 'cyclone\\w*', 'flooding', '\\bfloods?\\b',
    'national park', 'wildlife', 'conservation area', 'mangrove\\w*', 'reforestation',
];
const CLIMATE_ENV_PATTERN = new RegExp(CLIMATE_ENV_TERMS.join('|'), 'i');

// Fora do âmbito da plataforma. Barreira dura: se o TÍTULO bater aqui, o
// artigo é rejeitado mesmo que mencione "água" ou "planta" de passagem.
const BLOCK_TERMS = [
    // Saúde / estilo de vida / consumo (1 set — a fila estava a encher-se
    // disto vindo de portais generalistas).
    '\\bpele\\b', 'beleza', 'maquilha\\w*', 'cosm[ée]tic\\w*', 'emagrec\\w*', '\\bdieta\\b',
    'bem-?estar', 'auditiv\\w*', 'audi[çc][aã]o', 'pr[ée]-?ecl[aâ]mpsia', 'gravidez',
    'menstrua\\w*', 'sintomas? (?:de|que)', 'hor[óo]scopo', '\\bsigno\\b',
    'decora[çc][aã]o', 'decorar (?:a|o|sua) (?:casa|sala|quarto|espa[çc]o)',
    'animais? de estima[çc][aã]o', 'c[ãa]es e gatos', '\\bpirataria\\b', 'pirateado\\w*',
    '\\bMultichoice\\b', '\\bDStv\\b', 'streaming', 'telenovela\\w*', 'receitas? de culin[áa]ria',
    // Política
    '\\belei[çc][õo]es\\b', 'eleitoral\\w*', 'recenseamento eleitoral', '\\bpartido\\b', '\\bpartid[áa]ri\\w*',
    '\\bFrelimo\\b', '\\bRenamo\\b', '\\bMDM\\b', 'parlament\\w*', 'assembleia da rep[uú]blica',
    'assembleia municipal', '\\bbancada\\b', 'deputad\\w*', 'remodela[çc][aã]o governament\\w*',
    'toma(?:da|r) de posse', 'conselho de ministros', 'mo[çc][aã]o de censura', 'referendo',
    'campanha eleitoral', '\\bsondagem\\w*', 'l[íi]der da oposi[çc][aã]o', 'oposi[çc][aã]o pol[ií]tica',
    '\\bgreve\\w*', 'd[íi]vidas ocultas', 'processo-?crime',
    // Desporto
    '\\bfutebol\\b', '\\bMambas\\b', '\\bgolos?\\b', 'ta[çc]a das na[çc][õo]es', '\\bCOSAFA\\b',
    'mo[çc]ambola', 'campeonato\\w*', 'est[aá]dio\\w*', 'treinador\\w*', 'atletismo', 'basquetebol',
    'andebol', 'jogos escolares', 'sele[çc][çc][aã]o nacional', 'liga (?:mo[çc]|desport|dos campe)',
    // Crime / faits divers
    'esfaquead\\w*', 'homic[íi]dio\\w*', 'assassinad\\w*', 'assassinato\\w*', 'raptad\\w*',
    'sequestrad\\w*', '\\brapto\\w*', 'roubo à mão armada', 'assalto à mão armada',
    'tr[aá]fico de droga\\w*', 'estupefacientes', 'viola[çc][aã]o sexual', 'corpo sem vida',
    'linchamento\\w*', 'detid\\w* pela pol[íi]cia',
    // Entretenimento / cultura
    '\\bm[uú]sica\\b', 'concerto\\w*', 'espect[aá]culo\\w*', '\\bartista\\w*', '\\bcantor\\w*',
    '\\brapper\\b', '\\bfilme\\w*', 'celebridade\\w*', 'desfile de moda', 'passadeira vermelha',
    'festival (?:de m[uú]sica|de cinema|cultural)',
];
const BLOCK_PATTERN = new RegExp(BLOCK_TERMS.join('|'), 'i');

// Só passa notícia MESMO ligada a agricultura ou clima/ambiente. O sinal
// tem de estar no TÍTULO — só no corpo não chega: artigos de estilo de vida
// mencionavam "óleo", "planta", "natural", "água" e escapavam (1 set:
// "pontes", "pele bonita", "animal de estimação", "problemas auditivos"...).
export function isRelevantNews(title: string): boolean {
    if (BLOCK_PATTERN.test(title)) return false;        // saúde/lifestyle/consumo — fora
    if (AGRI_PATTERN.test(title)) return true;          // agricultura — entra
    if (CLIMATE_ENV_PATTERN.test(title)) return true;   // clima / tempo / ambiente / desastres — entra
    return false;                                       // título sem sinal forte — fora
}

const CATEGORY_RULES: { pattern: RegExp; category: string }[] = [
  { pattern: /\b(evento|feira|conferência|congresso|workshop|seminário|conference|summit)\b/i, category: 'evento' },
  { pattern: /\b(financiamento|crédito|fundo|investimento|subsídio|empréstimo|investment|funding|loan)\b/i, category: 'oportunidades' },
  { pattern: /\b(áfrica do sul|zimbabué|zâmbia|malawi|tanzânia|internacional|mundial|global|onu|fao|international)\b/i, category: 'internacional' },
  { pattern: /\b(pecuári\w*|gado|avicultur\w*|suinicultur\w*|bovin\w*|caprino\w*|livestock|poultry|cattle)\b/i, category: 'agro-pecuaria' },
  { pattern: /\b(apicultur\w*|mel\b|beekeep\w*)/i, category: 'apicultura' },
  { pattern: /\b(seguran[çc]a alimentar|food security)\b/i, category: 'seguranca-alimentar' },
  { pattern: /\b(clim\w*|ciclone\w*|chuvas?|seca|cheias?|inunda\w*|ambient\w*|florest\w*|biodiversidade|climate|drought|flood\w*)\b/i, category: 'ambiente' },
];

/** Categoria do EntreCAMPOS (endereço) a partir do título e do resumo; por omissão, Agricultura. */
export function guessCategory(text: string): string {
  for (const rule of CATEGORY_RULES) if (rule.pattern.test(text)) return rule.category;
  return 'agricultura';
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-').replace(/&#8230;/g, '…').replace(/&nbsp;/g, ' ');
}

function extractTag(chunk: string, tag: string): string {
  const match = chunk.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!match) return '';
  return decodeHtmlEntities(match[1].replace('<![CDATA[', '').replace(']]>', '').trim());
}

export type RssItem = { title: string; link: string; pubDate: string; description: string };

export async function fetchFeed(feedUrl: string): Promise<RssItem[]> {
  const res = await fetch(feedUrl, { headers: { 'User-Agent': BROWSER_UA }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Feed ${res.status} para "${feedUrl}"`);
  const xml = await res.text();
  const items: RssItem[] = [];
  for (const raw of xml.split('<item>').slice(1)) {
    const chunk = raw.split('</item>')[0];
    const title = extractTag(chunk, 'title');
    const link = extractTag(chunk, 'link');
    const pubDate = extractTag(chunk, 'pubDate');
    const description = extractTag(chunk, 'description').replace(/<[^>]+>/g, '').trim();
    if (title && link) items.push({ title, link, pubDate, description });
  }
  return items;
}

/** Imagem principal (og:image) e parágrafos do artigo, tirados da página da fonte (sem IA, extracção directa). */
export async function fetchArticleContent(url: string): Promise<{ image: string | null; paragraphs: string[] }> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { image: null, paragraphs: [] };
    const html = await res.text();
    const imageMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const image = imageMatch ? decodeHtmlEntities(imageMatch[1]) : null;
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '').trim()))
      .filter((p) => p.length > 40 && !/^(share|leia também|leia mais|related|publicidade)/i.test(p));
    return { image, paragraphs };
  } catch {
    return { image: null, paragraphs: [] };
  }
}
