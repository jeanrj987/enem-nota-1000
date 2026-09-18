---
title: Supabase, Storage & Variáveis de Ambiente
tags:
  - supabase
  - postgresql
  - storage
  - env
  - seguranca
updated: 2026-09-05 (perfil obrigatório no cadastro + correção gratuita com resultado borrado)
---

# 🗄️ Supabase, Storage & Variáveis de Ambiente

> [!tip] **Persistência real ativa (projeto `jzsudeviiosbhgkeljaf`)**
> `src/lib/storage.ts` usa Supabase quando `isSupabaseConfigured` é verdadeiro, com fallback/mirror em LocalStorage se a chamada remota falhar ou não houver credenciais.

> [!tip] **Autenticação real via Supabase Auth**
> Login/cadastro deixou de ser simulado. `src/lib/auth.ts` + `src/contexts/AuthContext.tsx` usam `supabase.auth` (e-mail/senha e Google OAuth). Toda a identidade do usuário — histórico de redações, assinatura ativa — passou a girar em torno do `user_id` (`auth.users.id`), substituindo o antigo `device_id` anônimo de navegador. Ver ADR 011.

---

## 🗃️ Schema Real (`supabase/schema-auth-migration.sql`)

Substitui os schemas anteriores baseados em `device_id` (que dropavam e recriavam as tabelas). Este script novamente dropa `redacoes`/`assinaturas` para reancorar em `auth.users` — só faz sentido rodar por não haver dados de produção reais ainda (só uma assinatura de teste).

```sql
create table public.redacoes (
  id text primary key, -- não é uuid! IDs do app são "red_<uuid>" (src/lib/ids.ts)
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
```

> [!bug] **Armadilha real encontrada (histórico)**: a primeira versão do schema usava `id uuid`. Os IDs gerados pelo app (`gerarId('red')` → `red_${crypto.randomUUID()}`) são strings prefixadas, não UUIDs puros — todo insert falhava com `invalid input syntax for type uuid`. Corrigido para `id text` (mantido nesta versão).

---

## 💳 Schema de Assinaturas (`supabase/schema-auth-migration.sql`)

Ao contrário de `redacoes` (RLS de leitura/escrita para o próprio dono), aqui o usuário autenticado só pode **ler**. Toda escrita vem do webhook do Stripe ou da rota de verificação síncrona, ambas usando a **service role key** (`src/lib/supabase-admin.ts`, `supabaseAdmin` — ignora RLS, uso exclusivo em código de servidor, nunca importar em componente client-side). Isso impede que qualquer um forje uma assinatura paga inserindo uma linha direto com a chave anon/sessão do usuário.

```sql
create table public.assinaturas (
  id text primary key, -- id da Checkout Session do Stripe
  user_id uuid not null references auth.users (id) on delete cascade,
  plano_id text not null,
  status text not null default 'pendente', -- 'pendente' | 'ativa'
  expira_em timestamptz,
  created_at timestamptz not null default now()
);

alter table public.assinaturas enable row level security;

create policy "usuario le suas assinaturas" on public.assinaturas
  for select to authenticated using (auth.uid() = user_id);
-- nenhuma policy de insert/update/delete para authenticated
```

`src/lib/assinatura.ts` (`temAcessoAtivo`) resolve o usuário via `supabase.auth.getUser()` e consulta essa tabela filtrando por `user_id` + `status = 'ativa'` + `expira_em` no futuro. **Sem Supabase configurado ou sem usuário logado, nega acesso por padrão** — nunca libera "no escuro".

---

## 🧾 Perfil Obrigatório no Cadastro (`supabase/schema-perfis.sql`)

> [!tip] **Coleta obrigatória para contato/vendas (WhatsApp, X1, outros produtos)**
> Todo cadastro por e-mail/senha exige nome completo, WhatsApp, cidade e estado, data de nascimento e curso dos sonhos — pedido explícito do usuário para poder usar esses dados em vendas via WhatsApp e ofertas de outros produtos, não só para o corretor.

```sql
create table public.perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text,
  whatsapp text,
  cidade_estado text,
  data_nascimento date,
  curso_dos_sonhos text,
  created_at timestamptz not null default now()
);

alter table public.perfis enable row level security;
create policy "usuario le seu perfil" on public.perfis for select to authenticated using (auth.uid() = user_id);
create policy "usuario grava seu perfil" on public.perfis for insert to authenticated with check (auth.uid() = user_id);
create policy "usuario atualiza seu perfil" on public.perfis for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Um trigger (`handle_new_user`, `security definer`) em `auth.users` cria a linha em `perfis` automaticamente a cada cadastro, lendo de `raw_user_meta_data`:
- **E-mail/senha**: `cadastrarComEmail` (`src/lib/auth.ts`) passa os 5 campos via `signUp({options:{data:{...}}})` — o trigger encontra tudo pronto, perfil já nasce completo.
- **Google OAuth**: só nome/e-mail vêm do Google — `whatsapp`, `cidade_estado`, `data_nascimento` e `curso_dos_sonhos` nascem `null`. `perfilCompleto()` (`src/lib/perfil.ts`) detecta isso e os gates (`RequerLogin`, `RequerAssinatura`) redirecionam para `/completar-perfil` até o usuário preencher o resto.

Essas informações ficam disponíveis para consulta/exportação manual direto no Supabase (tabela `perfis`) para uso em campanhas de WhatsApp e cross-sell — não há painel de exportação no app, é consulta direta ao banco.

---

## 🔑 Login com Google (Supabase Auth)

O provider Google precisa ser habilitado manualmente (não é código, é configuração de infraestrutura):
1. Criar um **OAuth Client ID** em [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials), tipo "Web application".
2. Authorized redirect URI: `https://<ref-do-projeto>.supabase.co/auth/v1/callback`.
3. Colar Client ID + Client Secret em **Supabase Dashboard → Authentication → Providers → Google**.
4. No app, `entrarComGoogle()` (`src/lib/auth.ts`) chama `supabase.auth.signInWithOAuth({provider:'google', options:{redirectTo: origin + '/auth/callback'}})`. O SDK (`detectSessionInUrl`, padrão) troca o código pela sessão sozinho ao voltar em `/auth/callback` (`src/app/auth/callback/page.tsx`) — não há troca manual no servidor.

---

## 🔐 Variáveis de Ambiente (`.env.local`)

| Variável | Obrigatória? | Descrição |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Recomendada | Chave da API do Google Gemini (`gemini-3.6-flash`), provedor principal de correção. Não é mais usada em `/api/upload` — o OCR de PDF sem texto selecionável foi removido (ADR 025). |
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
1. Se Supabase configurado e há usuário logado (`supabase.auth.getUser()`): lê/escreve na tabela `redacoes` filtrando por `user_id`.
2. `salvarRedacao` sempre grava em LocalStorage também (cache/fallback imediato), e tenta Supabase sem bloquear nem falhar a operação principal se a escrita remota der erro.
3. Sem credenciais Supabase, sem usuário logado ou com falha de rede: cai para LocalStorage puro (comportamento anterior).

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
- [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting|Fluxo de Checkout na landing (`/`)]]
- [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog|ADR 008, 009, 010]]
- [[00 - Índice Principal|Retornar ao Índice Principal]]
