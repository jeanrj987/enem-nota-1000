---
title: Decisões de Arquitetura (ADRs) & Changelog
tags:
  - changelog
  - adr
  - decisoes
  - historico
updated: 2026-09-05 (correção gratuita com resultado borrado + cadastro obrigatório)
---

# 🏛️ Decisões de Arquitetura (ADRs) & Changelog

> [!info] **Histórico Evolutivo do Projeto**
> Registro cronológico de todas as decisões arquiteturais tomadas e das principais funcionalidades desenvolvidas no projeto.

---

## 📜 Registros de Decisão de Arquitetura (ADRs)

### ADR 001: Fallback Híbrido de Inteligência Artificial
- **Status**: ⚠️ Superado parcialmente pelo ADR 005 (heurística offline removida)
- **Contexto**: A indisponibilidade momentânea ou limite de quota de uma única LLM causaria interrupção na correção do aluno.
- **Decisão original**: Gemini 3.6 Flash (3 retries, backoff exponencial) $\rightarrow$ OpenAI gpt-4o-mini $\rightarrow$ Motor Heurístico Offline.
- **Impacto**: Disponibilidade de 100%, mas ao custo de notas fabricadas quando ambos os provedores falhavam — corrigido pelo ADR 005.

### ADR 002: Parsing de PDF e DOCX em Runtime Serverless
- **Status**: ⚠️ Superado pelo ADR 007 (parser de PDF substituído)
- **Contexto**: Bibliotecas nativas de C++ para extração de PDF frequentemente quebram em ambientes serverless da Vercel.
- **Decisão original**: `mammoth` para `.docx` e parser de streams de texto (regex sobre blocos `BT...ET`) para `.pdf`, frágil e sem suporte real a layouts complexos.

### ADR 003: Criação de Página de Vendas Separada com Foco na Dor e Urgência
- **Status**: Aprovado e Implementado
- **Contexto**: O produto precisava de uma via de conversão direta com apelo psicológico forte para vestibulandos que sofrem com o tempo curto até o ENEM e com a lentidão dos cursinhos tradicionais.
- **Decisão**: Criação da rota `/vendas` contendo 12 blocos de persuasão, termômetro interativo de risco, cronômetro regressivo em tempo real, bônus de lançamento e barra flutuante `SalesStickyBar`.

### ADR 004: Centralização da Memória do Projeto no Obsidian (`Vault/`)
- **Status**: Aprovado e Implementado
- **Contexto**: Necessidade de manter toda a documentação, padrões e conhecimento do projeto centralizados para fácil consulta humana e por agentes de IA.
- **Decisão**: Toda nova funcionalidade, alteração e regra deve ser refletida nas notas do diretório `Vault/` com sintaxe Obsidian.

### ADR 005: Nunca Fabricar um Resultado de Correção
- **Status**: Aprovado e Implementado (substitui parte do ADR 001)
- **Contexto**: O motor heurístico offline gerava uma nota "plausível" quando Gemini e OpenAI falhavam — o aluno recebia uma avaliação que não veio de nenhum modelo real, sem saber disso.
- **Decisão**: Removido o fallback heurístico de produção. Se ambos os provedores falham, `corrigirRedacaoComIA` lança erro explícito, propagado como falha visível ao aluno. A função heurística (`gerarCorrecaoMock`) continua existindo só como fixture de teste offline — nunca é chamada pelo caminho de produção.
- **Impacto**: Disponibilidade deixa de ser 100%, mas toda nota exibida é garantidamente de um modelo real.

### ADR 006: Dupla Correção com Reconciliação (protocolo INEP)
- **Status**: Aprovado e Implementado
- **Contexto**: Medição real mostrou variação de até 120 pontos na mesma redação entre duas execuções do mesmo modelo — não-determinismo do LLM, não bug de código.
- **Decisão**: `corrigirRedacaoComDuplaCorrecao` dispara 2 correções independentes em paralelo. Divergência ≤100 pontos → reconcilia por média. >100 → aciona 3ª correção de arbitragem e reconcilia o par mais próximo — mesmo protocolo de dois corretores + árbitro do ENEM real.
- **Impacto**: Custo/latência 2-3x maior por correção; consistência de nota significativamente maior. Ver [[03 - Inteligência Artificial/Arquitetura de IA & Prompts]].

