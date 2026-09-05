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

Depois de configurar as chaves do Supabase, rode os schemas no SQL Editor do projeto, nesta ordem: `supabase/schema.sql` e `supabase/schema-assinaturas.sql`. Depois de configurar a chave secreta do Stripe, rode `npm run stripe:setup` para criar os produtos/preços dos 3 planos (idempotente — roda de novo sem duplicar) e colar os Price IDs gerados em `src/lib/planos.ts`.

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

## Persistência & cobrança

Sem autenticação real implementada ainda (login continua simulado), tanto o histórico de redações quanto o acesso pago são ancorados num `device_id` anônimo gerado no navegador (`src/lib/device-id.ts`). Fluxo de compra: `/vendas` → `/api/checkout` cria uma sessão do Stripe Checkout → após pagamento, o webhook (`/api/stripe/webhook`) marca a assinatura como ativa no Supabase para aquele `device_id` → páginas do avaliador (`/nova-redacao`, `/dashboard`, `/historico`, `/correcao/[id]`) checam acesso ativo via `RequerAssinatura` antes de renderizar, redirecionando para `/vendas` senão.

## Limitações conhecidas

- Sem autenticação real — o gate de acesso pago usa `device_id` de navegador, não conta de usuário; trocar de navegador/limpar dados perde o vínculo com a assinatura.
- A calibração de acurácia (`npm run calibrar`) só tem gabarito oficial para redações nota 1000 (teto); falta corpus de nota mediana/baixa avaliado por corretor humano.
- Rate limiting em memória — não é compartilhado entre instâncias serverless frias.
- Sem LGPD: nenhum documento de privacidade/termos/consentimento parental existe ainda.

Mais contexto de arquitetura e decisões em `Vault/`.
