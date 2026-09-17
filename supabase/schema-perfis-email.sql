-- Adiciona e-mail a public.perfis: necessário para casar uma compra na
-- Kiwify (que só nos dá o e-mail do comprador, não o user_id) com a conta
-- correta no nosso sistema. Ver ADR de integração com a Kiwify.
--
-- Idempotente: pode ser rodado de novo sem erro.

alter table public.perfis add column if not exists email text;

-- Backfill dos perfis já existentes, a partir de auth.users.
update public.perfis p
set email = u.email
from auth.users u
where p.user_id = u.id and p.email is null;

-- Índice único: garante busca rápida por e-mail e barra duas contas com o
-- mesmo e-mail (o Supabase Auth já impede isso a nível de auth.users, mas o
-- índice deixa explícito também aqui).
create unique index if not exists perfis_email_idx on public.perfis (email);

-- Atualiza o trigger de criação de perfil para gravar o e-mail junto.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfis (user_id, nome_completo, whatsapp, cidade_estado, data_nascimento, curso_dos_sonhos, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome_completo', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'whatsapp',
    new.raw_user_meta_data ->> 'cidade_estado',
    nullif(new.raw_user_meta_data ->> 'data_nascimento', '')::date,
    new.raw_user_meta_data ->> 'curso_dos_sonhos',
    new.email
  )
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;
