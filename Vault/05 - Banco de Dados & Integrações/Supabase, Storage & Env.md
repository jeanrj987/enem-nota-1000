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
> O sistema está preparado para operar em modo híbrido: persistência remota no **Supabase (PostgreSQL + RLS + Auth + Storage)** e persistência local no navegador via **LocalStorage** (`src/lib/storage.ts`) para operação offline/demo rápida.

---

## 🗃️ Schema de Tabelas no Supabase

```sql
-- Tabela de Usuários (Integrada ao Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  nome TEXT,
  plano TEXT DEFAULT 'gratuito',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Redações
CREATE TABLE public.redacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tema TEXT NOT NULL,
  texto TEXT NOT NULL,
  palavras_count INTEGER NOT NULL,
  linhas_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Correções
CREATE TABLE public.correcoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  redacao_id UUID REFERENCES public.redacoes(id) ON DELETE CASCADE,
  nota_geral INTEGER NOT NULL,
  competencias JSONB NOT NULL,
  erros JSONB NOT NULL,
  versao_reescrita TEXT NOT NULL,
  feedback_pedagogico TEXT NOT NULL,
  pontos_positivos JSONB,
  proximos_passos JSONB,
  tempo_analise_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔐 Variáveis de Ambiente (`.env.local`)

| Variável | Obrigatória? | Descrição |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Recomendada | Chave da API do Google Gemini (utiliza modelo `gemini-3.6-flash`). |
| `OPENAI_API_KEY` | Opcional (Fallback) | Chave da OpenAI para o modelo `gpt-4o-mini`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Opcional (Auth/Sync) | URL do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Opcional (Auth/Sync) | Chave anônima pública do Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Opcional (Backend) | Chave com privilégios de serviço para operações de administração. |

---

## 💾 Camada LocalStorage (`src/lib/storage.ts`)
Caso as credenciais do Supabase não estejam conectadas, a aplicação executa automaticamente via LocalStorage, salvando o histórico de redações, calculando médias gerais, evolução percentual e alimentando o painel do estudante e os gráficos de evolução sem travar a experiência do usuário.

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem|Tipos TypeScript e Schemas]]
- [[03 - Inteligência Artificial/Arquitetura de IA & Prompts|Uso das Chaves de IA no Backend]]
- [[00 - Índice Principal|Retornar ao Índice Principal]]
