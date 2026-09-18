---
title: Decisões de Arquitetura (ADRs) & Changelog
tags:
  - changelog
  - adr
  - decisoes
  - historico
updated: 2026-09-17 (landing única + registro retroativo do tema dark V2)
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

### ADR 014: Identidade "caderno & caneta vermelha" para o projeto inteiro, com cor semântica em tokens
- **Status**: Aprovado e Implementado
- **Contexto**: o produto tinha duas identidades convivendo — a `/vendas` no visual "placar" (fundo azul-marinho, verde-limão) e todo o resto do sistema no tema escuro original (slate + degradê azul→roxo→rosa, glassmorphism, orbes desfocados). O usuário havia apontado antes que o visual estava "com cara de IA", diagnóstico que o CSS confirmava. A decisão foi unificar tudo na direção **"caderno & caneta vermelha"**, que estava preservada em `design-alternativas/` aguardando avaliação.
- **Decisão**: aplicar o caderno ao projeto inteiro, inclusive à `/vendas`. A interface passa a imitar uma folha de redação corrigida à mão — que é o próprio produto vendido. Papel `#F7F4ED`, tinta quente `#1C1917`, vermelho de corretor `#C0392B` como acento único, azul de caneta `#29487D` para o texto do aluno; serifada (Newsreader) no enunciado, humanista (Karla) na leitura corrida, manuscrita (Caveat) nas anotações do corretor.
- **Decisão estrutural**: a cor deixou de ser escrita à mão nas telas. Os tons entram no bloco `@theme` do Tailwind 4 em `globals.css` com **nomes semânticos pelo papel que exercem**, não pelo tom (`bg-papel`, `bg-folha`, `text-tinta`, `text-tinta-suave`, `border-regua`, `bg-vermelho`, `text-azul`). O motivo é direto: a conversão exigiu tocar em 844 ocorrências espalhadas por 23 arquivos justamente porque a paleta anterior estava codificada classe a classe. Com tokens, a próxima mudança de identidade acontece em um arquivo.
- **Alavanca de conversão**: `.glass-panel` (usada em 19 telas) e `.gradient-text` (em 4) mantiveram o nome mas trocaram de definição — de vidro fosco para folha de papel, e de degradê para tinta cheia. Redefinir duas classes converteu a maior parte das superfícies sem editar as telas.
- **Removido**: todo degradê de CTA (virou vermelho chapado), os orbes `blur-3xl` decorativos de `/`, `/auth` e `CorrecaoView`, e as classes mortas `.glow-effect` e `.gradient-border`. Os cantos passaram de `rounded-xl/2xl/3xl` para `rounded-sm`: papel não tem borda arredondada.
- **Marcações de erro**: deixaram de ser bloco de cor chapada (que é como um estudante usa marca-texto) e passaram a ser traço embaixo da palavra com leve fundo — que é como o corretor marca.
- **Consequência**: `/vendas` perdeu o visual "placar", que foi preservado em `design-alternativas/vendas-placar.tsx` + `.css` pelo mesmo critério com que o caderno havia sido guardado. As fontes Anton e Barlow saíram do `layout.tsx`; Newsreader, Karla e Caveat voltaram.
- **Risco assumido**: a conversão foi feita por script e revisada depois. Os defeitos que o script criou e que foram corrigidos à mão ficam registrados como alerta para uma próxima migração desse tipo: texto escuro sobre botão vermelho (o `text-white` virou `text-tinta` indiscriminadamente), tons órfãos deixados pela remoção de gradiente (`bg-vermelho ... -600`), e ícones aninhados dentro de blocos de acento, que o script não via porque olhava uma `className` por vez, sem relação pai/filho.

### ADR 015: Destino pós-login centralizado e validado (`?redirect=`)
- **Status**: Aprovado e Implementado
- **Contexto**: a `/vendas` mandava quem não estava logado para `/auth?redirect=/vendas`, mas o `/auth` ignorava o parâmetro e jogava todo mundo em `/nova-redacao`. Na prática, quem clicava em "Assinar" criava a conta e era despejado no editor — a compra evaporava no meio do funil. O `/completar-perfil` era o único que lia o parâmetro, e mesmo assim **sem validar**.
- **Decisão**: concentrar leitura, validação e transporte do destino em `src/lib/redirecionamento.ts`, em vez de repetir a regra nas cinco telas que precisam dela. `destinoSeguro()` aceita apenas caminho interno; `urlDeLogin()` monta o link para `/auth`; `guardarDestino()`/`resgatarDestino()` cuidam da ida e volta pelo provedor OAuth.
- **Por que a validação não é detalhe**: um `?redirect=` aceito sem checagem é um **open redirect**. O atacante monta `nossosite.com/auth?redirect=https://site-falso.com`; a vítima confere o domínio, vê a nossa tela de login legítima, entra, e é despejada num clone que pede a senha de novo. A função recusa URL absoluta, esquema perigoso (`javascript:`, `data:`) e protocolo relativo (`//host` e `/\host`, que o navegador resolve como site externo mesmo começando com barra — é o desvio clássico de uma checagem que só testa `startsWith('/')`).
- **Por que o Google precisa de sessionStorage**: `signInWithOAuth` tira o navegador do site e o traz de volta em `/auth/callback`, um carregamento novo, sem a query string original. Copiar o parâmetro entre páginas funcionaria no login por e-mail e falharia **em silêncio** no Google. O destino é guardado antes da saída e consumido na volta — consumido, para não vazar para um login seguinte, de outro contexto. `sessionStorage` e não `localStorage` porque o destino deve morrer com a aba.
- **Alcance**: `RequerLogin` e `RequerAssinatura` passaram a levar a rota atual, então quem é barrado ao abrir uma correção antiga volta **para aquela correção**. Os links "Entrar" da Navbar idem.
- **Consequência**: 12 testes novos cobrindo a barreira de open redirect e a viagem pelo provedor (total 93 → 105).
- **Limite conhecido**: no cadastro por e-mail há confirmação obrigatória, então essa pessoa não tem sessão na hora e não é redirecionada; o `?redirect=` só age no login seguinte.

