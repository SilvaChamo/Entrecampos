/** Nome de exibição de um utilizador do painel, segundo as suas preferências (é o que fica como autor das notícias). */
export function displayNameOf(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined): string {
  if (!user) return 'Administrador';
  const m = (user.user_metadata || {}) as Record<string, string | undefined>;
  const first = m.first_name || '';
  const last = m.last_name || '';
  const fallback = user.email?.split('@')[0] || 'Administrador';
  switch (m.displayNameType || 'full_name') {
    case 'alcunha':
      return m.alcunha || `${first} ${last}`.trim() || fallback;
    case 'first_name_only':
      return first || fallback;
    default:
      return `${first} ${last}`.trim() || fallback;
  }
}

/** Iniciais para o avatar sem foto: primeira letra do primeiro e do último nome ("Francisco Mauele" = "FM"; um só nome = uma letra). */
export function initialsOf(name: string | null | undefined): string {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (first + last).toLocaleUpperCase('pt');
}
