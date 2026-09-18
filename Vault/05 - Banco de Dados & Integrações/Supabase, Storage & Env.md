---
title: Supabase, Storage & Variáveis de Ambiente
tags:
  - supabase
  - postgresql
  - storage
  - env
  - seguranca
updated: 2026-09-18 (compras_orfas, atribuicao_anuncio e variáveis de medição)
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

## 🚨 Compras Órfãs (`supabase/schema-compras-orfas.sql`)

> [!warning] **Cada linha aqui é alguém que pagou e está sem acesso agora.** É uma fila de trabalho, não um log.

O checkout da Kiwify é um link fixo com **campo de e-mail editável** (ver ADR 028). Quem cria conta com um e-mail e paga com outro — o do cartão, o do pai ou da mãe, ou o mesmo com erro de digitação — cai num webhook que não encontra `user_id` nenhum. Até 18/09 esse caso só gerava um `console.error` e um `200 OK` para a Kiwify: dinheiro cobrado, acesso não liberado, nenhum alerta. Ver ADR 040.

```sql
create table public.compras_orfas (
  id text primary key,                 -- order_id da Kiwify: chave natural, idempotente por reentrega
  email text not null,                 -- e-mail usado na COMPRA (não existe em `perfis`, é esse o ponto)
  plano_id text,                       -- null quando nem o plano deu para identificar: exige resgate manual
  status text not null default 'pendente',  -- 'pendente' | 'vinculada' | 'descartada'
  payload jsonb not null,              -- webhook cru, para reativar sem depender da Kiwify reenviar
  user_id uuid references auth.users (id) on delete set null,
  vinculada_em timestamptz,
  created_at timestamptz not null default now()
);

alter table public.compras_orfas enable row level security;
-- NENHUMA policy, de propósito: RLS sem policy nega tudo.
```

> [!danger] **Por que nenhuma policy**
> A tabela contém o e-mail de compra de terceiros. Uma policy de leitura para `authenticated` a transformaria numa **lista de e-mails de quem comprou**, consultável por qualquer conta criada de graça. Todo acesso passa pela service role, em rota de servidor que exige login e confere a posse do pedido.

### Consulta da fila (uso diário)

```sql
-- Quem pagou e ainda não tem acesso, mais antigo primeiro
select id, email, plano_id, created_at
from public.compras_orfas
where status = 'pendente'
order by created_at;
```

### Resgate (`/vincular-compra` → `/api/vincular-compra`)

`vincularCompraOrfa` (`src/lib/compras-orfas.ts`) exige **`orderId` e `email` batendo na mesma linha**. O `orderId` é a prova de posse: chega no e-mail de confirmação da Kiwify e não é adivinhável. Sem essa exigência, bastaria uma conta grátis e um chute de e-mail para roubar acesso pago.

| Situação | Resultado | Resposta HTTP |
| :--- | :--- | :--- |
| Pedido + e-mail conferem, plano conhecido | `vinculada` (ativa a assinatura) | 200 |
| Pedido não existe **ou** e-mail não bate | `nao_encontrada` (resposta **idêntica** nos dois casos, para não confirmar quais pedidos existem) | 404 |
| Já resgatada | `ja_vinculada` | 409 |
| Plano não identificado no webhook | `exige_resgate_manual` (não chuta plano — prazo errado é reclamação justa) | 409 |

Rate limit de **5 tentativas por hora por usuário** (`src/app/api/vincular-compra/route.ts`): a rota libera acesso pago mediante acerto de um código, então força bruta precisa ser inviável.

> [!info] **Ordem das escritas importa**: a ativação vem **antes** de marcar a linha como `vinculada`. Se o update falhar, a pessoa já tem acesso e a compra continua na fila (alguém confere de novo). O inverso apagaria da fila uma compra que ficou sem acesso.

---

## 📊 Atribuição de Anúncio (`supabase/schema-atribuicao.sql`)

> [!warning] **Sem esta tabela, toda venda vinda de anúncio aparece como orgânica.**

O checkout da Kiwify roda em `pay.kiwify.com.br`. Quando o pagamento é aprovado, quem fica sabendo é o nosso webhook — e ele só recebe e-mail e id do pedido. Nada do navegador chega junto: nem o `_fbc` (que carrega o `fbclid`, ou seja, **qual clique de anúncio** trouxe aquela pessoa), nem o `_fbp`. Guardamos no último instante em que ainda existem: o clique no botão de assinar. Ver ADR 042.

```sql
create table public.atribuicao_anuncio (
  user_id uuid primary key references auth.users (id) on delete cascade,
  fbc text,            -- cookie _fbc: fb.1.<timestamp>.<fbclid>
  fbp text,            -- cookie _fbp: identificador do navegador
  user_agent text,     -- exigido pelo Meta para casar o evento de servidor
  atualizado_em timestamptz not null default now()
);

alter table public.atribuicao_anuncio enable row level security;
-- NENHUMA policy: só a service role lê e escreve.
```

Uma linha por usuário, sobrescrita a cada novo checkout: se a pessoa voltou por um anúncio novo e comprou, é o clique **novo** que deve levar o crédito.

### Fluxo completo da conversão

| Onde | O que acontece |
| :--- | :--- |
| Chegada com `?fbclid=` | `capturarAtribuicao()` grava o cookie `_fbc` por código nosso, sem depender do Pixel ter carregado a tempo |
| Clique em "Assinar" | `/api/atribuicao` grava `_fbc`/`_fbp`/`user_agent` nesta tabela, e só então o navegador sai para a Kiwify |
| Webhook de pagamento | `registrarCompraNoMeta` lê a linha e manda `Purchase` à Conversions API com a atribuição junto |

