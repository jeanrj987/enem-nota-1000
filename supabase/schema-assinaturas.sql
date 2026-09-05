-- Nota 1000 AI — schema de assinaturas (gate de acesso pago via Stripe).
-- Rode no SQL Editor do Supabase, depois de supabase/schema.sql.
--
-- Sem autenticação real ainda, a assinatura é ancorada no mesmo device_id
-- anônimo usado para as redações (src/lib/device-id.ts). Diferente da
-- tabela 'redacoes' (RLS permissiva para o anon), aqui SÓ o servidor grava:
-- o cliente (anon key) pode apenas LER se tem acesso ativo para o seu
-- device_id — toda escrita vem do webhook do Stripe (service role key,
-- que ignora RLS). Isso evita que qualquer um forje uma assinatura paga
-- inserindo uma linha direto pela anon key.
create table if not exists public.assinaturas (
  id text primary key, -- id da Checkout Session do Stripe
  device_id text not null,
  plano_id text not null,
  status text not null default 'pendente', -- 'pendente' | 'ativa'
  expira_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists assinaturas_device_id_idx on public.assinaturas (device_id, expira_em desc);

alter table public.assinaturas enable row level security;

drop policy if exists "anon pode ler assinaturas" on public.assinaturas;
create policy "anon pode ler assinaturas"
  on public.assinaturas
  for select
  to anon
  using (true);

-- Nenhuma policy de insert/update/delete para "anon": só o service role
-- (usado exclusivamente pelo webhook do servidor) pode escrever aqui.
