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
> Todos os contratos de dados trafegados entre o Frontend, as API Routes e o motor de IA estão centralizados em `src/types/index.ts` e `src/lib/storage.ts`.

---

## 🧬 Principais Interfaces TypeScript (`src/types/index.ts`)

```typescript
export type CompetenciaNumero = 1 | 2 | 3 | 4 | 5;

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
  tipo: 'gramatica' | 'pontuacao' | 'ortografia' | 'coesao' | 'vocabulario' | 'regencia' | 'concordancia' | 'argumentacao' | 'proposta_intervencao' | 'outro';
  correcao: string;
  explicacao: string;
  competencia_relacionada: CompetenciaNumero;
}

export interface Correcao {
  id: string;
  redacao_id: string;
  nota_geral: number; // 0 a 1000 (0 quando sanitizado no plano grátis)
  competencias: Competencia[];
  erros: ErroIdentificado[];
  versao_reescrita: string;
  feedback_pedagogico: string;
  pontos_positivos: string[];
  proximos_passos: string[];
  is_redacted?: boolean;
  created_at: string;
}

export interface Redacao {
  id: string;
  titulo: string;
  tema: string;
  texto: string;
  palavras_count: number;
  linhas_count: number;
  status: 'pendente' | 'corrigindo' | 'corrigida' | 'erro';
  created_at: string;
  correcao?: Correcao;
}

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  plano: 'gratis' | 'pro' | 'medicina';
  created_at: string;
}

export interface RascunhoRedacao {
  tema: string;
  titulo: string;
  texto: string;
  updated_at: string;
}

export interface CursoSisu {
  id: string;
  curso: string;
  universidade: string;
  corte_geral: number;
  corte_redacao_recomendado: number;
  peso_redacao: number;
  dificuldade: 'Alta' | 'Média' | 'Muito Alta';
}
```

---

## 📡 Endpoints de API Serverless

### 1. `POST /api/corrigir`
- **Função**: Recebe o texto e tema da redação. Avalia anatomicamente e aplica a sanitização de segurança caso o usuário pertença ao plano `'gratis'`.
- **Payload**:
  ```json
  {
    "texto": "Texto da redação...",
    "tema": "Tema oficial...",
    "titulo": "Título opcional...",
    "plano": "gratis" // ou "pro"
  }
  ```

### 2. `POST /api/desbloquear`
- **Função**: Executado após o checkout ou confirmação de pagamento para liberar o laudo completo sem nenhuma ofuscação.
- **Payload**:
  ```json
  {
    "texto": "Texto da redação...",
    "tema": "Tema oficial...",
    "titulo": "Título..."
  }
  ```

### 3. `POST /api/upload`
- **Função**: Processa uploads de arquivos multipart/form-data nos formatos `.txt`, `.docx` (via `mammoth`), `.pdf` e imagens de redações manuscritas (OCR).

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/Segurança & Blindagem Server-Side|Segurança & Blindagem Server-Side (Zero-Leak)]]
- [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas|Estrutura de Rotas]]
- [[05 - Banco de Dados & Integrações/Supabase, Storage & Env|Persistência e Migração de Dados]]