### ADR 007: Extração de PDF via `pdf-parse` + Upgrade de Node
- **Status**: Aprovado e Implementado
- **Contexto**: O parser regex caseiro (ADR 002) não lidava com PDFs de layout real, gerando texto corrompido.
- **Decisão**: Adotado `pdf-parse` (embrulha `pdfjs-dist`), que exige Node ≥20.16/22.3 — o projeto rodava em Node 20.14.0. Runtime atualizado para Node 22.22.3 (`.nvmrc`) e `next.config.ts` recebeu `serverExternalPackages: ["pdf-parse"]` para o worker do pdfjs resolver fora do bundle do Turbopack.
- **Atualização**: OCR de PDF sem texto selecionável (foto/scan) foi implementado em seguida via visão do Gemini (`extrairTextoViaOCR` em `src/app/api/upload/route.ts`) — deixou de ser "fora de escopo".

### ADR 008: Persistência Real via Supabase com Identidade Anônima por Dispositivo
- **Status**: ⚠️ Superado pelo ADR 011 (device_id substituído por user_id de autenticação real)
- **Contexto**: Todo o histórico de redações vivia só em LocalStorage — sem sincronização entre dispositivos e com risco de perda ao limpar o navegador. Autenticação real ainda não existe (login segue simulado).
- **Decisão**: Ativado projeto Supabase real (`jzsudeviiosbhgkeljaf`). Uma única tabela `redacoes` (schema simplificado, correção embutida em JSONB) substitui o antigo par `redacoes`+`correcoes`. Sem `auth.users`, o histórico é agrupado por um `device_id` anônimo (`crypto.randomUUID()` em localStorage) — RLS habilitada mas permissiva para o role `anon`, já que `device_id` não é uma fronteira de segurança real. `src/lib/storage.ts` tornou-se assíncrono: tenta Supabase primeiro, sempre grava em LocalStorage como fallback/cache, nunca bloqueia nem falha a UI por causa de uma escrita remota que deu erro.
- **Armadilha corrigida em produção**: a coluna `id` foi inicialmente criada como `uuid`, mas os IDs do app são strings prefixadas (`red_<uuid>`, via `src/lib/ids.ts`) — todo insert falhava com `invalid input syntax for type uuid`. Corrigido para `id text`.
- **Impacto**: Histórico agora sobrevive à limpeza do navegador e sincroniza entre abas/sessões do mesmo device_id. Migração para segurança real por usuário fica pendente da implementação de autenticação (ver Crítico no checklist).

### ADR 009: Rate Limiting em Memória + Teto de Tamanho de Texto/Arquivo
- **Status**: Aprovado e Implementado
- **Contexto**: `/api/corrigir` e `/api/upload` eram públicas, sem limite de uso nem teto de tamanho — cada correção dispara 2-3 chamadas de LLM (dupla correção) e cada upload de PDF sem texto pode disparar OCR via Gemini, ambos com custo real por chamada.
- **Decisão**: `src/lib/rate-limit.ts` implementa um limitador em memória, por IP, janela fixa (sem dependência externa). `/api/corrigir`: 5 requisições/10min, texto máx. 8000 caracteres. `/api/upload`: 15 requisições/10min, arquivo máx. 10MB. Ambas retornam `429`/`413` com mensagem clara.
- **Limitação conhecida**: o contador é por processo — não é compartilhado entre instâncias serverless frias (cada cold start zera a janela). Suficiente para MVP; produção com múltiplas instâncias concorrentes precisa de um store compartilhado (Upstash Redis é o candidato natural, já que evita adicionar infra própria).