### ADR 016: E-mail como campo obrigatório, não como etapa de verificação
- **Status**: Aprovado — metade no código, metade pendente de configuração no painel
- **Contexto**: a tela de cadastro exibia "Verifique seu e-mail para confirmar o cadastro antes de entrar" e, **800ms depois, redirecionava assim mesmo**, com ou sem sessão. Se a confirmação estivesse ligada, a pessoa nem terminava de ler a instrução: era jogada deslogada na página seguinte e ricocheteada de volta para `/auth` pelo `RequerLogin` — um vaivém sem saída. Se estivesse desligada, a mensagem mentia, mandando confirmar um e-mail que não precisava de confirmação.
- **Decisão de produto (do usuário)**: o e-mail é **campo obrigatório do cadastro, não etapa de verificação**. A confirmação por e-mail fica desligada. O raciocínio é de conversão: o público é estudante no celular, e obrigá-lo a sair do site, abrir a caixa de entrada e caçar o e-mail (que às vezes cai no spam) derruba a compra no meio do funil. O dado de contato que sustenta a operação de vendas no X1 é o WhatsApp, também obrigatório.
- **Decisão técnica**: a tela deixou de redirecionar às cegas. `signUp` só devolve sessão quando a confirmação está desligada, então o código agora **verifica** `data.session`: com sessão, segue para o destino; sem sessão, permanece na tela com a instrução legível. Isso vale nas duas configurações — se a confirmação for religada um dia, o fluxo degrada com elegância em vez de virar vaivém.
- **Trade-off assumido**: sem confirmação, o e-mail pode ser inventado. É aceito conscientemente porque o canal de venda é o WhatsApp, não o e-mail.
- **Pendência de configuração**: desligar "Confirm email" em Authentication → Sign In / Providers → Email, no painel do Supabase. Só o dono do projeto tem acesso. Enquanto estiver ligado, o cadastro continua exigindo confirmação — mas agora sem o vaivém.

### ADR 017: Validação e normalização do WhatsApp, o ativo comercial do cadastro
- **Status**: Aprovado e Implementado
- **Contexto**: com a confirmação de e-mail descartada (ADR 016), o WhatsApp passou a ser o único canal confiável de contato — é por ele que a venda no X1 acontece. Mas o campo aceitava qualquer texto: um número errado não dava erro em lugar nenhum, só virava lead morto na lista, descoberto semanas depois.
- **Decisão**: `src/lib/whatsapp.ts` concentra máscara, validação e normalização, usado nas duas portas de entrada do perfil (`/auth` no cadastro por e-mail e `/completar-perfil` para quem entra pelo Google).
- **Máscara que não atrapalha**: `formatarWhatsapp` formata progressivamente e **nunca rejeita** o que foi digitado. Formatar é trabalho da máscara; recusar é trabalho da validação. Uma máscara que apaga caractere no meio da digitação é a forma mais rápida de fazer alguém abandonar o formulário.
- **Validação estrita, com motivo explicado**: `validarWhatsapp` devolve a mensagem do problema em vez de um booleano, para a tela poder dizer "esse DDD não existe" em vez de só pintar a borda de vermelho. Recusa: DDD inexistente (lista explícita do Plano Nacional de Numeração, não a faixa 11–99 — boa parte dos intermediários nunca foi atribuída, e aceitá-los deixaria passar justamente o erro de digitação que se quer barrar), número que não começa com 9 depois do DDD (é fixo, e fixo não recebe WhatsApp), e dígitos repetidos como `(11) 99999-9999`, o preenchimento de fuga clássico.
- **Armazenamento em E.164** (`+5511912345678`): é o formato que as ferramentas de disparo esperam, então guardar já normalizado evita limpar a lista na hora de exportar — e garante que o mesmo número digitado de duas formas não vire dois leads. Ao carregar um perfil existente, o valor é remascarado para leitura.
- **Sutileza tratada**: o código do país só é removido quando sobra número completo depois dele, para não mutilar o DDD 55 (Santa Maria/RS) digitado sozinho. Há teste cobrindo esse caso.
- **Testes**: 14 novos (total 105 → 119).

### ADR 018: Correção única no acesso gratuito, completada para dupla ao assinar
- **Status**: Aprovado e Implementado
- **Contexto**: medição de 7 de setembro mostrou ~17.000 tokens por correção (prompt de sistema de ~4.500 × 2 chamadas), chegando a ~25.000 quando a divergência aciona a arbitragem. Quem não pagou dispara exatamente o mesmo custo e vê só o número de desvios: pagava-se o produto inteiro para exibir um cadeado.
- **Decisão**: a assinatura passou a ser consultada **antes** de corrigir. Sem plano, roda uma passagem só (`corrigirRedacaoSimples`); com plano, a dupla correção de sempre.
- **O problema que isso cria, e como foi resolvido**: um assinante não pode receber menos do que pagou. A correção gratuita fica marcada com `motivoCorrecaoUnica: 'acesso-gratuito'` e, quando o dono passa a ter plano ativo, a tela chama `/api/corrigir/completar`, que roda a segunda passagem sobre o mesmo texto e reconcilia — o mesmo resultado que ele teria se já fosse assinante ao enviar. A rota é idempotente e recusa quem não tem plano, então abrir a tela repetidamente não queima cota.
- **Distinção necessária**: `correcaoUnica` já existia, mas significava "a segunda falhou". Sem o campo `motivoCorrecaoUnica`, o sistema tentaria completar eternamente correções que ficaram únicas por erro de cota. São casos diferentes e agora são distinguíveis.
- **Degradação honesta**: se a segunda passagem falhar na hora de completar, a tela devolve a correção que já existe em vez de erro — o aluno tem um diagnóstico real e válido, apenas sem reconciliação. Enquanto a segunda roda, um aviso explica que a nota pode se ajustar, para ela não mudar sozinha sem explicação.
- **Testes**: 123 → 129.

### ADR 020: A segunda correção de um par não escreve reescrita nem plano de ação
- **Status**: Aprovado e Implementado.
- **Contexto**: a reconciliação (ADR 006) sempre usa o texto pedagógico de **uma só** das duas correções — a "representativa", mais próxima da nota média. A outra reescrita, o outro feedback, os outros pontos positivos e próximos passos eram gerados e jogados fora inteiros. A reescrita é o maior bloco de saída do prompt, ~1.000 tokens — pagos à toa em toda correção de assinante.
- **Decisão**: `corrigirRedacaoComIA` ganhou um parâmetro `modo: 'completo' | 'leve'`. Em modo leve, o prompt instrui o modelo a **ainda assim avaliar a redação por completo** — competências, notas, anulação, cada erro com trecho e explicação reais — mas devolver `""` para `versao_reescrita`/`feedback_pedagogico` e `[]` para as duas listas. `corrigirRedacaoComDuplaCorrecao` passa a rodar a primeira correção completa e a segunda leve.
- **O risco que essa decisão cria, e como foi fechado**: a correção "representativa" é escolhida pela nota mais próxima da média — e às vezes é a segunda, a leve. Se a reconciliação simplesmente usasse o texto dela, o aluno veria uma reescrita vazia. `reconciliarCorrecoes` ganhou `comNarrativaEmprestada()`: quando a representativa não tem narrativa mas a outra correção tem, empresta dela — nunca mistura prosa de duas respostas (o que produziria texto incoerente, como já registrado no ADR 006), só usa a única fonte de narrativa disponível quando a nota "vencedora" não é dela. O mesmo vale no caminho de divergência de anulação. Há teste cobrindo exatamente o caso em que a leve venceria por proximidade de nota.
- **Falha da correção completa tratada à parte**: só a correção completa pode fornecer narrativa. Se ela falhar mas a leve suceder, o código tenta de novo em modo completo antes de desistir; se a retentativa também falhar, a correção **falha visivelmente** em vez de expor um resultado sem reescrita nem plano de ação — dois quartos das quatro entregas do produto. Consistente com o ADR 005 (nunca fabricar, nunca entregar incompleto sem avisar).
- **Terceira correção de arbitragem mantida completa**: quando a divergência aciona uma terceira correção, ela roda em modo completo, não leve — o par mais próximo entre as três pode excluir a primeira correção (a única com narrativa garantida até ali), e um caso raro não vale o risco de ficar sem fonte de texto pedagógico.
- **Aplicado também em `completarParaDuplaCorrecao`**: aqui a segunda e a eventual terceira passagem são sempre leves, porque a correção gratuita já existente (gerada por `corrigirRedacaoSimples`, sempre completa) é a âncora garantida de narrativa — não há cenário em que ela esteja ausente.
- **Testes**: 129 → 137 (6 novos em `correcao-schema.test.ts` e `reconciliacao.test.ts`, cobrindo o modo leve na validação e o empréstimo de narrativa nos dois pontos de reconciliação, incluindo o cálculo de médias por competência).

