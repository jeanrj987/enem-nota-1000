---
title: Decisões de Arquitetura (ADRs) & Changelog
tags:
  - changelog
  - adr
  - decisoes
  - historico
updated: 2026-09-01
---

# 🏛️ Decisões de Arquitetura (ADRs) & Changelog

> [!info] **Histórico Evolutivo do Projeto**
> Registro cronológico de todas as decisões arquiteturais tomadas e das principais funcionalidades desenvolvidas no projeto.

---

## 📜 Registros de Decisão de Arquitetura (ADRs)

### ADR 001: Fallback Híbrido de Inteligência Artificial
- **Status**: Aprovado e Implementado
- **Contexto**: A indisponibilidade momentânea ou limite de quota de uma única LLM causaria interrupção na correção do aluno.
- **Decisão**: Configurado encadeamento inteligente em `src/lib/openai.ts`: Google Gemini Flash $\rightarrow$ OpenAI gpt-4o-mini $\rightarrow$ Motor Heurístico Offline.
- **Impacto**: Disponibilidade de 100% para o usuário, com custo de inferência ultrabaixo.

### ADR 002: Parsing de PDF, Imagens (OCR) e DOCX
- **Status**: Aprovado e Implementado
- **Contexto**: Alunos enviam redações manuscritas ou digitadas em múltiplos formatos.
- **Decisão**: Implementado `mammoth` para `.docx`, parser de streams para `.pdf` e OCR em `src/app/api/upload/route.ts`.

### ADR 003: Centralização da Memória do Projeto no Obsidian (`Vault/`)
- **Status**: Aprovado e Implementado
- **Contexto**: Necessidade de manter toda a documentação, padrões e conhecimento do projeto centralizados para fácil consulta humana e por agentes de IA.
- **Decisão**: Toda nova funcionalidade, alteração e regra deve ser refletida nas notas do diretório `Vault/` com sintaxe Obsidian.

### ADR 004: Blindagem de Segurança Server-Side (Zero-Leak)
- **Status**: Aprovado e Implementado
- **Contexto**: Em SaaS tradicionais com máscaras de CSS (`blur`/`hidden`), usuários utilizavam o DevTools (F12) ou a aba Network para visualizar a nota sem assinar o plano.
- **Decisão**: O endpoint `/api/corrigir` sanitiza ativamente a resposta no servidor para contas gratuitas (retornando nota 0 e reescrita protegida). Apenas após autenticação/desbloqueio em `/api/desbloquear` os dados integrais são transmitidos.

### ADR 005: Modo Folha Pautada Oficial (30 Linhas) & Detector de Repetições C4
- **Status**: Aprovado e Implementado
- **Contexto**: O aluno precisa treinar a ocupação visual real do espaço da folha do ENEM e evitar penalidades severas na Competência 4 por repetição lexical.
- **Decisão**: Adicionado no `Editor.tsx` alternador para 30 linhas numeradas e escaneador em tempo real de palavras repetidas $>3$ vezes com sugestões de sinônimos.

### ADR 006: Simulador de Aprovação SISU / Medicina & Checkout PIX
- **Status**: Aprovado e Implementado
- **Contexto**: Proporcionar clareza imediata de como a nota de redação impacta a vaga no curso desejado e converter usuários com checkout instantâneo nacional.
- **Decisão**: Criação do `SimuladorSisu.tsx` com cortes oficiais de universidades públicas e modal `CheckoutModal.tsx` com geração dinâmica de chave PIX Copia e Cola e QR Code.

---

## 📋 Changelog do Projeto

### [v1.2.0] - 2026-09-01
- **Adicionado**: [[04 - Arquitetura Técnica/Segurança & Blindagem Server-Side|Blindagem de Segurança Server-Side (Zero-Leak)]] anti-DevTools.
- **Adicionado**: Modo Folha Pautada Oficial (30 Linhas) com numeração lateral no Estúdio de Redação.
- **Adicionado**: Detector de Repetições Viciosas em Tempo Real (C4) com substituição de sinônimos em 1 clique.
- **Adicionado**: Auto-Save contínuo de rascunhos no navegador com indicador de hora.
- **Adicionado**: Simulador Oficial de Aprovação SISU / Medicina integrado ao laudo e ao dashboard.
- **Adicionado**: Checkout Dinâmico via PIX com QR Code e Copia e Cola.
- **Adicionado**: Barra de Urgência com contagem regressiva para o ENEM 2026.
- **Adicionado**: Prova Social dinâmica em tempo real (Toasts de atividade de alunos).
- **Adicionado**: Contador de Sequência de Treinos (Streak 🔥) e Conquistas do Estudante.
- **Adicionado**: Botão de alternância rápida de 1 clique para Modo PRO (100% Liberado) para testes.
- **Refatorado**: Navbar responsiva e compacta com zero cortes ou overflow.

### [v1.1.0] - 2026-09-01
- **Adicionado**: Estrutura e Governança do Obsidian Vault (`Vault/`).
- **Adicionado**: Skill `engineering-senior-developer` para desenvolvimento sênior contínuo.

### [v1.0.0] - 2026-08-31
- **Lançamento Inicial**: Plataforma completa de correção de redações com IA e matriz INEP (C1 a C5).

---

## 🔗 Links Relacionados
- [[00 - Regras de Manutenção do Vault|Regras de Manutenção do Vault]]
- [[00 - Índice Principal|Retornar ao Índice Principal]]
