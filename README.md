# Nota 1000 AI

Corretor de redações do ENEM com IA: o aluno digita ou envia (PDF/DOCX/TXT) uma redação dissertativo-argumentativa e recebe, em segundos, nota por competência (0-1000), erros marcados no texto, versão reescrita em padrão nota 1000 e um plano de ação pedagógico — tudo ancorado na matriz oficial de correção do INEP.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS 4**
- **Zod** para validação estrutural da resposta da IA
- **Gemini** (principal) e **OpenAI** (fallback) como provedores de correção
- **Supabase** — persistência de redações e de assinaturas (gate de pagamento)
- **Stripe Checkout** — cobrança dos planos de acesso
- **Vitest** para testes automatizados

## Rodando localmente

Requer **Node.js ≥ 20.16 (ou ≥ 22.3)** — versão mínima exigida pelo `pdf-parse`/`pdfjs-dist` usados na extração de PDF (ver `.nvmrc`).

```bash
nvm use
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Configure `.env.local` a partir de `.env.example`:

| Variável | Necessária para |
|---|---|
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | Correção funcionar de verdade — sem nenhuma, `/api/corrigir` retorna erro explícito em vez de inventar uma nota |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Persistência real de redações e leitura de assinatura ativa |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook do Stripe gravar assinaturas (nunca expor esta chave ao cliente) |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Criar sessões de checkout |
| `STRIPE_WEBHOOK_SECRET` | Verificar a assinatura dos eventos do Stripe |

Depois de configurar as chaves do Supabase, rode `supabase/schema-auth-migration.sql` no SQL Editor do projeto (substitui os schemas antigos baseados em `device_id` por tabelas ligadas a `auth.users`; apaga qualquer dado de teste anterior). Depois de configurar a chave secreta do Stripe, rode `npm run stripe:setup` para criar os produtos/preços dos 3 planos (idempotente — roda de novo sem duplicar) e colar os Price IDs gerados em `src/lib/planos.ts`.

Para habilitar login com Google, crie um OAuth Client ID no [Google Cloud Console](https://console.cloud.google.com/apis/credentials) e cole o Client ID/Secret em Supabase Dashboard → Authentication → Providers → Google. O redirect URI a cadastrar no Google é `https://<seu-projeto>.supabase.co/auth/v1/callback`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` / `npm run start` | Build e execução em produção |
| `npm run lint` | ESLint |
| `npm run test` | Roda a suíte de testes (Vitest) uma vez |
| `npm run test:watch` | Roda os testes em modo watch |
| `npm run calibrar` | Harness de calibração: mede acurácia/consistência do corretor contra redações com nota oficial conhecida — faz chamadas reais e pagas à API |
| `npm run auditoria:vies` | Roda o corpus de auditoria de viés (regionalismo lexical, repertório de fachada) contra o modelo real — faz chamadas reais à API |
| `npm run stripe:setup` | Cria (idempotente) os produtos/preços do Stripe usados em `/vendas` |

## Arquitetura da correção

A lógica de correção fica em `src/lib/`:

- **`openai.ts`** — chama o(s) provedor(es) de IA. `corrigirRedacaoComDuplaCorrecao` (usada em produção) faz duas correções independentes em paralelo e reconcilia pela média — se divergirem mais de 100 pontos, uma terceira correção arbitra, no mesmo espírito do protocolo de dois corretores do ENEM.
- **`correcao-schema.ts`** — schema Zod e regras de consistência da resposta da IA: soma das competências bate com a nota geral, cada competência declara "habilidades" estruturadas (não só texto livre) com trava nas faixas inequívocas, teto de nota em texto sem parágrafos (monobloco), e regra de anulação total (fuga de tema, tipo textual incorreto, texto curto, cópia dos motivadores).
- **`reconciliacao.ts`** — lógica de média/arbitragem entre múltiplas correções.
- **`prompt-agente.ts`** — o system prompt com a matriz oficial do INEP.
- **`observabilidade.ts`** — log estruturado (JSON de uma linha por evento) de cada tentativa de correção: provedor, sucesso, duração, motivo de falha e, ao final, nota geral/divergência/reconciliação — sem depender de serviço externo, já capturável via stdout em qualquer host.
- **`rate-limit.ts`** — limitador em memória por IP, usado em `/api/corrigir` (5 req/10min, teto de 8000 caracteres) e `/api/upload` (15 req/10min, teto de 10MB).
- **`calibracao/`** e **`scripts/calibrar.ts`** — conjunto de redações com nota oficial conhecida, usado para medir acurácia real do corretor.
- **`auditoria/`** e **`scripts/auditoria-vies.ts`** — corpus e runner para testar se o corretor penaliza vocabulário regional legítimo ou infla nota por citação de repertório sem integração real ao argumento.

A extração de texto de PDF (`src/app/api/upload/route.ts`) usa `pdf-parse` (que embarca `pdfjs-dist`) — por isso a exigência de Node ≥ 20.16/22.3 acima e `serverExternalPackages: ["pdf-parse"]` em `next.config.ts`. PDFs sem texto selecionável (foto/scan) caem em OCR via visão do Gemini antes de retornar erro.

Testes em `tests/`: `correcao-schema.test.ts` e `reconciliacao.test.ts` cobrem as regras de negócio isoladamente (sem chamar API); `regressao.test.ts` trava casos reais já verificados manualmente contra a matriz do ENEM; `storage.test.ts`, `assinatura.test.ts`, `rate-limit.test.ts` e as rotas de API têm o Supabase/Stripe mockados — nenhum teste automatizado faz chamada de rede real.

## Autenticação, persistência & cobrança

Login real via Supabase Auth (`src/lib/auth.ts`, `src/contexts/AuthContext.tsx`): e-mail/senha ou Google OAuth. Tanto o histórico de redações quanto o acesso pago são ancorados no `user_id` da sessão autenticada (RLS no Postgres restringe cada linha ao próprio dono via `auth.uid() = user_id`). Fluxo de compra: `/vendas` exige login antes de checkout → `/api/checkout` valida o token da sessão e cria uma sessão do Stripe Checkout com `user_id` em `client_reference_id`/`metadata` → após pagamento, o webhook (`/api/stripe/webhook`) marca a assinatura como ativa no Supabase para aquele `user_id` (com verificação síncrona de reforço em `/api/checkout/verificar`, chamada pelo redirect de sucesso) → páginas do avaliador (`/nova-redacao`, `/dashboard`, `/historico`, `/correcao/[id]`) checam login + assinatura ativa via `RequerAssinatura` antes de renderizar, redirecionando para `/auth` (sem login) ou `/vendas` (sem assinatura).

## Limitações conhecidas

- A "conta demo" e a simulação de login foram removidas; toda sessão agora exige Supabase Auth real (e-mail/senha ou Google).
- A calibração de acurácia (`npm run calibrar`) só tem gabarito oficial para redações nota 1000 (teto); falta corpus de nota mediana/baixa avaliado por corretor humano.
- Rate limiting em memória — não é compartilhado entre instâncias serverless frias.
- Sem LGPD: nenhum documento de privacidade/termos/consentimento parental existe ainda.

Mais contexto de arquitetura e decisões em `Vault/`.
