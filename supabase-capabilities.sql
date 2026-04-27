-- =====================================================
-- TABELAS DE CAPACIDADES E PERMISSÕES
-- =====================================================

-- Tabela de capacidades (capabilities) disponíveis no sistema
CREATE TABLE IF NOT EXISTS public.capabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(200) NOT NULL,
    description TEXT,
    group_name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de papéis (roles)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de associação entre papéis e capacidades (role_capabilities)
CREATE TABLE IF NOT EXISTS public.role_capabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES public.capabilities(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, capability_id)
);

-- Tabela de redirecionamentos por papel
CREATE TABLE IF NOT EXISTS public.role_redirects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    after_login_path VARCHAR(255) DEFAULT '/admin/dashboard',
    after_logout_path VARCHAR(255) DEFAULT '/',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id)
);

-- Tabela de recursos visíveis por papel (para menu lateral)
CREATE TABLE IF NOT EXISTS public.role_menu_visibility (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    menu_item VARCHAR(100) NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, menu_item)
);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir papéis padrão
INSERT INTO public.roles (name, label, description, is_system) VALUES
    ('admin', 'Administrador', 'Acesso total ao sistema', true),
    ('editor', 'Editor', 'Pode editar e publicar conteúdo', true),
    ('contribuidor', 'Contribuidor', 'Pode submeter conteúdo para revisão', true),
    ('subscriber', 'Subscritor', 'Acesso limitado apenas leitura', true),
    ('guest', 'Visitante', 'Acesso mínimo ao painel', true)
ON CONFLICT (name) DO NOTHING;

-- Inserir capacidades padrão
INSERT INTO public.capabilities (name, label, description, group_name, icon) VALUES
    -- Artigos
    ('ler_artigos', 'Ler artigos', 'Visualizar lista de artigos', 'Artigos', 'FileText'),
    ('editar_artigos', 'Editar artigos', 'Modificar conteúdo existente', 'Artigos', 'Edit3'),
    ('criar_artigos', 'Criar artigos', 'Adicionar novos artigos', 'Artigos', 'Plus'),
    ('publicar_artigos', 'Publicar artigos', 'Tornar artigos visíveis publicamente', 'Artigos', 'Globe'),
    ('eliminar_artigos', 'Eliminar artigos', 'Remover artigos permanentemente', 'Artigos', 'Trash2'),
    ('rever_artigos', 'Rever artigos pendentes', 'Aprovar ou rejeitar submissões', 'Artigos', 'Check'),
    
    -- Multimédia
    ('upload_imagens', 'Upload de imagens', 'Enviar imagens para a biblioteca', 'Multimédia', 'Upload'),
    ('gerir_biblioteca', 'Gerir biblioteca', 'Organizar e eliminar ficheiros', 'Multimédia', 'Image'),
    ('usar_media', 'Usar multimédia', 'Inserir imagens em artigos', 'Multimédia', 'Image'),
    
    -- Páginas
    ('ler_paginas', 'Ler páginas', 'Visualizar páginas estáticas', 'Páginas', 'Layout'),
    ('editar_paginas', 'Editar páginas', 'Modificar conteúdo de páginas', 'Páginas', 'Edit3'),
    ('criar_paginas', 'Criar páginas', 'Adicionar novas páginas', 'Páginas', 'Plus'),
    ('eliminar_paginas', 'Eliminar páginas', 'Remover páginas permanentemente', 'Páginas', 'Trash2'),
    
    -- Utilizadores
    ('listar_utilizadores', 'Listar utilizadores', 'Ver todos os utilizadores', 'Utilizadores', 'Users'),
    ('criar_utilizadores', 'Criar utilizadores', 'Adicionar novos utilizadores', 'Utilizadores', 'Plus'),
    ('editar_utilizadores', 'Editar utilizadores', 'Modificar perfis e permissões', 'Utilizadores', 'Edit3'),
    ('eliminar_utilizadores', 'Eliminar utilizadores', 'Remover utilizadores do sistema', 'Utilizadores', 'Trash2'),
    ('gerir_permissoes', 'Gerir permissões', 'Configurar capacidades por papel', 'Utilizadores', 'Lock'),
    
    -- Configurações
    ('ver_definicoes', 'Ver definições', 'Aceder às configurações do site', 'Configurações', 'Settings'),
    ('editar_definicoes', 'Editar definições', 'Modificar configurações globais', 'Configurações', 'Edit3'),
    ('gerir_plugins', 'Gerir plugins', 'Instalar e configurar extensões', 'Configurações', 'Puzzle'),
    ('gerir_temas', 'Gerir temas', 'Alterar aparência do site', 'Configurações', 'Palette'),
    
    -- Estatísticas
    ('ver_estatisticas', 'Ver estatísticas', 'Aceder a relatórios de tráfego', 'Estatísticas', 'BarChart3'),
    ('ver_relatorios', 'Ver relatórios', 'Gerar e exportar relatórios', 'Estatísticas', 'FileText'),
    
    -- Sistema
    ('acesso_total', 'Acesso total', 'Permissão de super administrador', 'Sistema', 'Database'),
    ('modo_manutencao', 'Modo manutenção', 'Ativar/desativar modo manutenção', 'Sistema', 'AlertTriangle'),
    ('backup_restaurar', 'Backup e Restaurar', 'Criar e restaurar backups', 'Sistema', 'Archive')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter capacidades de um papel
