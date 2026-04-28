// Definição de todas as capacidades disponíveis no sistema
export const CAPABILITIES = {
  'Artigos': [
    { id: 'ler_artigos', label: 'Ler artigos' },
    { id: 'criar_artigos', label: 'Criar artigos' },
    { id: 'editar_artigos', label: 'Editar artigos' },
    { id: 'publicar_artigos', label: 'Publicar artigos' },
    { id: 'eliminar_artigos', label: 'Eliminar artigos' },
    { id: 'rever_artigos', label: 'Rever artigos' },
  ],
  'Multimédia': [
    { id: 'upload_imagens', label: 'Upload de imagens' },
    { id: 'gerir_biblioteca', label: 'Gerir biblioteca' },
    { id: 'usar_media', label: 'Usar media em artigos' },
  ],
  'Páginas': [
    { id: 'ler_paginas', label: 'Ler páginas' },
    { id: 'editar_paginas', label: 'Editar páginas' },
    { id: 'criar_paginas', label: 'Criar páginas' },
    { id: 'eliminar_paginas', label: 'Eliminar páginas' },
  ],
  'Utilizadores': [
    { id: 'listar_utilizadores', label: 'Listar utilizadores' },
    { id: 'criar_utilizadores', label: 'Criar utilizadores' },
    { id: 'editar_utilizadores', label: 'Editar utilizadores' },
    { id: 'eliminar_utilizadores', label: 'Eliminar utilizadores' },
    { id: 'gerir_permissoes', label: 'Gerir permissões' },
  ],
  'Configurações': [
    { id: 'ver_definicoes', label: 'Ver definições' },
    { id: 'editar_definicoes', label: 'Editar definições' },
    { id: 'gerir_plugins', label: 'Gerir plugins' },
    { id: 'gerir_temas', label: 'Gerir temas' },
  ],
  'Estatísticas': [
    { id: 'ver_estatisticas', label: 'Ver estatísticas' },
    { id: 'ver_relatorios', label: 'Ver relatórios' },
  ],
  'Sistema': [
    { id: 'modo_manutencao', label: 'Modo manutenção' },
    { id: 'backup_restaurar', label: 'Backup e restaurar' },
    { id: 'acesso_total', label: 'Acesso total (Admin)' },
  ],
};

// Permissões padrão por role
export const DEFAULT_ROLE_PERMISSIONS = {
  admin: [
    'acesso_total', 'ler_artigos', 'editar_artigos', 'criar_artigos', 'publicar_artigos', 
    'eliminar_artigos', 'rever_artigos', 'upload_imagens', 'gerir_biblioteca', 'usar_media',
    'ler_paginas', 'editar_paginas', 'criar_paginas', 'eliminar_paginas',
    'listar_utilizadores', 'criar_utilizadores', 'editar_utilizadores', 'eliminar_utilizadores', 'gerir_permissoes',
    'ver_definicoes', 'editar_definicoes', 'gerir_plugins', 'gerir_temas',
    'ver_estatisticas', 'ver_relatorios', 'modo_manutencao', 'backup_restaurar'
  ],
  editor: [
    'ler_artigos', 'editar_artigos', 'criar_artigos', 'publicar_artigos', 
    'usar_media', 'ler_paginas', 'editar_paginas', 'rever_artigos'
  ],
  contribuidor: [
    'ler_artigos', 'criar_artigos', 'usar_media'
  ],
  guest: [
    'ler_artigos'
  ],
};

// Verifica se uma role tem uma permissão
export function hasPermission(role: string, permission: string, customPermissions?: Record<string, string[]>): boolean {
  if (customPermissions && customPermissions[role]) {
    return customPermissions[role].includes(permission);
  }
  return DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS]?.includes(permission) || false;
}

// Verifica se uma role pode acessar uma rota
export function canAccessRoute(role: string, route: string): boolean {
  const routePermissions: Record<string, string[]> = {
    '/admin/noticias': ['ler_artigos', 'acesso_total'],
    '/admin/noticias/nova': ['criar_artigos', 'acesso_total'],
    '/admin/noticias/editar': ['editar_artigos', 'acesso_total'],
    '/admin/media': ['usar_media', 'gerir_biblioteca', 'upload_imagens', 'acesso_total'],
    '/admin/utilizadores': ['listar_utilizadores', 'acesso_total'],
    '/admin/definicoes': ['ver_definicoes', 'acesso_total'],
    '/admin/capacidades': ['gerir_permissoes', 'acesso_total'],
    '/admin/dashboard': ['acesso_total'],
    '/admin/editor': ['ler_artigos', 'editar_artigos', 'acesso_total'],
    '/admin/contribuidor': ['criar_artigos', 'ler_artigos', 'acesso_total'],
    '/admin/guest': ['ler_artigos'],
  };

  // Encontra a rota base
  const baseRoute = Object.keys(routePermissions).find(r => route.startsWith(r)) || route;
  const required = routePermissions[baseRoute] || ['acesso_total'];
  
  return required.some(p => hasPermission(role, p));
}
