-- Nota 1000 AI — schema de persistência de redações.
-- Rode este script no SQL Editor do Supabase (painel do projeto > SQL Editor > New query).
--
-- Sem autenticação real implementada ainda, a persistência é ancorada em um
-- device_id anônimo gerado no navegador (src/lib/device-id.ts), não em
-- auth.users. Por isso as policies de RLS abaixo são permissivas (qualquer
-- cliente com a anon key pode ler/escrever) — o device_id não é uma fronteira
-- de segurança real, só de organização de dados. Quando a autenticação real
-- for implementada (ver Vault/06 - Registro de Decisões), migrar para
-- policies que restringem por auth.uid().

-- Schema antigo (planejado em Vault/05, nunca usado em código): tabela
-- 'correcoes' separada, com FK para 'redacoes'. Consolidado abaixo em uma
-- coluna jsonb única (correcao) na própria tabela redacoes.
drop table if exists public.correcoes cascade;
drop table if exists public.redacoes cascade;

-- id é text, não uuid: o app gera IDs como "red_<uuid>" (src/lib/ids.ts),
-- prefixados por tipo de entidade, não um uuid puro.
create table public.redacoes (
  id text primary key,
  device_id text not null,
  titulo text not null,
  tema text not null,
  texto text not null,
  palavras_count integer not null default 0,
  linhas_count integer not null default 0,
  status text not null default 'pendente',
  correcao jsonb,
  created_at timestamptz not null default now()
);

create index if not exists redacoes_device_id_idx on public.redacoes (device_id, created_at desc);

alter table public.redacoes enable row level security;

drop policy if exists "anon pode tudo (sem auth real ainda)" on public.redacoes;
create policy "anon pode tudo (sem auth real ainda)"
  on public.redacoes
  for all
  to anon
  using (true)
  with check (true);