CREATE OR REPLACE FUNCTION public.get_role_capabilities(p_role_name TEXT)
RETURNS TABLE (capability_name TEXT, granted BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT c.name::TEXT, COALESCE(rc.granted, false)
    FROM public.capabilities c
    LEFT JOIN public.roles r ON r.name = p_role_name
    LEFT JOIN public.role_capabilities rc ON rc.capability_id = c.id AND rc.role_id = r.id
    ORDER BY c.group_name, c.label;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se utilizador tem uma capacidade
CREATE OR REPLACE FUNCTION public.user_has_capability(p_user_id UUID, p_capability_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role_name TEXT;
    v_has_cap BOOLEAN;
BEGIN
    -- Obter o papel do utilizador (assumindo que está no user_metadata)
    SELECT (raw_user_meta_data->>'role')::TEXT 
    INTO v_role_name
    FROM auth.users 
    WHERE id = p_user_id;
    
    -- Verificar se o papel tem a capacidade
    SELECT EXISTS (
        SELECT 1 
        FROM public.role_capabilities rc
        JOIN public.roles r ON r.id = rc.role_id
        JOIN public.capabilities c ON c.id = rc.capability_id
        WHERE r.name = v_role_name 
        AND c.name = p_capability_name
        AND rc.granted = true
    ) INTO v_has_cap;
    
    -- Admin sempre tem todas as capacidades
    IF v_role_name = 'admin' THEN
        RETURN true;
    END IF;
    
    RETURN v_has_cap;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERMISSÕES RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_menu_visibility ENABLE ROW LEVEL SECURITY;

-- Políticas para capabilities (visível para todos autenticados)
CREATE POLICY "Capabilities viewable by authenticated users" 
    ON public.capabilities FOR SELECT 
    TO authenticated USING (true);

-- Políticas para roles (visível para todos)
CREATE POLICY "Roles viewable by all" 
    ON public.roles FOR SELECT 
    TO authenticated USING (true);

-- Políticas para role_capabilities (apenas admins podem modificar)
CREATE POLICY "Role capabilities manageable by admins" 
    ON public.role_capabilities FOR ALL 
    TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'role') = 'admin'
    ));

-- Políticas para role_redirects (apenas admins)
CREATE POLICY "Role redirects manageable by admins" 
    ON public.role_redirects FOR ALL 
    TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'role') = 'admin'
    ));

-- Políticas para role_menu_visibility (apenas admins)
CREATE POLICY "Role menu visibility manageable by admins" 
    ON public.role_menu_visibility FOR ALL 
    TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'role') = 'admin'
    ));

-- =====================================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_capabilities_updated_at 
    BEFORE UPDATE ON public.capabilities 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON public.roles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_capabilities_updated_at 
    BEFORE UPDATE ON public.role_capabilities 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.capabilities IS 'Lista de todas as capacidades/permisssões disponíveis no sistema';
COMMENT ON TABLE public.roles IS 'Papéis de utilizador (admin, editor, contribuidor, etc.)';
COMMENT ON TABLE public.role_capabilities IS 'Associação entre papéis e capacidades';
COMMENT ON TABLE public.role_redirects IS 'Configuração de redirecionamentos por papel após login/logout';
COMMENT ON TABLE public.role_menu_visibility IS 'Visibilidade de itens de menu por papel';
