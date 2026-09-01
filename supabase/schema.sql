-- ==============================================================================
-- SCHEMA SQL OFICIAL - CORRETOR DE REDAÇÕES ENEM (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- Execute este script no SQL Editor do seu painel Supabase (https://supabase.com)

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA DE USUÁRIOS (Perfis e Assinaturas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  nome TEXT NOT NULL,
  plano TEXT NOT NULL DEFAULT 'gratis', -- 'gratis', 'pro', 'medicina'
  streak_dias INTEGER DEFAULT 0,
  ultimo_treino DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABELA DE REDAÇÕES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.redacoes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL DEFAULT 'Sem Título',
  tema TEXT NOT NULL,
  texto TEXT NOT NULL,
  palavras_count INTEGER NOT NULL DEFAULT 0,
  linhas_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'corrigindo', 'corrigida', 'erro'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABELA DE CORREÇÕES (Parecer Anatômico & Competências)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.correcoes (
  id TEXT PRIMARY KEY,
  redacao_id TEXT UNIQUE NOT NULL REFERENCES public.redacoes(id) ON DELETE CASCADE,
  nota_geral INTEGER NOT NULL DEFAULT 0, -- 0 a 1000
  c1 INTEGER NOT NULL DEFAULT 0,
  c2 INTEGER NOT NULL DEFAULT 0,
  c3 INTEGER NOT NULL DEFAULT 0,
  c4 INTEGER NOT NULL DEFAULT 0,
  c5 INTEGER NOT NULL DEFAULT 0,
  competencias JSONB NOT NULL DEFAULT '[]'::jsonb,
  erros JSONB NOT NULL DEFAULT '[]'::jsonb,
  versao_reescrita TEXT NOT NULL DEFAULT '',
  feedback_pedagogico TEXT NOT NULL DEFAULT '',
  pontos_positivos JSONB NOT NULL DEFAULT '[]'::jsonb,
  proximos_passos JSONB NOT NULL DEFAULT '[]'::jsonb,
  elementos_proposta_c5 JSONB,
  analise_evolucao JSONB,
  tempo_analise_ms INTEGER DEFAULT 0,
  is_bloqueado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABELA DE RASCUNHOS (Salvamento Automático)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rascunhos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tema TEXT NOT NULL DEFAULT '',
  titulo TEXT NOT NULL DEFAULT '',
  texto TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 6. ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_redacoes_usuario_id ON public.redacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_redacoes_created_at ON public.redacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_correcoes_redacao_id ON public.correcoes(redacao_id);
CREATE INDEX IF NOT EXISTS idx_rascunhos_usuario_id ON public.rascunhos(usuario_id);

-- ==============================================================================
-- 7. POLÍTICAS DE ACESSO (Row Level Security - RLS)
-- ==============================================================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rascunhos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público anônimo (Anon Key) com leitura e gravação
DO $$ 
BEGIN
  -- Usuários
  DROP POLICY IF EXISTS "Permitir leitura pública de usuários" ON public.usuarios;
  CREATE POLICY "Permitir leitura pública de usuários" ON public.usuarios FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Permitir inserção e atualização de usuários" ON public.usuarios;
  CREATE POLICY "Permitir inserção e atualização de usuários" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

  -- Redações
  DROP POLICY IF EXISTS "Permitir leitura pública de redações" ON public.redacoes;
  CREATE POLICY "Permitir leitura pública de redações" ON public.redacoes FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Permitir criação e modificação de redações" ON public.redacoes;
  CREATE POLICY "Permitir criação e modificação de redações" ON public.redacoes FOR ALL USING (true) WITH CHECK (true);

  -- Correções
  DROP POLICY IF EXISTS "Permitir leitura pública de correções" ON public.correcoes;
  CREATE POLICY "Permitir leitura pública de correções" ON public.correcoes FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Permitir criação e modificação de correções" ON public.correcoes;
  CREATE POLICY "Permitir criação e modificação de correções" ON public.correcoes FOR ALL USING (true) WITH CHECK (true);

  -- Rascunhos
  DROP POLICY IF EXISTS "Permitir gerenciamento de rascunhos" ON public.rascunhos;
  CREATE POLICY "Permitir gerenciamento de rascunhos" ON public.rascunhos FOR ALL USING (true) WITH CHECK (true);
END $$;

-- Conceder permissões para roles do Supabase
GRANT ALL ON TABLE public.usuarios TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.redacoes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.correcoes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.rascunhos TO anon, authenticated, service_role;
