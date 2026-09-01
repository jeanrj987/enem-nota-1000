---
title: Supabase, Storage & Variáveis de Ambiente
tags:
  - supabase
  - postgresql
  - storage
  - env
  - seguranca
updated: 2026-09-01
---

# 🗄️ Supabase, Storage & Variáveis de Ambiente

> [!info] **Camada de Persistência & Configurações**
> O sistema opera em modo autônomo e resiliente via **LocalStorage** (`src/lib/storage.ts`) para testes locais e desenvolvimento rápido, e possui esquema pronto para migração para **PostgreSQL / Supabase / Firebase**.

---

## 💾 1. Chaves Ativas do Armazenamento Local (`localStorage`)

| Chave | Tipo de Dado | Função |
| :--- | :--- | :--- |
| `enem_ai_redacoes_v3` | `Redacao[]` (JSON) | Histórico de todas as redações criadas e seus laudos de correção. |
| `enem_usuario_sessao_v1` | `UsuarioSessao` (JSON) | Sessão do aluno ativo (`id`, `nome`, `email`, `plano: 'gratis' \| 'pro'`). |
| `enem_rascunho_temp_v1` | `RascunhoRedacao` (JSON) | Auto-save contínuo do estúdio de redação. |

---

## 🗃️ 2. Schema SQL Completo para Migração Online (PostgreSQL / Supabase)

```sql
-- Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários & Assinaturas
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  plano VARCHAR(50) DEFAULT 'gratis', -- 'gratis', 'pro', 'medicina'
  streak_dias INTEGER DEFAULT 0,
  ultimo_treino DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Redações
CREATE TABLE public.redacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(255),
  tema TEXT NOT NULL,
  texto TEXT NOT NULL,
  palavras_count INTEGER NOT NULL,
  linhas_count INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- 'pendente', 'corrigida', 'erro'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Pareceres Anatômicos (Correções)
CREATE TABLE public.correcoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  redacao_id UUID UNIQUE REFERENCES public.redacoes(id) ON DELETE CASCADE,
  nota_geral INTEGER NOT NULL, -- 0 a 1000
  c1 INTEGER NOT NULL,
  c2 INTEGER NOT NULL,
  c3 INTEGER NOT NULL,
  c4 INTEGER NOT NULL,
  c5 INTEGER NOT NULL,
  competencias JSONB NOT NULL,
  erros JSONB NOT NULL,
  versao_reescrita TEXT NOT NULL,
  feedback_pedagogico TEXT NOT NULL,
  pontos_positivos JSONB,
  proximos_passos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Rascunhos Salvos
CREATE TABLE public.rascunhos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tema TEXT,
  titulo TEXT,
  texto TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de Performance
CREATE INDEX idx_redacoes_usuario ON public.redacoes(usuario_id);
CREATE INDEX idx_correcoes_redacao ON public.correcoes(redacao_id);
```

---

## 🔐 3. Variáveis de Ambiente (`.env.local`)

| Variável | Obrigatória? | Descrição |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Recomendada | Chave da API do Google Gemini. |
| `OPENAI_API_KEY` | Opcional (Fallback) | Chave da OpenAI para o modelo `gpt-4o-mini`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Para Nuvem | URL do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Para Nuvem | Chave anônima pública do Supabase. |

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/Segurança & Blindagem Server-Side|Segurança & Blindagem Server-Side]]
- [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem|Tipos TypeScript e Schemas]]
- [[00 - Índice Principal|Retornar ao Índice Principal]]