### ADR 031: Identidade visual "V2 dark" para o projeto inteiro (registro retroativo)
- **Status**: Aprovado e Implementado em 17/09 (commit `405043b`), **documentado só em 17/09 à noite** — a mudança de identidade foi para o código sem ADR nem entrada de changelog, e a nota [[04 - Arquitetura Técnica/Componentes & Design System]] ficou descrevendo o design anterior por meio dia. Este registro fecha a lacuna.
- **Contexto**: o ADR 014 havia unificado tudo na identidade "caderno & caneta vermelha" (tema claro, papel `#F7F4ED`, vermelho de corretor como acento). O usuário produziu uma landing de referência (`nota-1000-ai-v2.html`) em tema escuro e decidiu levar essa direção para o produto inteiro.
- **Decisão**: paleta escura com **azul `#4f8cff` como acento principal e cor de marca**; o vermelho recua para o que é genuinamente erro/alerta. Fundo `#070b14`, superfícies `#101827`/`#131e30`, bordas `#223047`. Fontes mantidas do ADR 014 (Newsreader/Karla/Caveat) — só a paleta mudou.
- **Nomes semânticos preservados de propósito**: `--color-papel`, `--color-tinta`, `--color-folha` e as classes `.glass-panel`/`.glass-card` continuam com os nomes das identidades anteriores, só com valores novos — trocar os nomes exigiria reescrever todas as telas. **O efeito colateral é que os nomes mentem**: `.glass-panel` não tem mais vidro nenhum (superfície sólida, sem `backdrop-filter`), e `papel`/`tinta` hoje são escuro/claro. Documentado em destaque na nota de design system.
- **Marca**: "Nota 1000 AI" virou "Nota 1000", e as menções descritivas a "IA"/"Inteligência Artificial" saíram dos textos visíveis (títulos, metadata, rodapé, PDF exportado, mensagens de erro, página de privacidade).
- **Dívida criada e ainda em aberto**: (1) `src/components/ui/` (`Button`, `ButtonLink`, `Card`, `Badge`) foi criado nesta rodada mas **nenhuma tela importa esses componentes** — ou o kit é adotado, ou deve ser apagado, para não haver duas fontes de verdade do mesmo botão; (2) os utilitários `.margem-caderno`, `.bloco-pautado`, `.risco-corretor`, `.carimbo` e `.fonte-manuscrita` sobraram do caderno e não têm nenhum uso em `src/**/*.tsx`.
- **Testes**: sem variação — mudança de CSS e de texto visível, sem lógica alterada.

### ADR 030: Landing única — a página de vendas virou a home e `/` deixou de ter uma landing institucional concorrente
- **Status**: Aprovado e Implementado.
- **Contexto**: o usuário relatou que o site "muda por completo" depois de criar uma conta. Não era bug de deploy nem de cache: existiam **duas portas de entrada com identidades visuais diferentes**. `/` renderizava uma `LandingPage` institucional (headline "Alcance a Nota 1000 na Redação do ENEM", `Navbar` + `Footer` do app, menu Início/Dashboard/Nova Redação/Histórico) e `/vendas` renderizava a página de vendas com shell próprio (header "NOTA 1000" com âncoras, footer próprio, headline "Descubra exatamente por que sua redação não está chegando aos 900+"). Quem criava conta e clicava em qualquer CTA da home caía no gate de assinatura (`RequerAssinatura`, ADR 010) e era despejado em `/vendas` — atravessando o funil inteiro de uma identidade para a outra sem nunca voltar à primeira.
- **Decisão**: manter **uma landing só, a que vende**. O conteúdo de `/vendas` passou a ser `src/app/page.tsx` (componente `PaginaInicial`); a `LandingPage` institucional foi descartada. `decidirGateAssinatura` agora redireciona para `/` em vez de `/vendas`.
- **`/vendas` continua existindo, como redirect 308**: a rota virou um Server Component de uma linha (`permanentRedirect('/')`). O link já foi divulgado e pode estar em anúncio, bio e mensagem antiga — 308 preserva o método e informa ao buscador que o endereço canônico é a raiz. Verificado com `next start`: `GET /vendas` → `308` com `location: /`.
- **Por que não o contrário (manter `Navbar`/`Footer` na página de vendas)**: o menu do app só oferece destinos que exigem assinatura — visitante deslogado que clicasse em "Dashboard" seria devolvido para a própria landing. Um shell próprio, sem navegação para dentro do produto, é o que faz sentido para quem ainda não comprou.
- **Porta de volta para quem já tem conta**: como a home agora também é o destino do item "Início" do `Navbar` (visível na área logada), o header da landing ganhou um link único que alterna entre **"Entrar"** (`urlDeLogin('/')`) e **"Minha conta"** (`DESTINO_PADRAO`, `/nova-redacao`) conforme `useAuth`. Sem ele, quem já é assinante entraria na página de vendas e ficaria sem saída.
- **CTAs de paywall apontam para `/#planos`**: os links "Ver planos" (`CorrecaoBloqueada.tsx`) e "Planos e preços" (`Footer.tsx`) vão direto à seção de preços, porque quem clica ali já viu a proposta de valor. O gate automático continua indo para `/` puro — quem é rebatido para lá nunca viu a oferta, e pular a página inteira para cair em cima do preço converte pior.
- **Testes**: 155 (sem variação — `gates.test.ts` teve o destino esperado atualizado de `/vendas` para `/`).

