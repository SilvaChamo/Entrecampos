-- Procura uma conta pelo e-mail sem ler a lista inteira de utilizadores (a base é partilhada por todos os sites de notícias).
-- Usada na entrada com Google e na recuperação de palavra-passe. Sem esta função o site continua a funcionar,
-- mas só encontra contas entre as primeiras 10 000. Idempotente. Correr como supabase_admin (SQL Editor do Studio).
create or replace function public.user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = auth, public
as $$
  select id from auth.users where email = lower(p_email) limit 1;
$$;

revoke all on function public.user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.user_id_by_email(text) to service_role;
