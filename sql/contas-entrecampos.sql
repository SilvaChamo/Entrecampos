-- Contas do EntreCAMPOS no Supabase Auth (partilhado com outros sites).
-- O acesso ao painel vive em app_metadata.entrecampos = { role, approved } (só o servidor escreve).
-- O registo é livre (com anti-spam no site); a conta só entra no painel depois de aceite pelo administrador.
-- Esta migração só activa a conta do dono. Idempotente. Correr como supabase_admin.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('entrecampos', jsonb_build_object('role', 'Administrador', 'approved', true))
WHERE lower(email) = 'silva.chamo@gmail.com'
  AND raw_app_meta_data->'entrecampos' IS NULL;
