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
