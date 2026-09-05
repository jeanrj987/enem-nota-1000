-- Perfil obrigatório coletado no cadastro (nome, WhatsApp, cidade/estado,
-- data de nascimento, curso dos sonhos) — usado para contato/vendas via
-- WhatsApp e ofertas de outros produtos, não só para o produto atual.

create table if not exists public.perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text,
  whatsapp text,
  cidade_estado text,
  data_nascimento date,
  curso_dos_sonhos text,
  created_at timestamptz not null default now()
);

alter table public.perfis enable row level security;

create policy "usuario le seu perfil" on public.perfis
  for select to authenticated using (auth.uid() = user_id);
create policy "usuario grava seu perfil" on public.perfis
  for insert to authenticated with check (auth.uid() = user_id);
create policy "usuario atualiza seu perfil" on public.perfis
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cria automaticamente uma linha (parcial, se necessário) em public.perfis
-- sempre que um usuário se cadastra. Para cadastro por e-mail/senha, os
-- campos vêm de `options.data` do signUp (já presentes em raw_user_meta_data
-- no momento do insert). Para login com Google, só nome/e-mail vêm prontos
-- — os demais campos ficam nulos até o usuário completar o perfil em
-- /completar-perfil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfis (user_id, nome_completo, whatsapp, cidade_estado, data_nascimento, curso_dos_sonhos)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome_completo', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'whatsapp',
    new.raw_user_meta_data ->> 'cidade_estado',
    nullif(new.raw_user_meta_data ->> 'data_nascimento', '')::date,
    new.raw_user_meta_data ->> 'curso_dos_sonhos'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