### ADR 029: Aviso (não bloqueio) quando C1 recebe nota reduzida sem erro grounded correspondente
- **Status**: Aprovado e Implementado.
- **Contexto**: o usuário reportou uma correção onde a Competência I recebeu 160/200 com o comentário "foram identificados deslizes pontuais de regência e colocação pronominal", mas — diferente das outras competências, que sempre citam o trecho exato — esse comentário não apontava nenhum erro específico ao lado. Investigação confirmou que existia sim um erro real vinculado (trecho "se manifestando a partir do apagamento", um caso de próclise antes de gerúndio, gramaticalmente defensável como desvio da norma culta estrita), então este caso específico não era um bug. Mas a investigação expôs uma lacuna real na validação: `validarCorrecaoIA` já rejeitava a contradição inversa (C1 = 200 com 2+ erros grounded contraditórios, ver checagem original do ADR de schema), mas não existia nenhuma checagem para o caso de uma nota **reduzida** vir sem nenhum erro `grounded` (trecho real encontrado no texto do aluno) vinculado a essa competência.
- **Decisão**: adicionada em `src/lib/correcao-schema.ts` uma checagem que, quando C1 recebe nota abaixo de 200 e nenhum erro em `erros[]` sobrevive à validação de trecho real para essa competência, adiciona um item a `avisos` (não rejeita a correção). Optado por aviso e não rejeição/retry porque a matriz do ENEM permite deduções holísticas de C1 sem um erro pontual sempre itemizado (ex.: registro de habilidades via `habilidades_c1`, impressão geral de fluência) — uma tentativa inicial de tornar isso uma rejeição dura quebrou 13 dos testes existentes, confirmando que o comportamento "nota reduzida sem erro itemizado" é às vezes legítimo no domínio, não um bug em si. O aviso fica registrado (mesmo canal de `avisos` já usado para trechos alucinados descartados) para permitir auditoria/monitoramento futuro sem impedir a entrega da correção ao aluno.
- **Testes**: 155 → 157 (2 novos em `correcao-schema.test.ts`: gera aviso quando falta erro grounded, não gera quando existe).

### ADR 028: Integração com a Kiwify implementada — checkout por link fixo + webhook
- **Status**: Aprovado, Implementado e **Verificado com pagamento real** em 17 de setembro.
- **Contexto**: com a Kiwify como gateway definido (ADR 027), os 2 produtos foram criados no painel dela pelo usuário — Plano Mensal (R$97, assinatura recorrente, `https://pay.kiwify.com.br/C2b4RMM`) e Acesso 40 dias (R$147, pagamento único, `https://pay.kiwify.com.br/BE4tQoq`) — e um webhook cadastrado com 5 eventos: compra aprovada, assinatura cancelada, assinatura atrasada, reembolso, chargeback.
- **Mudança de arquitetura em relação ao Stripe**: no Stripe, `/api/checkout` criava uma Checkout Session dinâmica por requisição, carimbando o `user_id` do comprador nela — o webhook sempre sabia exatamente qual conta liberar. Na Kiwify, os links de checkout são **fixos** (criados uma vez no painel, não por API a cada compra), então não existe onde carimbar o `user_id`. Duas consequências:
  - **Checkout virou navegação direta**: `/vendas` não chama mais nenhuma rota de API para iniciar o pagamento — o clique no botão monta a URL do link fixo do plano (`PLANOS[planoId].checkoutUrl`) com o e-mail da conta logada como query param (`?email=...`, se a Kiwify aceitar prefill por e-mail) e redireciona direto. `/api/checkout` e `/api/checkout/verificar` (Stripe) foram apagados.
  - **Vínculo compra↔conta por e-mail**: o webhook recebe o e-mail de quem comprou, não o `user_id`. Nova coluna `email` em `public.perfis` (migração `schema-perfis-email.sql`, com backfill e trigger `handle_new_user` atualizado) permite `buscarUserIdPorEmail()` (`src/lib/perfil.ts`) resolver a conta certa. **Risco aceito conscientemente com o usuário**: se o aluno pagar com um e-mail diferente do cadastro, a compra não é vinculada automaticamente — fica registrada no painel da Kiwify para ativação manual, sem tela de suporte dedicada (decisão explícita para não construir complexidade para um caso raro agora).
- **`/api/kiwify/webhook`** (novo): valida a assinatura HMAC-SHA1 do payload (query param `signature`, chave = `KIWIFY_WEBHOOK_TOKEN`) com `crypto.timingSafeEqual`; em "compra aprovada" chama `ativarAssinatura` (reaproveitada do Stripe, já era genérica o suficiente); nos demais eventos chama a nova `revogarAssinatura()` (`src/lib/ativar-assinatura.ts`), que marca as assinaturas ativas do usuário com o motivo (`cancelada`/`reembolsada`/`chargeback`/`atrasada`) e zera `expira_em` na hora — nunca deixa acesso pago esperando expirar sozinho depois de reembolso/chargeback.
- **Verificação contra payload e pagamento reais**: a primeira tentativa de teste falhou porque o `KIWIFY_WEBHOOK_TOKEN` configurado (`hyek5bc66ku`) era só o valor de exemplo mostrado na tela de criação do webhook, não o token real gerado pela Kiwify (`v9o1q4z2w0v`, visível — mas não editável — nas telas de "Editar webhook" e "Testar Webhook"). Corrigido o valor na Vercel e no `.env.local`. Depois disso: (1) o "Testar Webhook" da Kiwify (evento "Compra aprovada", dados fictícios) confirmou a assinatura HMAC válida e bateu exatamente com o formato assumido em `extrairEmail`/`identificarPlano`/`normalizarStatus` — `order_status`, `Product.product_name`, `Customer.email` e `Commissions.charge_amount` vieram exatamente como o código esperava; (2) uma **compra real de valor mínimo** confirmou o fluxo de ponta a ponta — webhook recebido, conta resolvida pelo e-mail, assinatura ativada, acesso liberado na conta do usuário. **Só os eventos de cancelamento/atraso de assinatura (que não têm como ser simulados pelo "Testar Webhook" da Kiwify) continuam sem confirmação contra um payload real** — o mapeamento de `ehCancelamento`/`ehAtraso` em `normalizarStatus` é a única parte ainda não verificada.
- **Limpeza**: removidos `/api/checkout`, `/api/checkout/verificar`, `/api/stripe/webhook`, `scripts/stripe-setup.ts`, a dependência `stripe` do `package.json`, e os testes correspondentes (6 testes). `/checkout/sucesso` perdeu a verificação síncrona (exclusiva do Stripe) e agora só espera o webhook.
- **Testes**: 149 → 153 (10 novos em `kiwify-webhook-route.test.ts`, cobrindo assinatura inválida/ausente, identificação de plano por nome e por valor, e-mail sem conta correspondente, e os 4 motivos de revogação; 6 testes do Stripe removidos junto com as rotas).

