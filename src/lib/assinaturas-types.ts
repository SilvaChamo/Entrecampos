/** Subscrições da EntreCAMPOS: tipos e funções partilhadas entre o site e o painel (sem acesso à base de dados). */

export type Plano = {
  id: string;
  name: string;
  description?: string;
  /** Preço em meticais. Sem preço (null) o plano aparece como "Preço a anunciar" e ainda não se pode pedir. */
  price: number | null;
  /** Duração em meses (1 = mensal, 12 = anual). */
  months: number;
  features: string[];
  active: boolean;
};

export type PlanosConfig = { plans: Plano[]; payment: string };

export type EstadoPedido = 'pendente' | 'aprovado' | 'rejeitado';

export type Pedido = {
  id: string;
  userId: string;
  email: string;
  name: string;
  planId: string;
  planName: string;
  price: number | null;
  months: number;
  /** Referência do pagamento indicada pelo leitor (código M-Pesa / e-Mola, número da transferência…). */
  reference: string;
  status: EstadoPedido;
  note?: string;
  createdAt: string;
  decidedAt?: string;
};

export type Subscricao = { planId: string; planName: string; since: string; until: string };

export type Exclusiva = { slug: string; title: string; date: string; category: string };

export const subscricaoActiva = (s: Subscricao | null | undefined, agora = Date.now()) => !!s && new Date(s.until).getTime() > agora;

export const precoEmTexto = (p: Pick<Plano, 'price' | 'months'>) =>
  p.price == null ? 'Preço a anunciar' : `${new Intl.NumberFormat('pt-PT').format(p.price)} MT / ${p.months === 1 ? 'mês' : p.months === 12 ? 'ano' : `${p.months} meses`}`;

export const dataEmTexto = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Maputo' });

export const diasAte = (iso: string, agora = Date.now()) => Math.ceil((new Date(iso).getTime() - agora) / 86400000);

/** Soma `months` meses a uma data (sem saltar para o mês seguinte: 31 Jan + 1 mês = 28/29 Fev). */
export function somarMeses(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

export const PLANOS_BASE: Plano[] = [
  { id: 'assinante-mensal', name: 'Assinante mensal', description: 'Para quem vive do campo', price: null, months: 1, features: ['Notícias e análises exclusivas', 'Oportunidades e guias completos', 'Resumo semanal na caixa de e-mail'], active: true },
  { id: 'assinante-anual', name: 'Assinante anual', description: 'Melhor preço', price: null, months: 12, features: ['Tudo o que o plano mensal inclui', 'Desconto sobre 12 meses'], active: true },
];

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

/** Valida e limpa os planos recebidos do painel. */
export function validarPlanos(input: unknown): { ok: true; config: PlanosConfig } | { ok: false; error: string } {
  const body = (input ?? {}) as { plans?: unknown; payment?: unknown };
  if (!Array.isArray(body.plans)) return { ok: false, error: 'Planos inválidos.' };
  if (body.plans.length > 12) return { ok: false, error: 'Demasiados planos (máximo 12).' };
  const clean = (v: unknown, max: number) => String(v ?? '').replace(/<[^>]*>/g, '').trim().slice(0, max);
  const ids = new Set<string>();
  const plans: Plano[] = [];
  for (const raw of body.plans as Record<string, unknown>[]) {
    const name = clean(raw?.name, 60).replace(/\s*[·•]\s*/g, ' ').replace(/\.+$/, '').trim();
    if (!name) return { ok: false, error: 'Todos os planos precisam de um nome.' };
    const months = num(raw.months);
    if (!Number.isInteger(months) || months < 1 || months > 36) return { ok: false, error: `Duração inválida em "${name}" (1 a 36 meses).` };
    const priceRaw = raw.price === null || raw.price === '' || raw.price === undefined ? null : num(raw.price);
    if (priceRaw !== null && (Number.isNaN(priceRaw) || priceRaw < 0 || priceRaw > 10_000_000)) return { ok: false, error: `Preço inválido em "${name}".` };
    let id = clean(raw.id, 40).replace(/[^a-z0-9-]/gi, '').toLowerCase() || Math.random().toString(36).slice(2, 10);
    while (ids.has(id)) id += 'x';
    ids.add(id);
    plans.push({
      id,
      name,
      description: clean(raw.description, 120) || undefined,
      price: priceRaw,
      months,
      features: (Array.isArray(raw.features) ? raw.features : []).map((f) => clean(f, 100)).filter(Boolean).slice(0, 10),
      active: raw.active !== false,
    });
  }
  return { ok: true, config: { plans, payment: clean(body.payment, 600) } };
}

/** Primeiros parágrafos de uma notícia exclusiva: é o que qualquer leitor vê antes do convite a assinar. */
export function inicioDoTexto(html: string, paragraphs = 2): string {
  const parts = (html || '').split(/(?<=<\/p>)/i).filter((p) => p.replace(/<[^>]+>/g, '').trim());
  const head = parts.slice(0, paragraphs).join('');
  if (head.replace(/<[^>]+>/g, '').trim().length >= 40) return head;
  const plain = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
  return plain ? `<p>${plain}…</p>` : '';
}