> [!danger] **Não ligar o pixel do Meta dentro do painel da Kiwify**
> Se a Kiwify disparar o próprio `Purchase`, ele virá sem o nosso `event_id` e o Meta não terá como deduplicar — a mesma venda conta duas vezes, e o custo por aquisição aparece pela metade do real. A compra deve ser reportada só pela nossa Conversions API.

> [!info] **Deduplicação**: o `event_id` é `compra_<order_id>`, derivado e não sorteado. Reentrega de webhook, reprocessamento ou uma compra destravada em `/vincular-compra` chegam com o mesmo id e contam uma conversão só.

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
| `SUPABASE_SERVICE_ROLE_KEY` | Configurada | Usada só pelo webhook da Kiwify (`src/lib/supabase-admin.ts`) para gravar assinaturas, ignorando RLS. |
| `KIWIFY_WEBHOOK_TOKEN` | Obrigatória | Assina o payload do webhook (HMAC-SHA1). É o token **gerado** pela Kiwify, visível em "Editar webhook" — não o valor de exemplo da tela de criação (ver ADR 028). |
| `NEXT_PUBLIC_SITE_URL` | Obrigatória em produção | Endereço canônico do site (`https://www.nota1000enem.digital`). Alimenta `metadataBase`, link canônico, `robots.txt`, `sitemap.xml` e a imagem de compartilhamento via `urlDoSite()` (`src/lib/site.ts`). Sem ela, cai em `VERCEL_PROJECT_PRODUCTION_URL` e o site se anuncia pelo endereço da Vercel. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Opcional (medição) | Pixel do Meta no navegador. Sem ela, `Medicao` não renderiza nada. |
| `META_CAPI_ACCESS_TOKEN` | Opcional (medição) | **Segredo.** Token da Conversions API — é o que permite reportar a COMPRA pelo servidor. Sem ela, nenhuma venda chega ao Meta, porque o checkout roda no domínio da Kiwify. Nunca prefixar com `NEXT_PUBLIC`. |
| `META_PIXEL_ID` | Opcional | Pixel usado pelo servidor. Se vazia, cai no `NEXT_PUBLIC_META_PIXEL_ID`. |
| `META_CAPI_TEST_EVENT_CODE` | Opcional | Código de "Testar eventos". Enquanto preenchida, os eventos **não contam como conversão real**. Esvaziar em produção. |
| `META_GRAPH_API_VERSION` | Opcional | Versão da Graph API (padrão `v23.0`). O Meta aposenta versões a cada ~2 anos e uma versão vencida faz a chamada falhar inteira. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Opcional (medição) | GA4, formato `G-XXXXXXXXXX`. |

---

## 🌐 Domínio e Endereços Públicos

| Endereço | Papel |
| :--- | :--- |
| `https://www.nota1000enem.digital` | **Domínio oficial.** Registrado na Hostinger, DNS apontando para a Vercel. É o endereço que vai em anúncio, bio e material de venda. |
| `https://nota1000enem.digital` | Redireciona 308 para o `www`. |
| `https://enem-nota-1000-six.vercel.app` | Endereço de deploy da Vercel. **Responde o mesmo conteúdo** — use só para depurar deploy, nunca para divulgar. |

> [!warning] **Trocar de domínio não é só DNS**
> Três lugares fora do repositório precisam conhecer o domínio, e o esquecimento de cada um falha em silêncio:
> 1. **Supabase → Authentication → URL Configuration**: *Site URL* = `https://www.nota1000enem.digital` e *Redirect URLs* incluindo `https://www.nota1000enem.digital/**`. O login com Google manda o Supabase devolver o usuário para `window.location.origin + /auth/callback`, e endereço fora da allowlist é trocado pelo *Site URL* — a pessoa entra e reaparece deslogada no domínio que estava usando. Os e-mails de confirmação e de recuperação de senha também usam o *Site URL*.
> 2. **Kiwify**: URL de retorno pós-compra apontando para `https://www.nota1000enem.digital/checkout/sucesso`. A liberação do acesso não depende disso (é o webhook que ativa), mas o comprador cai no endereço errado.
> 3. **Vercel → Domains**: marcar o domínio próprio como principal e redirecionar o `*.vercel.app` para ele, para não haver dois sites idênticos indexados.

> [!info] O Google Cloud **não** entra nessa lista: o *Authorized redirect URI* do OAuth aponta para `https://<ref>.supabase.co/auth/v1/callback`, que não muda com o domínio do site.

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
| `POST /api/vincular-compra` | 5 tentativas/usuário | 60 min | — |

As duas primeiras retornam `429` com header `Retry-After` quando o limite é excedido; `/api/corrigir` retorna `413` para texto acima do teto, `/api/upload` retorna `413` para arquivo acima do teto.

O limite de `/api/vincular-compra` é apertado por um motivo diferente dos outros dois: não é custo de processamento, é **força bruta**. A rota libera acesso pago a quem acertar um código de pedido — 5 tentativas por hora torna a busca cega inviável sem atrapalhar quem só está conferindo se digitou certo.

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem|Tipos TypeScript e Endpoints]]
- [[03 - Inteligência Artificial/Arquitetura de IA & Prompts|Uso das Chaves de IA no Backend]]
- [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting|Fluxo de Checkout na landing (`/`)]]
- [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog|ADR 008, 009, 010]]
- [[00 - Índice Principal|Retornar ao Índice Principal]]
