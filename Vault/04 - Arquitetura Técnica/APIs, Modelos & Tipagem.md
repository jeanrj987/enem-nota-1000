---
title: APIs, Modelos de Dados & Tipagem TypeScript
tags:
  - api
  - typescript
  - interfaces
  - backend
  - endpoints
updated: 2026-09-05 (correção gratuita com resultado borrado + cadastro obrigatório)
---

# 🔌 APIs, Modelos de Dados & Tipagem TypeScript

> [!tip] **Tipagem Forte e Contratos de API**
> Todos os contratos de dados trafegados entre o Frontend, as API Routes e o motor de IA estão centralizados em `src/types/index.ts`.

---

## 🧬 Principais Interfaces TypeScript (`src/types/index.ts`)

```typescript
export type CompetenciaNumero = 1 | 2 | 3 | 4 | 5;

export type TipoErro =
  | 'gramatica'
  | 'pontuacao'
  | 'ortografia'
  | 'coesao'
  | 'vocabulario'
  | 'regencia'
  | 'concordancia'
  | 'argumentacao'
  | 'proposta_intervencao'
  | 'outro';

// Campos estruturados por competência — booleanos usados para travar
// a nota contra autocontradição da IA (ver validarCorrecaoIA)
export interface HabilidadesC1 {
  ortografia_e_acentuacao: boolean;
  concordancia_e_regencia: boolean;
  pontuacao_adequada: boolean;
  registro_formal_sem_oralidade: boolean;
}
export interface HabilidadesC3 {
  tese_clara: boolean;
  argumentos_bem_selecionados: boolean;
  progressao_logica: boolean;
  conclusao_articulada: boolean;
}
export interface HabilidadesC4 {
  conectivos_interparagrafos: boolean;
  conectivos_intraparagrafos_variados: boolean;
  ausencia_repeticao_excessiva: boolean;
  ausencia_marcadores_orais: boolean;
}
export interface ElementosC5 {
  agente: boolean;
  acao: boolean;
  meio: boolean;
  efeito: boolean;
  detalhamento: boolean;
}

export interface Competencia {
  numero: CompetenciaNumero;
  nome: string;
  descricao_curta: string;
  nota: number; // 0, 40, 80, 120, 160, 200
  nivel: number; // 0 a 5
  comentario: string;
  pontos_fortes?: string[];
  pontos_melhoria?: string[];
  habilidades_c1?: HabilidadesC1;
  habilidades_c3?: HabilidadesC3;
  habilidades_c4?: HabilidadesC4;
  elementos_c5?: ElementosC5;
}

export interface ErroIdentificado {
  id: string;
  trecho: string;
  tipo: TipoErro;
  correcao: string;
  explicacao: string;
  competencia_relacionada: CompetenciaNumero;
}

// Presente só quando a correção final veio de reconciliação de 2-3 tentativas
export interface ReconciliacaoInfo {
  correcaoUnica: boolean;
  divergenciaDeAnulacao?: boolean;
}

export interface Correcao {
  id: string;
  redacao_id: string;
  anulada: boolean;
  motivo_anulacao: string | null;
  nota_geral: number; // 0 a 1000
  competencias: Competencia[];
  erros: ErroIdentificado[];
  versao_reescrita: string;
  feedback_pedagogico: string;
  pontos_positivos: string[];
  proximos_passos: string[];
  tempo_analise_ms?: number;
  created_at: string;
  reconciliacao?: ReconciliacaoInfo;
}

export interface Redacao {
  id: string;
  user_id?: string;
  titulo: string;
  tema: string;
  texto: string;
  palavras_count: number;
  linhas_count: number;
  status: 'pendente' | 'corrigindo' | 'corrigida' | 'erro';
  created_at: string;
  correcao?: Correcao;
}
```

---

## 📡 Endpoints de API Serverless