### ADR 027: Gateway de pagamento definido como Kiwify (não Kirvano)
- **Status**: Aprovado.
- **Histórico da decisão no mesmo dia**: o projeto saiu do Stripe e cogitou a Kirvano (ver ADR 026, que já registra "migrando para a Kirvano"); depois o usuário considerou rodar nas duas — Kirvano e Kiwify — ao mesmo tempo; por fim decidiu usar **só a Kiwify**. Nenhuma integração de código chegou a ser escrita para a Kirvano — só o texto de comentários/documentação, que foi atualizado para não deixar rastro de uma decisão já revertida.
- **Decisão final**: gateway único, Kiwify. O modelo de planos (R$97 mensal recorrente + R$147 pagamento único/40 dias, ver ADR 026) continua valendo — só o provedor mudou de nome nos comentários de `planos.ts` e `stripe-setup.ts`.
- **Ainda pendente**: toda a integração de fato (criar os 2 produtos na Kiwify, obter checkout links/IDs e webhook, reescrever `/api/checkout` e a rota de webhook) — nada disso foi implementado ainda, só a decisão de qual plataforma usar.
- **Testes**: 149 (sem variação — mudança de comentário/documentação, sem código executável alterado).

### ADR 026: `/vendas` e `planos.ts` reduzidos a dois planos
- **Status**: Aprovado e Implementado.
- **Contexto**: seguindo a decisão de migrar o gateway para a Kirvano (ADR pendente de migração no checklist), o modelo de planos mudou de 3 opções (mensal R$29,90, semestral R$89,00, anual R$147,00) para 2: **R$97 mensal recorrente** e **R$147 pagamento único, 40 dias de acesso**.
- **Decisão**: `PlanoId` em `src/lib/planos.ts` passou de `'mensal' | 'anual' | 'semestral'` para `'mensal' | 'unico'`, com um novo campo `recorrente: boolean` no tipo `Plano` (documentando a diferença de comportamento, mesmo antes de o checkout saber tratar renovação de verdade). `/vendas` foi de 3 cards para 2, com o mensal marcado como "o mais escolhido" (era o anual antes). `scripts/stripe-setup.ts` atualizado para coerência, embora esteja em vias de ficar obsoleto com a migração de gateway.
- **Corrigido de passagem**: a resposta do FAQ "posso enviar em arquivo?" ainda dizia que "fotos de redação manuscrita em PDF também são lidas" — falso desde o ADR 025 (OCR removido no mesmo dia). Corrigido para reforçar a exigência de texto real e legível.
- **O que NÃO mudou ainda**: o botão de cada plano continua chamando `/api/checkout` (Stripe), que trata todo plano como pagamento único (`mode: 'payment'`) — a renovação automática do plano mensal só existirá de fato depois da migração para a Kirvano, que ainda está pendente no checklist junto com cancelamento e reembolso.
- **Testes**: 149 (sem variação — `checkout-route.test.ts` já testava com `planoId: 'mensal'`, que continua existindo).

### ADR 025: Remoção do OCR de fotos/scans — só texto real é aceito
- **Status**: Aprovado e Implementado.
- **Contexto**: `/api/upload` tinha um caminho de último recurso para PDFs sem texto selecionável: renderizava as páginas como imagem e pedia transcrição literal ao Gemini via visão (`extrairTextoViaOCR`). Na prática isso tentava "ler" fotos ou digitalizações de redação manuscrita — dependente da caligrafia do aluno, sujeito a erro de transcrição silencioso, e gastando uma chamada de LLM cara (visão) por tentativa.
- **Decisão**: removida inteiramente a função `extrairTextoViaOCR` e o import de `@google/genai` de `route.ts` (o pacote continua no projeto — ainda é o provedor principal de correção em `openai.ts`, só não é mais usado para OCR). Um PDF sem texto selecionável agora falha direto com 422, orientando a colar o texto ou enviar `.txt`/`.docx` já digitado. Adicionado um aviso permanente na tela de upload (`AreaProducaoTextual.tsx`), visível antes mesmo de tentar enviar, pedindo texto real (não foto) e letra legível para garantir a melhor precisão da nota — a pedido do usuário.
- **Por que isso é uma melhoria, não só uma remoção**: transcrição de letra manuscrita por visão é a etapa mais sujeita a erro do pipeline inteiro — um `[ilegível]` ou uma palavra mal transcrita vira erro de português que não existe no texto original do aluno, distorcendo a nota. Recusar de forma clara e pedir o texto direto é mais honesto do que tentar adivinhar.
- **Testes**: 149 (sem variação — não havia teste cobrindo o caminho de OCR).

### ADR 024: Modal de carregamento não promete tempo nem menciona "IA"
- **Status**: Aprovado e Implementado.
- **Contexto**: `ModalCarregamento.tsx` exibia o título "Corrigindo com Inteligência Artificial" e a estimativa fixa "Tempo médio de análise: ~5 a 15 segundos" — o usuário identificou que essa estimativa não é real. A correção de assinante roda 2-3 chamadas de LLM em sequência (dupla correção + eventual arbitragem, ver ADR 006), o que facilmente ultrapassa 15 segundos; publicar um tempo que a maioria das correções não cumpre é a mesma categoria de problema já corrigida antes no projeto (cronômetro falso do `SalesStickyBar`, "60% OFF" inexistente no Footer).
- **Decisão**: removida a linha de tempo estimado. Título trocado de "Corrigindo com Inteligência Artificial" para "Corrigindo sua redação" — a pedido do usuário, sem menção a "IA" na tela de espera.
- **Testes**: 149 (sem variação — o componente não tinha teste de snapshot/texto).

### ADR 023: Remoção de `SalesStickyBar.tsx` (código morto)
- **Status**: Aprovado e Implementado.
- **Contexto**: o ADR 003 previa uma barra flutuante de urgência em `/vendas`, e o v1.4.0 já havia removido dela o cronômetro falso e a contagem fixa de "vagas restantes" por serem publicidade enganosa (CDC) — mas o componente em si nunca chegou a ser importado por nenhuma página. Continuava no repositório sem ser renderizado em lugar nenhum.
- **Decisão**: apagar `src/components/SalesStickyBar.tsx`. Nenhuma outra alteração — sem referências a remover em outros arquivos além da própria documentação do componente.
- **Testes**: 149 (sem variação — o componente não tinha teste próprio nem era exercitado por outro).