### ADR 010: Checkout Real via Stripe + Gate de Acesso
- **Status**: Aprovado e Implementado (modo de teste do Stripe); identidade migrada de `device_id` para `user_id` pelo ADR 011
- **Contexto**: `/vendas` era uma landing page decorativa — os 3 botões de plano levavam direto para `/nova-redacao` sem nenhuma verificação de pagamento, então qualquer um usava o corretor de graça. O usuário pediu explicitamente que o acesso ao produto ficasse condicionado à compra.
- **Decisão**: `npm run stripe:setup` cria os 3 produtos/preços via API do Stripe (Mensal R$29,90, Anual R$147,00, Semestral R$89,00 — **pagamento único**, não assinatura recorrente do Stripe: cada plano concede acesso por um número fixo de dias, 30/365/180, controlado por `expira_em` no Supabase). `/api/checkout` cria uma Stripe Checkout Session com `client_reference_id` = device_id. A ativação da assinatura (`ativarAssinatura`, `src/lib/ativar-assinatura.ts`) acontece por dois caminhos independentes e idempotentes: (1) `/api/stripe/webhook`, que verifica a assinatura HMAC do evento `checkout.session.completed` — fonte de verdade assíncrona em produção; (2) `/api/checkout/verificar`, chamado pela própria página `/checkout/sucesso` no redirect, que consulta a Checkout Session direto na API do Stripe pelo `session_id` e ativa se `payment_status === 'paid'` — necessário porque o Stripe não alcança `localhost` para entregar webhooks em dev, e também reforça produção contra webhook atrasado/perdido (verificação recomendada pelo próprio Stripe no fluxo de sucesso). `RequerAssinatura` (componente client-side) chama `temAcessoAtivo()` antes de renderizar `/nova-redacao`, `/dashboard`, `/historico` e `/correcao/[id]`, redirecionando para `/vendas` se não houver assinatura ativa.
- **Simplificação deliberada**: pagamento único com prazo de acesso, não `Stripe Subscription` com renovação automática/cancelamento/portal do cliente — implementar o ciclo de vida completo de assinatura recorrente é um escopo maior que o pedido original. Pode evoluir para isso depois sem quebrar o schema (a tabela já modela `status`/`expira_em` de forma agnóstica à origem).
- **Testado sem CLI do Stripe** (não instalado no ambiente): sessão de checkout real criada via API (confirma integração Stripe→URL); processamento do webhook validado assinando um payload sintético localmente com `stripe.webhooks.generateTestHeaderString` e o mesmo `STRIPE_WEBHOOK_SECRET` usado pela rota; `/api/checkout/verificar` testado contra uma sessão real ainda não paga (retorna `{ativo:false}` sem erro). Completar um pagamento de fato exige o cartão de teste do Stripe (`4242 4242 4242 4242`) num navegador real — não há API para "completar" uma Checkout Session sem passar pela página hospedada, então essa etapa específica (ver o estado "Pagamento confirmado!" em `/checkout/sucesso`) fica para o usuário testar manualmente.
- **Pendências para produção**: ~~(1) autenticação real~~ — resolvido pelo ADR 011; (2) `STRIPE_WEBHOOK_SECRET` atual foi gerado para um endpoint de teste (`https://example.com/...`), só serve para assinar payloads localmente — em produção é preciso criar um endpoint real no dashboard do Stripe apontando para a URL pública e usar o secret dele; (3) migrar chaves de teste (`sk_test_`/`pk_test_`) para chaves live quando for cobrar de verdade.

