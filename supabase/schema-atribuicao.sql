-- Nota 1000 — atribuição de anúncio (Meta).
-- Rode no SQL Editor do Supabase, depois de supabase/schema-perfis-email.sql.
--
-- POR QUE ESTA TABELA EXISTE
--
-- O checkout da Kiwify roda em outro domínio. Quando o pagamento é aprovado,
-- quem fica sabendo é o nosso webhook — e ele só recebe e-mail e id do
-- pedido. Nada do navegador da pessoa chega junto: nem o cookie `_fbc` (que
-- carrega o `fbclid`, ou seja, QUAL clique de anúncio trouxe aquela pessoa),
-- nem o `_fbp`.
--
-- Sem esses dois, o evento de compra enviado à Conversions API do Meta é
-- aceito mas não consegue ser ligado a nenhuma campanha: a venda aparece
-- como orgânica e o custo por aquisição do anúncio fica errado para mais.
--
-- Então guardamos a atribuição no último instante em que ela ainda existe:
-- o clique no botão de assinar, antes do redirecionamento para a Kiwify.
create table if not exists public.atribuicao_anuncio (
  user_id uuid primary key references auth.users (id) on delete cascade,
  fbc text,            -- cookie _fbc: fb.1.<timestamp>.<fbclid>
  fbp text,            -- cookie _fbp: identificador do navegador
  user_agent text,     -- exigido pelo Meta para casar o evento de servidor
  atualizado_em timestamptz not null default now()
);

alter table public.atribuicao_anuncio enable row level security;

-- NENHUMA policy, como em compras_orfas: só a service role lê e escreve.
-- Estes identificadores permitem ligar uma pessoa ao seu perfil de anúncio,
-- então não têm por que ficar legíveis para qualquer sessão autenticada.

-- Uma linha por usuário, sobrescrita a cada novo checkout: se a pessoa voltou
-- por um anúncio novo e comprou, é o clique NOVO que deve levar o crédito.
