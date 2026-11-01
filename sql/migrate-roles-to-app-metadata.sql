-- O papel e a aceitação passaram a ser lidos de app_metadata (só o servidor/painel escreve),
-- porque user_metadata pode ser editado pelo próprio utilizador.
-- Corra uma vez no Supabase (SQL Editor) e REVEJA o resultado antes: contas que tenham
-- escrito o próprio "role" em user_metadata também seriam copiadas.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', raw_user_meta_data->>'role', 'approved', true)
where raw_user_meta_data->>'app' = 'entrecampos'
  and raw_user_meta_data->>'role' in ('Administrador', 'Editor', 'Contribuidor')
  and coalesce(raw_app_meta_data->>'role', '') = '';

-- Ver o resultado:
-- select email, raw_app_meta_data->>'role' as papel, raw_app_meta_data->>'approved' as aceite from auth.users order by email;