### ADR 011: Autenticação Real via Supabase Auth (email/senha + Google), substituindo o device_id
- **Status**: Aprovado e Implementado
- **Contexto**: O usuário percebeu, testando o checkout, que conseguiu pagar sem nunca ter criado conta — o gate de acesso pago (ADR 010) estava ancorado num `device_id` anônimo gerado no navegador (`localStorage`), não numa identidade real. Isso significava: acesso preso ao navegador/dispositivo (limpar dados ou trocar de aparelho perdia o vínculo com a assinatura paga, sem forma de recuperar), sem histórico entre dispositivos, e uma superfície de falsificação (copiar o `device_id` do `localStorage` para outro navegador herdava o acesso pago).
- **Decisão**: Adotado Supabase Auth como provedor de identidade (já era a mesma conta/projeto usado para persistência, sem necessidade de serviço externo). `src/lib/auth.ts` expõe `cadastrarComEmail`, `entrarComEmail`, `entrarComGoogle`, `sair`; `src/contexts/AuthContext.tsx` (`AuthProvider`, hook `useAuth`) mantém a sessão em memória via `supabase.auth.getSession()` + `onAuthStateChange`, disponível em toda a árvore a partir de `src/app/layout.tsx`. A página `/auth` (antes 100% simulada, com `setTimeout` fingindo sucesso e um botão de "acesso demo" que pulava o login inteiro) foi reescrita para chamar `supabase.auth.signInWithPassword`/`signUp`/`signInWithOAuth` de verdade. Login com Google usa o fluxo OAuth padrão do Supabase: `signInWithOAuth({provider:'google', redirectTo: origin+'/auth/callback'})`, com o SDK (`detectSessionInUrl`) trocando o código pela sessão sozinho ao voltar em `/auth/callback` — sem troca manual no servidor.
- **Migração de dados**: `redacoes` e `assinaturas` passaram de `device_id text` para `user_id uuid references auth.users(id)` (`supabase/schema-auth-migration.sql`, que dropa e recria as duas tabelas — aceitável só por não haver dados reais de produção ainda). RLS mudou de "liberado para `anon`" para `auth.uid() = user_id` restrito a `authenticated`; `assinaturas` continua com escrita restrita ao service role. `RequerAssinatura` passou a checar primeiro se há usuário logado (`useAuth`) — sem sessão, redireciona para `/auth`; logado mas sem assinatura ativa, redireciona para `/vendas`. `/api/checkout` passou a exigir `Authorization: Bearer <access_token>`, validado via `supabaseAdmin.auth.getUser(token)` (`401` sem token válido) — o `user_id` extraído do token, não mais recebido do corpo da requisição, vai para `client_reference_id`/`metadata` da Checkout Session.
- **Impacto**: Compra e acesso agora exigem conta real; histórico e assinatura acompanham o usuário entre dispositivos; elimina a possibilidade de herdar acesso pago copiando um identificador do navegador.
- **Pendências**: habilitar o provider Google no Supabase Dashboard exige um OAuth Client ID criado manualmente no Google Cloud Console (ação humana, fora do alcance do agente) — ver [[05 - Banco de Dados & Integrações/Supabase, Storage & Env|seção de configuração]]. Recuperação de senha ("esqueci minha senha") ainda não tem fluxo implementado.