### ADR 022: Lógica dos gates de acesso extraída para funções puras testáveis
- **Status**: Aprovado e Implementado.
- **Contexto**: `RequerLogin` e `RequerAssinatura` decidem quem passa e quem é redirecionado (sem login → `/auth`, perfil incompleto → `/completar-perfil`, sem assinatura → `/vendas`), mas essa lógica vivia inteira dentro de `useEffect`s, misturada com chamadas assíncronas ao Supabase — sem jsdom/Testing Library no projeto, não havia como testar automaticamente sem simular renderização de componente.
- **Decisão**: a decisão em si (dado usuário logado?, perfil?, assinatura ativa?, pathname atual → o que fazer) virou duas funções puras em `src/lib/gates.ts` — `decidirGateLogin` e `decidirGateAssinatura` — que os componentes apenas chamam depois de resolver os dados assíncronos. Mesmo padrão já usado no projeto (lógica em lib, componente só chama; ver `reconciliacao.ts`, `whatsapp.ts`, `redirecionamento.ts`).
- **Comportamento inalterado**: a refatoração não muda nenhuma regra existente — mesmas prioridades (perfil incompleto é checado antes de assinatura), mesmos destinos, mesma proteção de open-redirect (reaproveita `destinoSeguro`/`urlDeLogin` de `redirecionamento.ts`).
- **Testes**: `tests/gates.test.ts`, 9 casos novos — cobre as quatro combinações de estado de cada gate, a ordem de prioridade entre as checagens, e a rejeição de um pathname malicioso (`https://site-falso.com`) usado como origem do redirect.
- **O que fica de fora, de propósito**: isso testa a *regra*, não que o componente React realmente chama `router.replace()` no momento certo — isso exigiria Testing Library/jsdom, que o projeto não usa. Aceito como suficiente porque o ponto de falha histórico dessas regras (esquecer uma checagem, inverter uma prioridade, aceitar um redirect externo) está inteiramente na lógica pura, não na integração com React.

### ADR 021: Teto absoluto de correções gratuitas por conta
- **Status**: Aprovado e Implementado.
- **Contexto**: o rate limit de `/api/corrigir` (`checarRateLimit`, 5 requisições/10min por IP) é uma janela deslizante, não um teto: nada impedia uma conta de corrigir indefinidamente ao longo do tempo sem nunca assinar, gerando custo de LLM sem fim para o produto.
- **Decisão**: `contarCorrecoesDoUsuario()` (`src/lib/assinatura-servidor.ts`) conta o total histórico de `redacoes` da conta (independente de quando foram feitas ou se a assinatura já expirou); `LIMITE_CORRECOES_GRATUITAS = 3`. A rota `/api/corrigir` só faz essa contagem quando a conta **não** tem assinatura ativa — quem paga nunca é afetado, mesmo com centenas de redações no histórico. Ao atingir o teto, a API responde `403` com uma mensagem que já orienta a assinar, exibida diretamente pelo `Editor` (que repassa `data.error` ao usuário sem tradução adicional).
- **Por que contar o histórico todo, e não só "enquanto free"**: se o teto resetasse ao assinar e cancelar, dar de baixa na assinatura viraria um jeito de recarregar 3 correções gratuitas de novo. Contar todas as `redacoes` da conta, independente do status de assinatura na hora em que foram feitas, fecha essa brecha.
- **Falha aberta do lado errado de propósito**: se a consulta ao banco falhar ou o Supabase não estiver configurado, `contarCorrecoesDoUsuario` devolve o próprio limite (não zero) — trata como "teto já atingido" em vez de "ainda não corrigiu nada", para não deixar a conta corrigir de graça pra sempre se o banco cair.
- **Testes**: 137 → 140 (3 novos em `correcao-gratuita.test.ts`: bloqueio exato no teto, liberação abaixo do teto, e assinante nunca sendo barrado).

### ADR 019: Só a Política de Privacidade — o restante do plano de LGPD foi descartado por decisão do usuário
- **Status**: Aprovado e Implementado, em escopo reduzido.
- **Histórico**: em 8 de setembro foi implementado um plano de LGPD com quatro frentes — consentimento de marketing desacoplado do cadastro, log de consentimento auditável, direitos do titular (`/configuracoes` com download e exclusão de dados) e retenção agendada. Na sequência, **o usuário pediu explicitamente para manter só a política de privacidade** e descartar o resto ("o restante da lgpd não precisa"). As três outras frentes foram revertidas: os checkboxes de consentimento saíram do cadastro, a tabela `consentimentos` e sua migração (`schema-lgpd.sql`) foram removidas do repositório, e `/termos`, `/configuracoes`, `/api/consentimento`, `/api/conta/dados` e `/api/conta/excluir` foram apagados.
- **O que permanece**: a rota `/privacidade`, com identificação do controlador (`src/lib/controlador.ts`, deixado em branco de propósito — ver abaixo), a lista de subprocessadores (`SUBPROCESSADORES`: OpenAI, Gemini, Supabase, Stripe, Vercel) com transferência internacional declarada, e o texto revisado para não prometer nada que não existe mais: a seção de direitos do titular agora orienta a pedir por e-mail, em vez de apontar para um botão em `/configuracoes` que foi removido, e o parágrafo de WhatsApp não afirma mais que enviar oferta depende de um checkbox separado, porque esse checkbox não existe.
- **Risco reintroduzido conscientemente**: o WhatsApp volta a ser coletado como campo único e obrigatório, sem consentimento de marketing desacoplado do uso do produto — a mesma situação que o ADR anterior havia identificado como o maior risco de LGPD do cadastro (Art. 8, §4). O usuário foi informado dessa consequência ao pedir a redução de escopo e decidiu assumi-la.
- **Identificação do controlador ainda em branco de propósito**: `src/lib/controlador.ts` continua com razão social, CNPJ, endereço e dados do encarregado (DPO, Art. 41) vazios. Inventar esses dados seria pior do que não publicá-los. Enquanto vazios, `/privacidade` exibe um aviso visível de "documento em preenchimento". **Ação exigida do usuário antes de abrir para tráfego real.**
- **Testes**: voltaram de 138 para 129 com a reversão (os 9 testes das rotas de consentimento/conta e a linha extra de `perfil.test.ts` saíram junto).

---

## 📋 Changelog do Projeto

### [v3.2.0] - 2026-09-17 (landing única: a página de vendas virou a home)
- **Alterado**: `/` deixou de ser uma landing institucional própria e passou a ser a página de vendas — acabou a troca de identidade visual no meio do funil, que aparecia para todo usuário recém-cadastrado. Ver ADR 030.
- **Alterado**: `/vendas` virou redirect permanente (308) para `/`, para não quebrar links já divulgados; `decidirGateAssinatura` redireciona para `/`; "Ver planos" e "Planos e preços" apontam para `/#planos`.
- **Adicionado**: link "Entrar"/"Minha conta" no header da landing, para quem já tem conta não ficar sem porta de volta ao app.
- **Testes**: 155 (sem variação — só o destino esperado em `gates.test.ts`).

