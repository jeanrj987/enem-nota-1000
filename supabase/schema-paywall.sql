-- Paywall de verdade: a correção sai de dentro de `redacoes` e passa a viver
-- em `correcoes`, com política própria de RLS que só devolve a linha se o
-- usuário tiver assinatura ativa. Antes disso, a correção inteira era
-- entregue ao navegador e apenas borrada com CSS — bastava abrir o inspetor
-- para ter o produto pago de graça.

-- 1. Campos de "chamariz" continuam em redacoes: são legíveis pelo dono
--    mesmo sem assinatura, porque não entregam o diagnóstico em si.
alter table public.redacoes add column if not exists total_erros integer;
alter table public.redacoes add column if not exists anulada boolean;

-- 2. A correção em tabela separada — é o que permite ter política distinta.
create table if not exists public.correcoes (
  redacao_id text primary key references public.redacoes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  dados jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists correcoes_user_id_idx on public.correcoes (user_id);

-- 3. Migra o que já existia, para nenhuma correção antiga se perder.
insert into public.correcoes (redacao_id, user_id, dados)
select r.id, r.user_id, r.correcao
from public.redacoes r
where r.correcao is not null
on conflict (redacao_id) do nothing;

update public.redacoes r
set
  total_erros = coalesce(jsonb_array_length(r.correcao -> 'erros'), 0),
  anulada = coalesce((r.correcao ->> 'anulada')::boolean, false)
where r.correcao is not null;

alter table public.redacoes drop column if exists correcao;

-- 4. A trava. Ler a correção exige ser o dono E ter assinatura ativa.
alter table public.correcoes enable row level security;

drop policy if exists "correcao apenas para assinante ativo" on public.correcoes;
create policy "correcao apenas para assinante ativo" on public.correcoes
  for select to authenticated using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.assinaturas a
      where a.user_id = auth.uid()
        and a.status = 'ativa'
        and a.expira_em > now()
    )
  );

-- Nenhuma policy de insert/update/delete: só o service role grava correção,
-- pela rota /api/corrigir. O cliente nunca escreve aqui.
