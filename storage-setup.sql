-- ============================================
-- CONFIGURAÇÃO DO STORAGE - news-images
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Criar o bucket news-images (se não existir)
-- Nota: buckets são criados na tabela storage.buckets
INSERT INTO storage.buckets (id, name, public)
SELECT 'news-images', 'news-images', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'news-images'
);

-- 2. Habilitar RLS no storage (já costuma estar por padrão)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas para evitar duplicados durante re-execução
DROP POLICY IF EXISTS "Acesso Público para Ver Imagens" ON storage.objects;
DROP POLICY IF EXISTS "Acesso Autenticado para Upload" ON storage.objects;
DROP POLICY IF EXISTS "Acesso Autenticado para Update" ON storage.objects;
DROP POLICY IF EXISTS "Acesso Autenticado para Delete" ON storage.objects;

-- 4. Criar Política de Visualização Pública (Qualquer pessoa pode ver as imagens)
CREATE POLICY "Acesso Público para Ver Imagens"
ON storage.objects FOR SELECT
USING ( bucket_id = 'news-images' );

-- 5. Criar Política de Inserção (Apenas utilizadores autenticados ou anon dependendo da config)
-- Se queres que QUALQUER UM possa carregar (para testes), muda para USING(true) e WITH CHECK(true)
CREATE POLICY "Acesso Autenticado para Upload"
ON storage.objects FOR INSERT
WITH CHECK ( 
    bucket_id = 'news-images' 
    -- AND auth.role() = 'authenticated' -- Descomente para restringir a utilizadores logados
);

-- 6. Criar Política de Update
CREATE POLICY "Acesso Autenticado para Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'news-images' );

-- 7. Criar Política de Delete
CREATE POLICY "Acesso Autenticado para Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'news-images' );
