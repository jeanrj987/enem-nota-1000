# Nota 1000 AI

Corretor de redações do ENEM com IA: o aluno digita ou envia (PDF/DOCX/TXT) uma redação dissertativo-argumentativa e recebe, em segundos, nota por competência (0-1000), erros marcados no texto, versão reescrita em padrão nota 1000 e um plano de ação pedagógico — tudo ancorado na matriz oficial de correção do INEP.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS 4**
- **Zod** para validação estrutural da resposta da IA
- **Gemini** (principal) e **OpenAI** (fallback) como provedores de correção
- **Vitest** para testes automatizados
- **Supabase** (opcional, ainda não integrado — ver Vault/05)

## Rodando localmente

Requer **Node.js ≥ 20.16 (ou ≥ 22.3)** — versão mínima exigida pelo `pdf-parse`/`pdfjs-dist` usados na extração de PDF (ver `.nvmrc`).

```bash
nvm use
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Configure `.env.local` a partir de `.env.example` com pelo menos uma chave de API (`GEMINI_API_KEY` e/ou `OPENAI_API_KEY`) para a correção funcionar de verdade — sem chave configurada, a rota `/api/corrigir` retorna erro explícito em vez de inventar uma nota.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` / `npm run start` | Build e execução em produção |
| `npm run lint` | ESLint |
| `npm run test` | Roda a suíte de testes (Vitest) uma vez |
| `npm run test:watch` | Roda os testes em modo watch |
| `npm run calibrar` | Harness de calibração (R8): mede acurácia/consistência do corretor contra redações com nota oficial conhecida — faz chamadas reais e pagas à API |

## Arquitetura da correção

A lógica de correção fica em `src/lib/`:

- **`openai.ts`** — chama o(s) provedor(es) de IA. `corrigirRedacaoComDuplaCorrecao` (usada em produção) faz duas correções independentes em paralelo e reconcilia pela média — se divergirem mais de 100 pontos, uma terceira correção arbitra, no mesmo espírito do protocolo de dois corretores do ENEM.
- **`correcao-schema.ts`** — schema Zod e regras de consistência da resposta da IA: soma das competências bate com a nota geral, cada competência declara "habilidades" estruturadas (não só texto livre) com trava nas faixas inequívocas, teto de nota em texto sem parágrafos (monobloco), e regra de anulação total (fuga de tema, tipo textual incorreto, texto curto, cópia dos motivadores).
- **`reconciliacao.ts`** — lógica de média/arbitragem entre múltiplas correções.
- **`prompt-agente.ts`** — o system prompt com a matriz oficial do INEP.
- **`observabilidade.ts`** — log estruturado (JSON de uma linha por evento) de cada tentativa de correção: provedor, sucesso, duração, motivo de falha e, ao final, nota geral/divergência/reconciliação — sem depender de serviço externo, já capturável via stdout em qualquer host.
- **`calibracao/`** e **`scripts/calibrar.ts`** — conjunto de redações com nota oficial conhecida, usado para medir acurácia real do corretor.

A extração de texto de PDF (`src/app/api/upload/route.ts`) usa `pdf-parse` (que embarca `pdfjs-dist`) em vez de um parser caseiro — por isso a exigência de Node ≥ 20.16/22.3 acima e `serverExternalPackages: ["pdf-parse"]` em `next.config.ts`, necessário para o worker do pdfjs ser resolvido corretamente fora do bundle do Turbopack.

Testes em `tests/`: `correcao-schema.test.ts` e `reconciliacao.test.ts` cobrem as regras de negócio isoladamente (sem chamar API), e `regressao.test.ts` trava casos reais já verificados manualmente contra a matriz do ENEM.

## Limitações conhecidas

- Autenticação, cobrança e persistência (Supabase) ainda não estão implementadas — hoje o app roda inteiramente em `localStorage`.
- A calibração de acurácia (`npm run calibrar`) só tem gabarito oficial para redações nota 1000 (teto); falta corpus de nota mediana/baixa avaliado por corretor humano.
- Sem rate limiting nas rotas públicas — não expor `/api/corrigir` a tráfego não controlado sem adicionar isso primeiro.
- Sem OCR: PDFs de redação manuscrita/escaneada (sem texto selecionável) não são suportados — o upload retorna um erro explícito nesse caso, pedindo para colar o texto manualmente.

Mais contexto de arquitetura e decisões em `Vault/`.
