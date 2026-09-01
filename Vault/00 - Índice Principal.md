---
title: Índice Principal — NOTA 1000 PRO
tags:
  - moc
  - index
  - arquitetura
  - enem
  - documentacao
  - obsidian
updated: 2026-09-01
---

# 📚 Índice Principal — Base de Conhecimento Obsidian (NOTA 1000 PRO)

> [!tip] **Fonte Única da Verdade & Memória Permanente**
> Este cofre (*Vault*) contém toda a documentação arquitetural, técnica, de segurança, pedagógica e de negócio do projeto **NOTA 1000 PRO** (Avaliador Oficial de Redações do ENEM). Todas as funcionalidades, contratos e decisões estão registrados aqui.

---

## 🗺️ Mapa de Conteúdo (MOC)

### 📌 00. Governança & Manutenção
- [[00 - Regras de Manutenção do Vault|Regras de Manutenção & Atualização Contínua do Vault]]
- [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog|Decisões de Arquitetura (ADRs) & Changelog]]

### 🎯 01. Visão Geral, Persona & Negócio
- [[01 - Visão Geral & Negócio/Visão do Produto|Visão Geral do Produto & Proposta de Valor]]
- [[01 - Visão Geral & Negócio/Persona & Dores dos Vestibulandos|Persona, Dores Críticas & Psicologia do Vestibulando]]
- [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting|Estratégia de Vendas, Copywriting, Planos & Bônus]]

### ✍️ 02. Metodologia de Correção Oficial (INEP / ENEM)
- [[02 - Metodologia ENEM/Matriz Oficial do INEP|Matriz Oficial do INEP — As 5 Competências & Faixas de Nota]]
- [[02 - Metodologia ENEM/Competências Detalhadas C1 a C5|Detalhamento Profundo de C1, C2, C3, C4 e C5 (Intervenção)]]

### 🤖 03. Engenharia de Prompt & Inteligência Artificial
- [[03 - Inteligência Artificial/Arquitetura de IA & Prompts|Arquitetura de IA, Prompts de Sistema, Modelos & JSON Estruturado]]

### 💻 04. Arquitetura Técnica & Frontend
- [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas|Stack Tecnológica, Estrutura de Diretórios & Mapeamento de Rotas]]
- [[04 - Arquitetura Técnica/Segurança & Blindagem Server-Side|Segurança & Blindagem Server-Side (Zero-Leak Anti-DevTools)]]
- [[04 - Arquitetura Técnica/Componentes & Design System|Design System, Componentes Reutilizáveis (Folha 30L, SISU, PIX, Streak)]]
- [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem|Rotas de API (/api/corrigir, /api/desbloquear, /api/upload) & Tipos TypeScript]]

### 🗄️ 05. Banco de Dados, Armazenamento & Variáveis
- [[05 - Banco de Dados & Integrações/Supabase, Storage & Env|Estrutura de Armazenamento Local & Schema SQL Completo para Migração Online]]

---

## ⚡ Acesso Rápido às Rotas do Projeto

| Rota | Descrição | Nota Relacionada |
| :--- | :--- | :--- |
| `/` | Landing Page Institucional com Simulador SISU e Checkout PIX | [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas]] |
| `/nova-redacao` | Estúdio de Redação (Folha 30 Linhas, Detector C4 e Auto-Save) | [[04 - Arquitetura Técnica/Componentes & Design System]] |
| `/correcao/[id]` | Laudo Anatômico Oficial, Simulador SISU e Reescrita Nota 1000 | [[04 - Arquitetura Técnica/Componentes & Design System]] |
| `/dashboard` | Painel do Estudante, Conquistas/Gamificação e Streak | [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas]] |
| `/historico` | Gráficos de Evolução Temporal e Radar C1–C5 | [[04 - Arquitetura Técnica/Componentes & Design System]] |
| `/auth` | Autenticação do Usuário e Botão de Teste 100% PRO | [[04 - Arquitetura Técnica/Segurança & Blindagem Server-Side]] |

---

## 🏷️ Tags Principais
#enem #nextjs #seguranca #server-side #matriz-inep #simulador-sisu #pix #typescript #obsidian #corretor-redacao
