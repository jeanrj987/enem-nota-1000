---
title: APIs, Modelos de Dados & Tipagem TypeScript
tags:
  - api
  - typescript
  - interfaces
  - backend
  - endpoints
updated: 2026-09-01
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

export interface Competencia {
  numero: CompetenciaNumero;
  nome: string;
  descricao_curta: string;
  nota: number; // 0, 40, 80, 120, 160, 200
  nivel: number; // 0 a 5
  comentario: string;
  pontos_fortes?: string[];
  pontos_melhoria?: string[];
}

export interface ErroIdentificado {
  id: string;
  trecho: string;
  tipo: TipoErro;
  correcao: string;
  explicacao: string;
  competencia_relacionada: CompetenciaNumero;
}

export interface Correcao {
  id: string;
  redacao_id: string;
  nota_geral: number; // 0 a 1000
  competencias: Competencia[];
  erros: ErroIdentificado[];
  versao_reescrita: string;
  feedback_pedagogico: string;
  pontos_positivos: string[];
  proximos_passos: string[];
  tempo_analise_ms?: number;
  created_at: string;
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
- **Função**: Recebe o texto e tema da redação e invoca o motor de IA (`corrigirRedacaoComIA` em `src/lib/openai.ts`).
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
- **Função**: Processa uploads de arquivos multipart/form-data nos formatos `.txt`, `.docx` (via `mammoth`) e `.pdf` (via stream parsing).
- **Resposta**:
  ```json
  {
    "success": true,
    "text": "Texto extraído do documento...",
    "fileName": "minha_redacao.docx",
    "fileSize": 18450
  }
  ```

---

## 🔗 Links Relacionados
- [[03 - Inteligência Artificial/Arquitetura de IA & Prompts|Chamada de IA e System Prompt]]
- [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas|Estrutura de Rotas]]
- [[05 - Banco de Dados & Integrações/Supabase, Storage & Env|Persistência no Supabase]]