### [v3.1.1] - 2026-09-17 (plano único corrigido para 30 dias)
- **Corrigido**: o plano de pagamento único (`PlanoId: 'unico'`) prometia 40 dias de acesso, mas isso não é possível de configurar na Kiwify — ajustado para **30 dias** em `src/lib/planos.ts` (`diasDeAcesso`, `nome`), no texto de `/vendas`, e no reconhecimento de nome de produto do webhook (`identificarPlano` em `src/app/api/kiwify/webhook/route.ts`). Produto correspondente renomeado no painel da Kiwify pelo usuário para manter consistência.
- **Testes**: 155 (sem variação de quantidade — só o texto esperado em `kiwify-webhook-route.test.ts` foi atualizado de "40 dias" para "30 dias").

### [v3.1.0] - 2026-09-17 (aviso de C1 sem erro grounded)
- **Adicionado**: `validarCorrecaoIA` agora registra um aviso (`avisos[]`, sem rejeitar) quando a Competência I recebe nota abaixo de 200 e nenhum erro em `erros[]` com trecho real do texto do aluno está vinculado a ela — protege contra deduções de nota sem evidência apontável, mantendo a rejeição dura só para a contradição inversa (nota 200 com 2+ erros grounded). Ver ADR 029.
- **Testes**: 155 → 157.

### [v3.0.1] - 2026-09-17 (Kiwify verificada com pagamento real)
- **Corrigido**: `KIWIFY_WEBHOOK_TOKEN` estava com o valor de exemplo da tela de criação do webhook, não o token real da Kiwify — corrigido na Vercel e no `.env.local`.
- **Confirmado**: webhook, ativação de assinatura e liberação de acesso testados de ponta a ponta com uma compra real. Ver ADR 028 (atualizado).
- **Testes**: 153 (sem variação — a correção foi de configuração, não de código).

### [v3.0.0] - 2026-09-17 (Stripe removido, Kiwify integrada)
- **Adicionado**: `/api/kiwify/webhook`, checkout por link fixo em `/vendas`, vínculo compra↔conta por e-mail (`perfis.email`). Ver ADR 028.
- **Removido**: toda a integração com o Stripe (`/api/checkout`, `/api/checkout/verificar`, `/api/stripe/webhook`, `scripts/stripe-setup.ts`, dependência `stripe`).
- **⚠️ Pendente de verificação**: o formato do payload do webhook da Kiwify ainda não foi confirmado contra um envio real — ver aviso no ADR 028 antes de considerar o fluxo de pagamento confiável em produção.
- **Testes**: 149 → 153.

### [v2.13.0] - 2026-09-17 (tema dark V2; fim da marca "AI") — *registrado retroativamente*
- **Alterado**: o projeto inteiro passou da identidade clara "caderno & caneta vermelha" para a paleta **dark da landing V2**, com azul `#4f8cff` como acento principal no lugar do vermelho. Ver ADR 031.
- **Alterado**: marca renomeada de "Nota 1000 AI" para "Nota 1000"; menções a "IA" removidas dos textos visíveis ao usuário.
- **Adicionado**: `src/components/ui/` (`Button`, `ButtonLink`, `Card`, `Badge`) — criado, mas ainda sem nenhum uso no app.
- **Testes**: sem variação.

### [v2.12.1] - 2026-09-17 (gateway definido: Kiwify, não Kirvano)
- **Corrigido**: comentários em `planos.ts` e `stripe-setup.ts` que citavam "Kirvano" foram atualizados para "Kiwify" — decisão final do usuário no mesmo dia, depois de cogitar rodar nas duas plataformas. Nenhuma integração de gateway foi implementada ainda. Ver ADR 027.
- **Testes**: 149 (sem variação).

### [v2.12.0] - 2026-09-17 (dois planos: R$97 mensal + R$147/40 dias)
- **Alterado**: `/vendas` e `src/lib/planos.ts` foram de 3 planos para 2 — R$97,00 assinatura mensal recorrente e R$147,00 pagamento único com 40 dias de acesso. Ver ADR 026.
- **Corrigido**: FAQ de `/vendas` não promete mais leitura de foto de redação manuscrita (ficou desatualizado depois do ADR 025).
- **Testes**: 149 (sem variação).

### [v2.11.0] - 2026-09-17 (fim do OCR de fotos; aviso de texto legível)
- **Removido**: `/api/upload` não tenta mais transcrever foto/scan de redação manuscrita via visão do Gemini — um PDF sem texto selecionável falha com uma mensagem clara pedindo para colar o texto ou enviar `.txt`/`.docx`. Ver ADR 025.
- **Adicionado**: aviso permanente na tela de upload orientando a enviar texto real, com letra legível, para a melhor precisão da nota.
- **Testes**: 149 (sem variação).

### [v2.10.0] - 2026-09-14 (modal de carregamento sem tempo estimado nem menção a IA)
- **Removido**: `ModalCarregamento.tsx` não anuncia mais "~5 a 15 segundos" (não era real, a dupla correção facilmente passa disso) nem "Inteligência Artificial" no título — agora só "Corrigindo sua redação". Ver ADR 024.
- **Testes**: 149 (sem variação).

### [v2.9.0] - 2026-09-08 (remoção de código morto: SalesStickyBar)
- **Removido**: `src/components/SalesStickyBar.tsx` — não era importado por nenhuma página. Ver ADR 023.
- **Testes**: 149 (sem variação).

### [v2.8.0] - 2026-09-08 (gates de acesso com testes; proteção de rota no servidor investigada)
- **Adicionado**: `src/lib/gates.ts` com a lógica de decisão de `RequerLogin`/`RequerAssinatura` extraída para funções puras, cobertas por 9 testes novos. Ver ADR 022.
- **Investigado, não implementado por decisão do usuário**: proteção de rota real via `middleware.ts` exigiria migrar a sessão de `localStorage` para cookie (`@supabase/ssr`), mudança de arquitetura que toca login, callback do Google e `AuthContext`. O usuário optou por não fazer agora, para não arriscar quebrar o login por pressa.
- **Testes**: 140 → 149.

### [v2.7.0] - 2026-09-08 (teto de correções gratuitas por conta)
- **Adicionado**: `/api/corrigir` agora barra com `403` quem já usou 3 correções gratuitas no total e não tem assinatura ativa, orientando a assinar. Fecha a brecha do rate limit por IP (janela deslizante, não teto absoluto). Ver ADR 021.
- **Testes**: 137 → 140.

### [v2.6.0] - 2026-09-08 (segunda correção não gera reescrita; aviso removido da política)
- **Alterado**: a segunda correção de todo par passa a rodar em modo "leve" — avalia notas e erros de verdade, mas não escreve reescrita nem plano de ação, que nunca eram exibidos mesmo (a reconciliação já usava só uma correção como fonte de texto). Corta ~1.000 tokens de saída por correção de assinante. Ver ADR 020.
- **Removido**: o aviso "Documento em preenchimento" saiu de `/privacidade`, a pedido do usuário — a página não avisa mais visualmente sobre a identificação do controlador estar vazia.
- **Testes**: 129 → 137.

