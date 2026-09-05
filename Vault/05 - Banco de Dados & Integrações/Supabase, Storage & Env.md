---
title: Supabase, Storage & Variáveis de Ambiente
tags:
  - supabase
  - postgresql
  - storage
  - env
  - seguranca
updated: 2026-09-05 (checkout Stripe + gate de acesso)
---

# 🗄️ Supabase, Storage & Variáveis de Ambiente

> [!tip] **Persistência real ativa (projeto `jzsudeviiosbhgkeljaf`)**
> `src/lib/storage.ts` usa Supabase quando `isSupabaseConfigured` é verdadeiro, com fallback/mirror em LocalStorage se a chamada remota falhar ou não houver credenciais. Testado de ponta a ponta (insert/select/delete) em 2026-09-05.

> [!warning] **Sem autenticação real — RLS permissiva por device_id**
> Não existe `auth.users` em uso ainda (login continua simulado). A tabela usa um `device_id` anônimo gerado no navegador (`src/lib/device-id.ts`, `crypto.randomUUID()` em localStorage) só para organizar o histórico — **não é uma fronteira de segurança**. A policy de RLS libera tudo para o role `anon`. Migrar para policies por `auth.uid()` quando a autenticação real for implementada.

---

## 🗃️ Schema Real (`supabase/schema.sql`)

Substituiu o schema anterior de 2 tabelas (`redacoes` + `correcoes` com FK) por uma única tabela com a correção embutida em JSONB — mais simples e reflete que `Correcao` já é sempre 1:1 com `Redacao` no código (`src/types/index.ts`).

```sql
create table public.redacoes (
  id text primary key, -- não é uuid! IDs do app são "red_<uuid>" (src/lib/ids.ts)
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

create index redacoes_device_id_idx on public.redacoes (device_id, created_at desc);

alter table public.redacoes enable row level security;

create policy "anon pode tudo (sem auth real ainda)"
  on public.redacoes for all to anon using (true) with check (true);
```

> [!bug] **Armadilha real encontrada**: a primeira versão do schema usava `id uuid`. Os IDs gerados pelo app (`gerarId('red')` → `red_${crypto.randomUUID()}`) são strings prefixadas, não UUIDs puros — todo insert falhava com `invalid input syntax for type uuid`. Corrigido para `id text`.

---

## 💳 Schema de Assinaturas (`supabase/schema-assinaturas.sql`)

Ao contrário de `redacoes` (RLS permissiva para `anon`), aqui o cliente só pode **ler**. Toda escrita vem do webhook do Stripe usando a **service role key** (`src/lib/supabase-admin.ts`, `supabaseAdmin` — ignora RLS, uso exclusivo em código de servidor, nunca importar em componente client-side). Isso impede que qualquer um forje uma assinatura paga inserindo uma linha direto com a anon key.

```sql
create table public.assinaturas (
  id text primary key, -- id da Checkout Session do Stripe
  device_id text not null,
  plano_id text not null,
  status text not null default 'pendente', -- 'pendente' | 'ativa'
  expira_em timestamptz,
  created_at timestamptz not null default now()
);

alter table public.assinaturas enable row level security;

create policy "anon pode ler assinaturas"
  on public.assinaturas for select to anon using (true);
-- nenhuma policy de insert/update/delete para anon
```

`src/lib/assinatura.ts` (`temAcessoAtivo`) consulta essa tabela filtrando por `device_id` + `status = 'ativa'` + `expira_em` no futuro. **Sem Supabase configurado, nega acesso por padrão** — nunca libera "no escuro".

---

## 🔐 Variáveis de Ambiente (`.env.local`)

| Variável | Obrigatória? | Descrição |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Recomendada | Chave da API do Google Gemini (`gemini-3.6-flash`), também usada no OCR de PDF sem texto selecionável. |
| `OPENAI_API_KEY` | Opcional (Fallback) | Chave da OpenAI para o modelo `gpt-4o-mini`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Configurada | `https://jzsudeviiosbhgkeljaf.supabase.co` — pode ser derivada do claim `ref` do JWT da anon key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Configurada | Chave anônima pública do Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Configurada | Usada só pelo webhook do Stripe (`src/lib/supabase-admin.ts`) para gravar assinaturas, ignorando RLS. |
| `STRIPE_SECRET_KEY` | Configurada (modo teste) | Cria sessões de checkout e produtos/preços (`npm run stripe:setup`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Configurada (modo teste) | Chave pública do Stripe (não usada diretamente ainda — Checkout hospedado dispensa Stripe.js no cliente). |
| `STRIPE_WEBHOOK_SECRET` | Configurada (endpoint de teste local) | Verifica a assinatura HMAC dos eventos do Stripe em `/api/stripe/webhook`. **Ao publicar em produção, criar um endpoint novo no dashboard do Stripe apontando para a URL real e usar o secret dele** — o valor atual foi gerado para um endpoint de teste (`https://example.com/...`) usado só para assinar payloads localmente, nunca recebe eventos reais. |

---

## 💾 Camada de Storage (`src/lib/storage.ts`)

`getRedacoesSalvas`, `salvarRedacao` e `buscarRedacaoPorId` agora são `async`:
1. Se Supabase configurado: lê/escreve na tabela `redacoes`, filtrando por `device_id` (não por usuário — ainda não existe usuário real).
2. `salvarRedacao` sempre grava em LocalStorage também (cache/fallback imediato), e tenta Supabase sem bloquear nem falhar a operação principal se a escrita remota der erro.
3. Sem credenciais Supabase ou com falha de rede: cai para LocalStorage puro (comportamento anterior).

`calcularEstatisticas` e `gerarHistoricoGraficos` continuam síncronas — operam sobre o array já carregado, sem I/O.

Chamadores (`Editor.tsx`, `dashboard/page.tsx`, `historico/page.tsx`, `correcao/[id]/page.tsx`) foram atualizados para `await`/`.then()` essas chamadas.

---

## 🚦 Rate Limiting & Teto de Tamanho (`src/lib/rate-limit.ts`)

> [!warning] **Limitação conhecida**: contador em memória, por processo — não é compartilhado entre instâncias serverless frias. Suficiente para MVP/instância única; para limitar de forma consistente em produção com múltiplas instâncias, trocar por um store compartilhado (ex: Upstash Redis).

| Rota | Limite | Janela | Teto de tamanho |
| :--- | :--- | :--- | :--- |
| `POST /api/corrigir` | 5 requisições/IP | 10 min | 8000 caracteres de texto |
| `POST /api/upload` | 15 requisições/IP | 10 min | 10MB por arquivo |

Ambas retornam `429` com header `Retry-After` quando o limite é excedido; `/api/corrigir` retorna `413` para texto acima do teto, `/api/upload` retorna `413` para arquivo acima do teto.

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem|Tipos TypeScript e Endpoints]]
- [[03 - Inteligência Artificial/Arquitetura de IA & Prompts|Uso das Chaves de IA no Backend]]
- [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting|Fluxo de Checkout em /vendas]]
- [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog|ADR 008, 009, 010]]
- [[00 - Índice Principal|Retornar ao Índice Principal]]
