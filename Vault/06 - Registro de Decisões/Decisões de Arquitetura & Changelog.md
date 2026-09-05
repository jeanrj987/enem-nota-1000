---
title: Decisões de Arquitetura (ADRs) & Changelog
tags:
  - changelog
  - adr
  - decisoes
  - historico
updated: 2026-09-05 (checkout Stripe + gate de acesso pago)
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
- **Status**: Aprovado e Implementado (substitui parte do ADR 002 original do Vault 05)
- **Contexto**: Todo o histórico de redações vivia só em LocalStorage — sem sincronização entre dispositivos e com risco de perda ao limpar o navegador. Autenticação real ainda não existe (login segue simulado).
- **Decisão**: Ativado projeto Supabase real (`jzsudeviiosbhgkeljaf`). Uma única tabela `redacoes` (schema simplificado, correção embutida em JSONB) substitui o antigo par `redacoes`+`correcoes`. Sem `auth.users`, o histórico é agrupado por um `device_id` anônimo (`crypto.randomUUID()` em localStorage) — RLS habilitada mas permissiva para o role `anon`, já que `device_id` não é uma fronteira de segurança real. `src/lib/storage.ts` tornou-se assíncrono: tenta Supabase primeiro, sempre grava em LocalStorage como fallback/cache, nunca bloqueia nem falha a UI por causa de uma escrita remota que deu erro.
- **Armadilha corrigida em produção**: a coluna `id` foi inicialmente criada como `uuid`, mas os IDs do app são strings prefixadas (`red_<uuid>`, via `src/lib/ids.ts`) — todo insert falhava com `invalid input syntax for type uuid`. Corrigido para `id text`.
- **Impacto**: Histórico agora sobrevive à limpeza do navegador e sincroniza entre abas/sessões do mesmo device_id. Migração para segurança real por usuário fica pendente da implementação de autenticação (ver Crítico no checklist).

### ADR 009: Rate Limiting em Memória + Teto de Tamanho de Texto/Arquivo
- **Status**: Aprovado e Implementado
- **Contexto**: `/api/corrigir` e `/api/upload` eram públicas, sem limite de uso nem teto de tamanho — cada correção dispara 2-3 chamadas de LLM (dupla correção) e cada upload de PDF sem texto pode disparar OCR via Gemini, ambos com custo real por chamada.
- **Decisão**: `src/lib/rate-limit.ts` implementa um limitador em memória, por IP, janela fixa (sem dependência externa). `/api/corrigir`: 5 requisições/10min, texto máx. 8000 caracteres. `/api/upload`: 15 requisições/10min, arquivo máx. 10MB. Ambas retornam `429`/`413` com mensagem clara.
- **Limitação conhecida**: o contador é por processo — não é compartilhado entre instâncias serverless frias (cada cold start zera a janela). Suficiente para MVP; produção com múltiplas instâncias concorrentes precisa de um store compartilhado (Upstash Redis é o candidato natural, já que evita adicionar infra própria).

### ADR 010: Checkout Real via Stripe + Gate de Acesso por device_id
- **Status**: Aprovado e Implementado (modo de teste do Stripe)
- **Contexto**: `/vendas` era uma landing page decorativa — os 3 botões de plano levavam direto para `/nova-redacao` sem nenhuma verificação de pagamento, então qualquer um usava o corretor de graça. O usuário pediu explicitamente que o acesso ao produto ficasse condicionado à compra.
- **Decisão**: `npm run stripe:setup` cria os 3 produtos/preços via API do Stripe (Mensal R$29,90, Anual R$147,00, Semestral R$89,00 — **pagamento único**, não assinatura recorrente do Stripe: cada plano concede acesso por um número fixo de dias, 30/365/180, controlado por `expira_em` no Supabase). `/api/checkout` cria uma Stripe Checkout Session com `client_reference_id` = device_id. A ativação da assinatura (`ativarAssinatura`, `src/lib/ativar-assinatura.ts`) acontece por dois caminhos independentes e idempotentes: (1) `/api/stripe/webhook`, que verifica a assinatura HMAC do evento `checkout.session.completed` — fonte de verdade assíncrona em produção; (2) `/api/checkout/verificar`, chamado pela própria página `/checkout/sucesso` no redirect, que consulta a Checkout Session direto na API do Stripe pelo `session_id` e ativa se `payment_status === 'paid'` — necessário porque o Stripe não alcança `localhost` para entregar webhooks em dev, e também reforça produção contra webhook atrasado/perdido (verificação recomendada pelo próprio Stripe no fluxo de sucesso). `RequerAssinatura` (componente client-side) chama `temAcessoAtivo()` antes de renderizar `/nova-redacao`, `/dashboard`, `/historico` e `/correcao/[id]`, redirecionando para `/vendas` se não houver assinatura ativa.
- **Simplificação deliberada**: pagamento único com prazo de acesso, não `Stripe Subscription` com renovação automática/cancelamento/portal do cliente — implementar o ciclo de vida completo de assinatura recorrente é um escopo maior que o pedido original. Pode evoluir para isso depois sem quebrar o schema (a tabela já modela `status`/`expira_em` de forma agnóstica à origem).
- **Testado sem CLI do Stripe** (não instalado no ambiente): sessão de checkout real criada via API (confirma integração Stripe→URL); processamento do webhook validado assinando um payload sintético localmente com `stripe.webhooks.generateTestHeaderString` e o mesmo `STRIPE_WEBHOOK_SECRET` usado pela rota; `/api/checkout/verificar` testado contra uma sessão real ainda não paga (retorna `{ativo:false}` sem erro). Completar um pagamento de fato exige o cartão de teste do Stripe (`4242 4242 4242 4242`) num navegador real — não há API para "completar" uma Checkout Session sem passar pela página hospedada, então essa etapa específica (ver o estado "Pagamento confirmado!" em `/checkout/sucesso`) fica para o usuário testar manualmente.
- **Pendências para produção**: (1) autenticação real — hoje troca de navegador/limpeza de dados perde o vínculo com a assinatura, pois não há conta de usuário; (2) `STRIPE_WEBHOOK_SECRET` atual foi gerado para um endpoint de teste (`https://example.com/...`), só serve para assinar payloads localmente — em produção é preciso criar um endpoint real no dashboard do Stripe apontando para a URL pública e usar o secret dele; (3) migrar chaves de teste (`sk_test_`/`pk_test_`) para chaves live quando for cobrar de verdade.

---

## 📋 Changelog do Projeto

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