### [v2.5.0] - 2026-09-08 (só a Política de Privacidade)
- **Adicionado**: página `/privacidade`, com identificação do controlador, tabela de subprocessadores e aviso de documento incompleto enquanto `controlador.ts` não for preenchido.
- **Revertido, por pedido do usuário**: consentimento de marketing separado, log de consentimento, `/termos`, `/configuracoes` e as rotas de download/exclusão de dados — implementados mais cedo no mesmo dia e descartados a pedido antes do push. Ver ADR 019.
- **Pendente do usuário**: preencher `src/lib/controlador.ts` com razão social, CNPJ e dados do encarregado antes de abrir para tráfego real.
- **Testes**: 129 (sem variação líquida — os 9 testes de consentimento/conta entraram e saíram no mesmo dia).


### [v2.4.0] - 2026-09-08 (correção única no acesso gratuito)
- **Alterado**: quem não tem plano passa a receber uma correção em vez de duas — corta pela metade o custo de LLM de quem ainda não comprou. Ver ADR 018.
- **Adicionado**: `/api/corrigir/completar`, que completa a correção para dupla assim que a pessoa assina, e `corrigirRedacaoSimples`/`completarParaDuplaCorrecao` em `openai.ts`.

### [v2.3.0] - 2026-09-07 (a rota de upload deixa de ser porta aberta)
- **Segurança**: `/api/upload` passou a exigir sessão (Bearer token verificado pelo service role), como a `/api/corrigir` já fazia. A tela sempre exigiu login, mas a rota por baixo aceitava arquivo de qualquer pessoa da internet — e um PDF sem texto selecionável dispara OCR por visão, que custa por chamada.
- **Alterado**: o rate limit da rota passou a contar **por usuário** em vez de por IP. O limite por endereço não segura quem troca de IP; por usuário, abusar exige criar contas, o que deixa rastro. O IP fica como reserva caso o id venha vazio.
- **Ordem importa**: a autenticação roda antes de ler o corpo da requisição, para não processar (nem pagar por) um arquivo de quem não tem sessão. Há teste cobrindo isso: um arquivo acima do teto sem token deve responder 401, nunca 413.
- **Testes**: 119 → 123.

### [v2.2.2] - 2026-09-07 (remoção do desconto que não existia)
- **Removido**: o rodapé anunciava "⚡ Planos & Oferta 60% OFF". Não existe preço cheio no Stripe do qual esses 60% sejam desconto, então era um desconto que nunca existiu — publicidade enganosa vedada pelo CDC, agravada por já haver cliente pagante. O link virou "Planos e preços". Se houver promoção real no futuro, o número volta acompanhado do preço de origem.

### [v2.2.1] - 2026-09-07 (aviso de paywall deixa de aparecer para quem pagou)
- **Corrigido**: o aviso "Sem um plano ativo..." em `/nova-redacao` estava escrito fixo no JSX, sem verificação nenhuma — aparecia para todo mundo, inclusive para assinante ativo. Passou a consultar `temAcessoAtivo()`. Enquanto a consulta não retorna, o aviso fica oculto: assumir "não tem plano" por padrão faria o assinante ver, por um instante, uma cobrança que já pagou.
- **Corrigido**: o texto dizia que a nota apareceria "borrada"; desde o ADR 013 ela não é enviada ao navegador. Passou a dizer "bloqueadas", que é o que de fato acontece.

### [v2.2.0] - 2026-09-07 (WhatsApp validado e normalizado)
- **Adicionado**: `src/lib/whatsapp.ts` com máscara progressiva, validação de DDD real, recusa de fixo e de dígitos repetidos, e armazenamento em E.164. Aplicado no cadastro e no completar-perfil. Ver ADR 017.
- **Testes**: 105 → 119.

### [v2.1.0] - 2026-09-07 (destino pós-login: o funil de compra deixa de perder o cliente)
- **Corrigido**: o cadastro redirecionava 800ms depois do envio mesmo sem sessão, atropelando a mensagem de confirmação e ricocheteando a pessoa deslogada de volta para `/auth`. Agora a tela verifica se veio sessão. Ver ADR 016.
- **Corrigido**: quem clicava em "Assinar" na `/vendas` sem estar logado criava a conta e era mandado para `/nova-redacao` em vez de voltar ao checkout. `/auth` e `/auth/callback` passam a respeitar o `?redirect=`. Ver ADR 015.
- **Adicionado**: `src/lib/redirecionamento.ts` — validação contra open redirect (recusa URL absoluta, `javascript:`, `data:` e protocolo relativo `//host`) e transporte do destino pelo `sessionStorage` durante o login com Google, que perde a query string na ida e volta pelo provedor.
- **Melhorado**: `RequerLogin`, `RequerAssinatura` e os links "Entrar" da Navbar levam a rota atual, então quem é barrado volta ao lugar de onde tentou entrar.
- **Segurança**: `/completar-perfil` já lia o `?redirect=` mas não o validava; passou a validar.
- **Testes**: 93 → 105.

### [v2.0.0] - 2026-09-07 (identidade única "caderno & caneta vermelha")
- **Alterado**: o projeto inteiro passou do tema escuro para a identidade "caderno & caneta vermelha", incluindo a `/vendas`, que abandonou o visual "placar". Ver ADR 014.
- **Adicionado**: camada de cor semântica em `@theme` (`bg-papel`, `text-tinta`, `border-regua`, `bg-vermelho`...), substituindo 844 classes de cor escritas à mão em 23 arquivos.
- **Alterado**: fontes do `layout.tsx` — saem Anton e Barlow, entram Newsreader (serifada), Karla (humanista) e Caveat (manuscrita).
- **Removido**: degradês de CTA, orbes `blur-3xl` decorativos, glassmorphism e as classes mortas `.glow-effect` e `.gradient-border`.
- **Preservado**: o visual "placar" foi para `design-alternativas/vendas-placar.tsx` e `vendas-placar.css`, do mesmo modo que o caderno havia sido guardado antes.
- **Verificação**: `tsc` limpo, build de produção gerando as 16 rotas, 93/93 testes passando e as 8 rotas respondendo 200.

### [v1.9.1] - 2026-09-06 (migração do paywall tornada idempotente)
- **Corrigido**: `supabase/schema-paywall.sql` falhava com `ERROR 42703: column r.correcao does not exist` quando executado numa base em que a coluna `redacoes.correcao` já não existia (segunda execução, ou base criada depois da mudança). A causa é que o Postgres analisa o lote inteiro antes de executar, então a referência literal a `r.correcao` quebrava o script mesmo dentro de um `where` que nunca casaria. O bloco de migração passou para `DO $$ ... EXECUTE ... $$` guardado por uma checagem em `information_schema.columns`: o SQL só é compilado se a coluna existir. O script agora pode ser rodado quantas vezes for preciso, sem efeito colateral.

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
