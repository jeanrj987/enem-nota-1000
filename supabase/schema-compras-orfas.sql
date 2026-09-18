-- Nota 1000 — compras órfãs (pagamento aprovado sem conta correspondente).
-- Rode no SQL Editor do Supabase, depois de supabase/schema-perfis-email.sql.
--
-- O PROBLEMA QUE ESTA TABELA RESOLVE
--
-- O checkout da Kiwify é um link fixo (src/lib/planos.ts) e o campo de
-- e-mail nele é editável. Quem cria conta com um e-mail e paga com outro —
-- o do cartão, o do pai/mãe, ou o mesmo com um erro de digitação — cai num
-- webhook que não encontra `user_id` nenhum. Até 18/09 esse caso só gerava
-- um `console.error` e um `200 OK` para a Kiwify: dinheiro cobrado, acesso
-- não liberado, e a única forma de descobrir era o aluno reclamar.
--
-- Cada linha aqui é uma pessoa que pagou e está sem acesso agora. É uma
-- fila de trabalho, não um log.
create table if not exists public.compras_orfas (
  id text primary key,                 -- order_id da Kiwify: a chave natural, e idempotente por reentrega
  email text not null,                 -- e-mail usado na COMPRA (não existe em `perfis`, é esse o ponto)
  plano_id text,                       -- null quando nem o plano deu para identificar: exige resgate manual
  status text not null default 'pendente',  -- 'pendente' | 'vinculada' | 'descartada'
  payload jsonb not null,              -- webhook cru, para reativar sem depender da Kiwify reenviar
  user_id uuid references auth.users (id) on delete set null,  -- preenchido na vinculação
  vinculada_em timestamptz,
  created_at timestamptz not null default now()
);

-- A consulta quente é "quais compras ainda estão pendentes, mais antigas
-- primeiro" — é a fila que alguém precisa olhar todo dia.
create index if not exists compras_orfas_pendentes_idx
  on public.compras_orfas (created_at desc)
  where status = 'pendente';

-- A vinculação busca por e-mail. `lower(email)` no índice porque a busca
-- normaliza a caixa antes de comparar (ver src/lib/compras-orfas.ts).
create index if not exists compras_orfas_email_idx on public.compras_orfas (lower(email));

alter table public.compras_orfas enable row level security;

-- NENHUMA policy, de propósito: nem `anon` nem `authenticated` leem ou
-- escrevem aqui. RLS sem policy nega tudo.
--
-- Não é excesso de zelo. A tabela contém o e-mail de compra de terceiros, e
-- uma policy de leitura para `authenticated` transformaria isso numa lista
-- de e-mails de quem comprou, consultável por qualquer conta criada de
-- graça. Todo acesso passa pela service role, em rota de servidor que exige
-- login e confere a posse do pedido (src/app/api/vincular-compra/route.ts).
