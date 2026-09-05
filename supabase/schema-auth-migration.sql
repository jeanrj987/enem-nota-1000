-- Migração para autenticação real (Supabase Auth) substituindo o device_id
-- anônimo. ATENÇÃO: este script apaga as tabelas redacoes e assinaturas
-- (incluindo dados de teste já gravados, como a assinatura de teste criada
-- ao validar o checkout do Stripe). Rode só depois de confirmar que não há
-- dado real que precise ser preservado.

drop table if exists public.assinaturas cascade;
drop table if exists public.redacoes cascade;

create table public.redacoes (
  id text primary key, -- IDs no formato "red_<uuid>" gerados pelo app, não uuid puro
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  tema text not null,
  texto text not null,
  palavras_count integer not null default 0,
  linhas_count integer not null default 0,
  status text not null default 'pendente',
  correcao jsonb,
  created_at timestamptz not null default now()
);
create index redacoes_user_id_idx on public.redacoes (user_id, created_at desc);
alter table public.redacoes enable row level security;

create policy "usuario le suas redacoes" on public.redacoes
  for select to authenticated using (auth.uid() = user_id);
create policy "usuario grava suas redacoes" on public.redacoes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "usuario atualiza suas redacoes" on public.redacoes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.assinaturas (
  id text primary key, -- Stripe Checkout Session id
  user_id uuid not null references auth.users (id) on delete cascade,
  plano_id text not null,
  status text not null default 'pendente',
  expira_em timestamptz,
  created_at timestamptz not null default now()
);
create index assinaturas_user_id_idx on public.assinaturas (user_id, expira_em desc);
alter table public.assinaturas enable row level security;

create policy "usuario le suas assinaturas" on public.assinaturas
  for select to authenticated using (auth.uid() = user_id);
-- nenhuma policy de insert/update/delete para authenticated: só o service
-- role (webhook do Stripe / rota de verificação) pode gravar assinaturas,
-- assim ninguém consegue forjar acesso pago direto pela chave anon.