### ADR 012: Correção Gratuita com Resultado Borrado (Paywall) + Cadastro Obrigatório com Dados de Contato
- **Status**: Aprovado e Implementado
- **Contexto**: O pedido original (ADR 010/011) bloqueava `/nova-redacao` inteira até haver pagamento. O usuário decidiu mudar a estratégia de conversão: deixar qualquer usuário logado escrever e receber a correção de verdade (a IA roda normalmente), mas exibir nota, competências, erros marcados, versão reescrita e plano de ação **borrados** (blur + overlay com CTA para `/vendas`) até a assinatura — modelo comum de paywall "freemium com prova de valor". Também pediu que o cadastro colete nome completo, WhatsApp, cidade/estado, data de nascimento e curso dos sonhos, para uso em vendas via WhatsApp e ofertas de outros produtos (não só o corretor).
- **Decisão — gate dividido em dois componentes**: `RequerLogin` (`src/components/RequerLogin.tsx`) substitui `RequerAssinatura` em `/nova-redacao` e `/correcao/[id]` — exige login + perfil completo, mas **não** exige assinatura. `RequerAssinatura` continua como estava (login + perfil + assinatura) para `/dashboard` e `/historico`, que seguem 100% pagas. `CorrecaoView` ganhou a prop `bloqueado`; quando `true`, a nota geral, o badge de classificação e todo o conteúdo das 3 abas (Análise, Reescrita, Plano) ficam com `blur-md` + um overlay central com ícone de cadeado e botão "Ver Planos"; a exportação em PDF fica desabilitada. `/api/corrigir` passou a exigir login (`Authorization: Bearer`, mesmo padrão do `/api/checkout`) — mas não checa assinatura, só autentica.
- **Decisão — perfil obrigatório**: nova tabela `public.perfis` (`supabase/schema-perfis.sql`) com os 5 campos, RLS restrita ao próprio usuário, populada automaticamente por um trigger `security definer` em `auth.users` que lê `raw_user_meta_data`. Cadastro por e-mail/senha manda os 5 campos nesse metadata (`cadastrarComEmail` em `src/lib/auth.ts` aceita um objeto de perfil); login via Google não tem como coletar isso no fluxo OAuth, então nasce com perfil parcial e é forçado a completá-lo em `/completar-perfil` (nova rota) antes de acessar `/nova-redacao` ou `/dashboard` — checado por `perfilCompleto()` (`src/lib/perfil.ts`) dentro dos dois gates.
- **Impacto**: qualquer usuário logado (mesmo sem pagar) já experimenta o produto de verdade, o que costuma converter melhor que uma tela de vendas fria; em compensação, cada correção gratuita ainda consome uma chamada real de LLM — o rate limiting do ADR 009 segue sendo a única defesa de custo contra abuso. O banco de contatos (`perfis`) fica pronto para campanhas de WhatsApp e cross-sell fora do produto atual, mas não existe hoje nenhuma automação de disparo — é consulta manual direto no Supabase.
- **Pendência**: não há validação de formato para WhatsApp/data de nascimento além dos tipos nativos do input HTML (`tel`/`date`) — se os dados forem usados em disparo automatizado de WhatsApp no futuro, vale adicionar validação de formato mais rígida no cadastro.
- **Ajuste pós-teste em produção**: o destino após login/cadastro era `/dashboard`, que exige assinatura — na prática todo usuário novo era rebatido de imediato para `/vendas` sem nunca ver que podia escrever uma redação de graça, anulando justamente a prova de valor que motivou este ADR. Destino trocado para `/nova-redacao` em `/auth` (login por e-mail e efeito de sessão já ativa) e em `/auth/callback` (Google).

---

### ADR 013: Paywall aplicado na origem do dado, não na interface
- **Status**: Aprovado e Implementado
- **Contexto**: Uma revisão de código encontrou que o paywall do ADR 012 era puramente cosmético. A correção completa (nota, competências, erros, reescrita) era gerada, devolvida ao navegador pela `/api/corrigir`, **gravada no banco pelo próprio cliente** e só então borrada com CSS. Bastava abrir o inspetor e remover o `blur` — ou ler a resposta da requisição — para obter o produto pago de graça. A RLS de `redacoes` também não ajudava: só verificava se a linha pertencia ao usuário, nunca se ele havia pagado.
- **Decisão**: mover a fronteira do paywall da tela para o dado. (1) A correção saiu da coluna `redacoes.correcao` para a tabela `correcoes` (`supabase/schema-paywall.sql`), cuja policy de `select` exige, além de posse, `exists (... assinaturas ativa e não expirada)` — quem não pagou não recebe a linha do banco, e isso não é uma decisão de interface. (2) A persistência deixou de ser feita pelo cliente: `/api/corrigir` grava redação e correção com service role (`src/lib/salvar-correcao.ts`) e decide o que devolver conforme `assinaturaAtivaDoUsuario()` — correção completa para assinante, apenas `chamariz` (`total_erros`, `anulada`) para os demais. (3) Nova tela `CorrecaoBloqueada` mostra o chamariz real e um **esqueleto** borrado, deliberadamente vazio: borrar dado verdadeiro seria falso conforto, já que o inspetor o revelaria.
- **Consequência**: o cliente perdeu a capacidade de gravar ou alterar o próprio diagnóstico, o que também fecha a porta para forjar nota. `salvarRedacao` deixou de existir em `storage.ts`.
- **Pendência**: o fixture `MOCK_REDACOES_INICIAIS` do localStorage ainda traz uma correção completa de demonstração; ela não é o texto do usuário, mas convém revisar se deve continuar aparecendo no histórico como se fosse.

