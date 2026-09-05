---
title: Índice Principal — Nota 1000 AI
tags:
  - moc
  - index
  - arquitetura
  - enem
  - documentacao
updated: 2026-09-05 (checkout Stripe + gate de acesso pago)
---

# 📚 Índice Principal — Base de Conhecimento Obsidian (Nota 1000 AI)

> [!tip] **Fonte Única da Verdade**
> Este cofre (*Vault*) contém toda a documentação arquitetural, de negócio, pedagógica e técnica do projeto **Nota 1000 AI** (Avaliador e Corretor de Redações do ENEM). Toda nova funcionalidade, alteração técnica ou decisão de produto deve ser registrada e referenciada aqui.

---

## 🗺️ Mapa de Conteúdo (MOC)

### 📌 00. Governança & Manutenção
- [[00 - Regras de Manutenção do Vault|Regras de Manutenção & Atualização Contínua do Vault]]
- [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog|Decisões de Arquitetura (ADRs) & Changelog]]

### 🎯 01. Visão Geral, Persona & Negócio
- [[01 - Visão Geral & Negócio/Visão do Produto|Visão Geral do Produto & Proposta de Valor]]
- [[01 - Visão Geral & Negócio/Persona & Dores dos Vestibulandos|Persona, Dores Críticas & Psicologia do Vestibulando]]
- [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting|Estratégia de Vendas, Copywriting da Rota /vendas, Planos & Bônus]]

### ✍️ 02. Metodologia de Correção Oficial (INEP / ENEM)
- [[02 - Metodologia ENEM/Matriz Oficial do INEP|Matriz Oficial do INEP — As 5 Competências & Faixas de Nota]]
- [[02 - Metodologia ENEM/Competências Detalhadas C1 a C5|Detalhamento Profundo de C1, C2, C3, C4 e C5 (Intervenção)]]
- [[02 - Metodologia ENEM/Auditoria de Viés|Auditoria de Viés do Corretor — Regionalismo & Repertório de Fachada]]

### 🤖 03. Engenharia de Prompt & Inteligência Artificial
- [[03 - Inteligência Artificial/Arquitetura de IA & Prompts|Arquitetura de IA, Prompts de Sistema, Modelos (Gemini / GPT-4o-mini) & JSON Estruturado]]

### 💻 04. Arquitetura Técnica & Frontend
- [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas|Stack Tecnológica, Estrutura de Diretórios & Mapeamento de Rotas]]
- [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem|Rotas de API (/api/corrigir, /api/upload) & Tipos TypeScript]]
- [[04 - Arquitetura Técnica/Componentes & Design System|Design System, Componentes Reutilizáveis & Glassmorphism]]

### 🗄️ 05. Banco de Dados, Armazenamento & Variáveis
- [[05 - Banco de Dados & Integrações/Supabase, Storage & Env|Supabase (PostgreSQL), Storage, LocalStorage & Variáveis de Ambiente]]

---

## ⚡ Acesso Rápido a Rotas do Projeto

| Rota | Descrição | Nota Relacionada |
| :--- | :--- | :--- |
| `/` | Landing Page Institucional | [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas]] |
| `/vendas` | Página de Vendas de Alta Conversão | [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting]] |
| `/nova-redacao` | Editor Inteligente de Redação & Upload | [[04 - Arquitetura Técnica/Componentes & Design System]] |
| `/correcao/[id]` | Diagnóstico Linha a Linha & Versão 1000 | [[04 - Arquitetura Técnica/Componentes & Design System]] |
| `/dashboard` | Painel do Aluno & Gestão de Redações | [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas]] |
| `/historico` | Gráficos de Evolução & Radar C1-C5 | [[04 - Arquitetura Técnica/Componentes & Design System]] |
| `/auth` | Autenticação do Usuário | [[05 - Banco de Dados & Integrações/Supabase, Storage & Env]] |
| `/checkout/sucesso` | Confirmação pós-pagamento do Stripe | [[05 - Banco de Dados & Integrações/Supabase, Storage & Env]] |

---

## 🏷️ Tags Principais
#enem #nextjs #ia #prompt-engineering #marketing #supabase #typescript #corretor-redacao #vendas