### 1. `POST /api/corrigir`
- **Função**: Recebe o texto e tema da redação e invoca `corrigirRedacaoComDuplaCorrecao` (`src/lib/openai.ts`) — ver [[03 - Inteligência Artificial/Arquitetura de IA & Prompts|fluxo de dupla correção]].
- **Requer login**: header `Authorization: Bearer <access_token>`, validado via `supabaseAdmin.auth.getUser(token)` (`401` sem token ou token inválido) — checado *depois* do rate limit por IP (um 429 nunca vaza informação sobre se o IP tem ou não sessão válida). A correção em si roda para qualquer usuário logado, **independentemente de assinatura ativa** — o bloqueio de plano acontece na exibição do resultado (`CorrecaoView`), não aqui.
- **Sem chave configurada ou falha total dos provedores**: retorna erro explícito (nunca uma nota fabricada).
- **Limites** (`src/lib/rate-limit.ts`): 5 requisições/IP a cada 10min (`429`), texto máx. 8000 caracteres (`413`).
- **Payload de Requisição**:
  ```json
  {
    "texto": "Texto completo da redação...",
    "tema": "Desafios para a valorização da herança africana no Brasil",
    "titulo": "A urgência da preservação da memória"
  }
  ```
- **Resposta**:
  ```json
  {
    "success": true,
    "correcao": { ...objeto Correcao... }
  }
  ```

### 2. `POST /api/upload`
- **Função**: Processa uploads multipart/form-data: `.txt` (nativo), `.docx` (via `mammoth`), `.pdf` (via `pdf-parse`, só texto selecionável — sem OCR desde o ADR 025; PDF de foto/scan retorna 422 pedindo para colar o texto).
- **Limites**: 15 requisições/usuário a cada 10min (`429`), arquivo máx. **4MB** (`413`) e extensão em `.txt`/`.pdf`/`.docx` (`400`). Os dois últimos vêm de `src/lib/limites-upload.ts`, a mesma fonte que a tela aplica **antes** de enviar.
- ⚠️ **O teto não é arbitrário**: funções serverless na Vercel recusam corpo acima de 4,5MB, e quem responde nesse caso é a plataforma, com HTML, antes de a rota rodar. O valor antigo (10MB) tornava a validação da rota inalcançável justamente na faixa em que mais importava — ver ADR 046.
- **Do lado do cliente**, a resposta é lida com `lerRespostaJson()` (`src/lib/resposta-http.ts`), nunca com `res.json()` direto: quando o corpo não é JSON, o erro que sobe é uma frase deduzida do status, não a mensagem crua do motor JavaScript.
- **Resposta**:
  ```json
  {
    "success": true,
    "text": "Texto extraído do documento...",
    "fileName": "minha_redacao.docx",
    "fileSize": 18450
  }
  ```

### 3. `POST /api/checkout`
- **Função**: Cria uma Stripe Checkout Session para o plano escolhido. Requer header `Authorization: Bearer <access_token>` da sessão Supabase Auth do usuário — validado via `supabaseAdmin.auth.getUser(token)` no servidor (`401` sem token ou com token inválido). Payload: `{ planoId: 'mensal'|'anual'|'semestral' }`. O `user_id` extraído do token vai em `client_reference_id`/`metadata` da sessão. Resposta: `{ url: string }` — o cliente redireciona `window.location.href` para essa URL.
- Sem `STRIPE_SECRET_KEY` configurada: retorna erro explícito (`503`), nunca finge que o pagamento foi processado.

### 4. `POST /api/stripe/webhook`
- **Função**: Recebe eventos do Stripe. Valida a assinatura HMAC do payload (`stripe-signature` + `STRIPE_WEBHOOK_SECRET`) antes de processar qualquer coisa — payload sem assinatura válida é rejeitado com `400`. Em `checkout.session.completed`, extrai `user_id`/`plano_id` de `client_reference_id`/`metadata` e ativa a assinatura via `ativarAssinatura()` (`src/lib/ativar-assinatura.ts`).

### 5. `POST /api/checkout/verificar`
- **Função**: Verificação síncrona chamada por `/checkout/sucesso` no redirect pós-pagamento. Recebe `{ sessionId }`, consulta a Checkout Session direto na API do Stripe e, se `payment_status === 'paid'`, ativa a assinatura pelo mesmo `ativarAssinatura()` do webhook. Existe porque o Stripe não entrega webhooks em `localhost` e como reforço em produção contra webhook atrasado/perdido. Idempotente — chamar de novo para a mesma sessão não duplica nada.

---

## 🔗 Links Relacionados
- [[03 - Inteligência Artificial/Arquitetura de IA & Prompts|Chamada de IA e System Prompt]]
- [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas|Estrutura de Rotas]]
- [[05 - Banco de Dados & Integrações/Supabase, Storage & Env|Persistência no Supabase]]