---

## 📋 Changelog do Projeto

### [v1.9.0] - 2026-09-05 (paywall real, aplicado no banco)
- **Corrigido**: o paywall era apenas visual — a correção completa ia inteira para o navegador e só era borrada com CSS. Agora a correção vive na tabela `correcoes`, cuja RLS exige assinatura ativa, e a persistência passou para o servidor. Ver ADR 013.
- **Adicionado**: `supabase/schema-paywall.sql` (migra as correções existentes sem perda), `src/lib/assinatura-servidor.ts`, `src/lib/salvar-correcao.ts` e o componente `CorrecaoBloqueada`.
- **Removido**: `salvarRedacao` de `storage.ts` — o cliente não grava mais redação nem correção, o que também impede forjar a própria nota.
- **Testes**: 92 → 93, incluindo um caso que trava a regressão ("nunca inventa nota quando a correção está bloqueada").

### [v1.8.0] - 2026-09-05 (redesign da página de vendas — identidade "placar")
- **Alterado**: `/vendas` redesenhada por completo. O usuário apontou que o visual estava com "cara de IA" — diagnóstico confirmado no CSS: fundo quase preto azulado, glassmorphism, gradiente azul→roxo→rosa, orbes desfocados e todo card idêntico com ícone colorido em caixa arredondada. Nova identidade **"placar"**: a nota vira o herói (`540 → 920` em condensada pesada), competências viram painel de estatísticas com barras, um único acento (verde-limão `#C6F24E`), superfícies chapadas e cantos retos. Ver [[04 - Arquitetura Técnica/Componentes & Design System]].
- **Adicionado**: fontes `Anton` (notas/títulos) e `Barlow` (interface) via `next/font`, além de `Newsreader`/`Karla`/`Caveat` da direção alternativa "caderno".
- **Copy**: alavancas de conversão passaram a ser numéricas e verificáveis (contraste `3` correções por semestre no cursinho vs. ilimitadas; erro demonstrado como "−40 pontos"), e o CTA principal usa o modelo freemium ("corrija de graça") em vez de pedir cartão de imediato. O placar ilustrativo leva aviso explícito de que **não** representa resultado de aluno real — mesma regra que motivou a remoção do cronômetro falso na v1.4.0.

### [v1.7.0] - 2026-09-05 (correção gratuita com resultado borrado + cadastro obrigatório)
- **Adicionado**: `RequerLogin` (login + perfil completo, sem exigir assinatura) — usado em `/nova-redacao` e `/correcao/[id]`, que deixaram de exigir pagamento para escrever/corrigir. `RequerAssinatura` segue exigindo pagamento em `/dashboard` e `/historico`.
- **Adicionado**: paywall visual em `CorrecaoView` (prop `bloqueado`) — nota geral, badge de classificação e as 3 abas (Análise, Reescrita, Plano) ficam borradas com overlay "Ver Planos" quando não há assinatura ativa; exportação em PDF desabilitada nesse estado.
- **Adicionado**: tabela `public.perfis` (nome completo, WhatsApp, cidade/estado, data de nascimento, curso dos sonhos) com trigger automático em `auth.users` — ver ADR 012. Campos obrigatórios no cadastro por e-mail/senha; nova rota `/completar-perfil` força quem entra via Google a preenchê-los antes de usar o produto.
- **Corrigido**: `/api/corrigir` passou a exigir sessão autenticada (`Authorization: Bearer`) — antes era completamente anônimo, só protegido por rate limit de IP.
- **Corrigido**: após login/cadastro (e-mail ou Google), o usuário passa a cair em `/nova-redacao` em vez de `/dashboard` — o dashboard exige assinatura e rebatia todo usuário novo direto para `/vendas`.

