import type { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'editor' | 'contribuidor' | 'guest';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  /** Conta de nível Colunista (sozinho ou também editor): o painel só mostra "Meus artigos". */
  colunista?: boolean;
}

/** Maps Supabase user_metadata.role (and similar labels) to app roles. */
export function mapRole(metaRole?: string | null): UserRole {
  const r = (metaRole || '').toLowerCase().trim();
  if (r === 'administrador' || r === 'admin') return 'admin';
  if (r === 'editor') return 'editor';
  // Colunista usa o painel e as permissões do contribuidor; o que o distingue (artigos só de Opinião) decide-o o servidor ao gravar.
  if (r === 'contribuidor' || r === 'contributor' || r === 'actor' || r === 'colunista') return 'contribuidor';
  return 'guest';
}

export function mapSupabaseUser(user: SupabaseUser): AppUser {
  const meta = user.user_metadata || {};
  const name =
    meta.full_name ||
    [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() ||
    meta.username ||
    user.email?.split('@')[0] ||
    'Utilizador';

  return {
    id: user.id,
    name,
    email: user.email || '',
    role: mapRole(meta.role),
    avatarUrl: meta.avatar_url || undefined,
  };
}

export function roleToMetadata(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'editor':
      return 'Editor';
    case 'contribuidor':
      return 'Contribuidor';
    default:
      return 'Subscritor';
  }
}

export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid_credentials')) {
    return 'E-mail ou senha incorrectos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirme o e-mail antes de entrar.';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Já existe uma conta com este e-mail.';
  }
  if (m.includes('password should be at least') || m.includes('password')) {
    return 'A senha não cumpre os requisitos mínimos.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Demasiadas tentativas. Aguarde um momento e tente de novo.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Não foi possível ligar ao servidor. Verifique a ligação.';
  }
  return message || 'Ocorreu um erro. Tente novamente.';
}

/** Para onde vai quem acabou de entrar: o endereço pedido (`next`, só se for desta página) ou o painel. */
export function destinoDepoisDeEntrar(next?: string | null): string {
  return caminhoInterno(next) ?? '/admin';
}

/** Só aceita caminhos desta mesma página (nunca outro site): sem caracteres de controlo, espaços ou barras invertidas, e que o URL resolva para a mesma origem. */
export function caminhoInterno(next?: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || /[\x00-\x20\x7f\\]/.test(next)) return null;
  try {
    const base = 'http://interno.invalid';
    const u = new URL(next, base);
    if (u.origin !== base) return null;
    const out = u.pathname + u.search + u.hash;
    // depois de normalizado (ex.: "/.//x" vira "//x") continua a ter de ser um caminho desta página
    return out.startsWith('/') && !out.startsWith('//') && !out.includes('\\') ? out : null;
  } catch {
    return null;
  }
}

/** `?next=` do endereço actual (só no navegador). */
export function proximoDoEndereco(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('next');
}