### [v1.6.0] - 2026-09-05 (autenticação real via Supabase Auth)
- **Adicionado**: login/cadastro reais via Supabase Auth (e-mail/senha + Google OAuth) — ver ADR 011. `src/lib/auth.ts`, `src/contexts/AuthContext.tsx`, `/auth/callback`.
- **Removido**: simulação de login (`setTimeout` fingindo sucesso) e botão de "acesso demo" que pulava a autenticação inteira.
- **Migrado**: `redacoes`/`assinaturas` de `device_id` (texto anônimo em localStorage) para `user_id` (`auth.users.id`) — `supabase/schema-auth-migration.sql`, RLS restrita a `auth.uid() = user_id`.
- **Corrigido**: `/api/checkout` agora exige sessão autenticada (`Authorization: Bearer`), rejeitando com `401` sem token válido — antes aceitava qualquer `deviceId` enviado pelo cliente sem verificação nenhuma.
- **Corrigido**: `RequerAssinatura` passou a checar login antes de assinatura, redirecionando para `/auth` (sem sessão) ou `/vendas` (sem assinatura).
- **Removido**: link direto "⚡ Planos & Oferta" do menu principal (`Navbar.tsx`) — `/vendas` agora só é alcançada pelo redirecionamento automático do gate de assinatura ou pelo rodapé.

### [v1.5.0] - 2026-09-05 (checkout Stripe real + gate de acesso)
- **Adicionado**: cobrança real via Stripe Checkout (3 planos: Mensal/Anual/Semestral), gate de acesso pago (`RequerAssinatura`) bloqueando `/nova-redacao`, `/dashboard`, `/historico` e `/correcao/[id]` até confirmação de pagamento — ver ADR 010.
- **Adicionado**: tabela `assinaturas` no Supabase (`supabase/schema-assinaturas.sql`), escrita restrita ao service role (webhook), leitura liberada por `device_id` para o cliente.
- **Adicionado**: `src/lib/supabase-admin.ts` (cliente service role, uso exclusivo server-side), `src/lib/planos.ts`, `src/lib/assinatura.ts`, `scripts/stripe-setup.ts`.
- **Adicionado**: página `/checkout/sucesso` com confirmação assíncrona (poll de `temAcessoAtivo` após o redirect do Stripe).
- **Corrigido**: página `/vendas` deixou de ser decorativa — os 3 CTAs agora criam sessões reais de checkout em vez de linkar direto para o corretor.

### [v1.4.0] - 2026-09-05 (copy honesto + testes + auditoria de viés)
- **Removido**: cronômetro falso (reiniciava sozinho ao chegar a zero) e "5 vagas restantes" fixo do `SalesStickyBar.tsx` — publicidade enganosa vedada pelo CDC. Componente estava presente no código mas não era renderizado em nenhuma página no momento da correção; corrigido preventivamente.
- **Adicionado**: 25 novos testes automatizados (`tests/rate-limit.test.ts`, `tests/storage.test.ts` com Supabase mockado, `tests/upload-route.test.ts`, `tests/corrigir-route.test.ts`) — total sobe de 45 para 70, cobrindo agora rate limiting, storage.ts e validação das rotas de API, sem depender de chamadas reais a LLM.
- **Adicionado**: metodologia e corpus da auditoria de viés (`src/lib/auditoria/casos.ts`, `scripts/auditoria-vies.ts`, `npm run auditoria:vies`) — ver [[02 - Metodologia ENEM/Auditoria de Viés]]. Execução pendente de cota de API (Gemini free tier esgotado, sem chave OpenAI).

### [v1.3.0] - 2026-09-05 (persistência + rate limiting)
- **Adicionado**: OCR de PDF sem texto selecionável via visão do Gemini — ver atualização do ADR 007.
- **Adicionado**: Persistência real via Supabase com `device_id` anônimo — ver ADR 008. `src/lib/storage.ts` agora assíncrono.
- **Adicionado**: Rate limiting + teto de tamanho em `/api/corrigir` e `/api/upload` — ver ADR 009.
- **Removido**: Schema antigo de 2 tabelas (`redacoes`+`correcoes`) nunca usado em código, substituído por schema único com JSONB (`supabase/schema.sql`).

### [v1.2.0] - 2026-09-05
- **Removido**: Fallback heurístico de produção — ver ADR 005.
- **Adicionado**: Dupla correção com reconciliação/arbitragem — ver ADR 006.
- **Adicionado**: Regras de consistência estruturadas (anulação total, teto de C2 monobloco, habilidades booleanas em C1/C3/C4, elementos de C5) em `correcao-schema.ts`.
- **Adicionado**: Log estruturado de observabilidade (`src/lib/observabilidade.ts`) por tentativa e resultado final de correção.
- **Corrigido**: Extração de PDF via `pdf-parse`, Node atualizado para 22.22.3 — ver ADR 007.
- **Corrigido**: `max_tokens` da OpenAI 3000→6000 (evitava truncar JSON de resposta).
- **Melhorado**: IDs via `crypto.randomUUID()` (antes `Math.random()`).
- **Refatorado**: `CorrecaoView.tsx` e `Editor.tsx` decompostos em componentes menores — ver [[04 - Arquitetura Técnica/Componentes & Design System]].
- **Adicionado**: 45 testes automatizados (Vitest) cobrindo schema, reconciliação e casos de regressão reais.
- **Adicionado**: Repositório Git (`jeanrj987/enem-nota-1000`).

### [v1.1.0] - 2026-09-01
- **Adicionado**: Skill `engineering-senior-developer` em `.agents/skills/engineering-senior-developer/SKILL.md` e regra contínua em `.agents/rules/engineering-senior-developer.md` para operação ininterrupta com padrões sênior de engenharia de software e arquitetura.
- **Adicionado**: Skill `caveman` em `.agents/skills/caveman/SKILL.md` para modo de comunicação ultra-conciso e economia de tokens.
- **Adicionado**: Central de Conhecimento e Documentação Completa no Obsidian (`Vault/`).
- **Adicionado**: Página de Vendas de Alta Conversão (`/vendas`) com copywriting focado na dor, urgência e escassez.
- **Adicionado**: Componente flutuante `SalesStickyBar` com cronômetro regressivo e CTA rápido.
- **Adicionado**: Quiz / Termômetro interativo de risco no SISU.
- **Melhorado**: Navbar e Footer com links destacados para a oferta especial.

### [v1.0.0] - 2026-08-31
- **Lançamento Inicial**: Plataforma completa de correção de redações com IA.
- **Implementado**: Matriz Oficial do INEP (C1 a C5) com notas de 0 a 1000.
- **Implementado**: Editor de texto, upload de PDF/DOCX/TXT e exportação de relatórios em PDF.
- **Implementado**: Gráficos de evolução temporal e gráfico de radar de competências via Recharts.
- **Implementado**: Fallback em cascata Gemini Flash $\rightarrow$ GPT-4o-mini $\rightarrow$ Heurística offline.

---

## 🔗 Links Relacionados
- [[00 - Regras de Manutenção do Vault|Regras de Manutenção do Vault]]
- [[00 - Índice Principal|Retornar ao Índice Principal]]
