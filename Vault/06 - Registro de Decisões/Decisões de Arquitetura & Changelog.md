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
- **Decisão**: Configurado encadeamento inteligente em `src/lib/openai.ts`: Google Gemini 3.6 Flash (com até 3 retries e backoff exponencial) $\rightarrow$ OpenAI gpt-4o-mini $\rightarrow$ Motor Heurístico Offline.
- **Impacto**: Disponibilidade de 100% para o usuário, com custo de inferência ultrabaixo.

### ADR 002: Parsing de PDF e DOCX em Runtime Serverless
- **Status**: Aprovado e Implementado
- **Contexto**: Bibliotecas nativas de C++ para extração de PDF frequentemente quebram em ambientes serverless da Vercel.
- **Decisão**: Implementado `mammoth` para `.docx` e parser de streams de texto com fallback de caracteres para `.pdf` dentro de `src/app/api/upload/route.ts`.

### ADR 003: Criação de Página de Vendas Separada com Foco na Dor e Urgência
- **Status**: Aprovado e Implementado
- **Contexto**: O produto precisava de uma via de conversão direta com apelo psicológico forte para vestibulandos que sofrem com o tempo curto até o ENEM e com a lentidão dos cursinhos tradicionais.
- **Decisão**: Criação da rota `/vendas` contendo 12 blocos de persuasão, termômetro interativo de risco, cronômetro regressivo em tempo real, bônus de lançamento e barra flutuante `SalesStickyBar`.

### ADR 004: Centralização da Memória do Projeto no Obsidian (`Vault/`)
- **Status**: Aprovado e Implementado
- **Contexto**: Necessidade de manter toda a documentação, padrões e conhecimento do projeto centralizados para fácil consulta humana e por agentes de IA.
- **Decisão**: Toda nova funcionalidade, alteração e regra deve ser refletida nas notas do diretório `Vault/` com sintaxe Obsidian.

---

## 📋 Changelog do Projeto

### [v1.1.0] - 2026-09-01
- **Adicionado**: Skill `engineering-senior-developer` em `.agents/skills/engineering-senior-developer/SKILL.md` e regra contínua em `.agents/rules/engineering-senior-developer.md` para operação ininterrupta com padrões sênior de engenharia de software e arquitetura.
- **Adicionado**: Skill `caveman` em `.agents/skills/caveman/SKILL.md` para modo de comunicação ultra-conciso e economia de tokens.
- **Adicionado**: Central de Conhecimento e Documentação Completa no Obsidian (`Vault/`).
- **Adicionado**: Página de Vendas de Alta Conversão (`/vendas`) com copywriting focado na dor, urgência e escassez.
- **Adicionado**: Componente flutuante `SalesStickyBar` com cronômetro regressivo e CTA rápido.
- **Adicionado**: Quiz / Termômetro interativo de risco no SISU.
- **Melhorado**: Navbar e Footer com links destacados para a oferta especial.

### [v1.0.0] - 2026-08-31
- **Lançamento Inicial**: Plataforma completa de correção de redações com IA.
- **Implementado**: Matriz Oficial do INEP (C1 a C5) com notas de 0 a 1000.
- **Implementado**: Editor de texto, upload de PDF/DOCX/TXT e exportação de relatórios em PDF.
- **Implementado**: Gráficos de evolução temporal e gráfico de radar de competências via Recharts.
- **Implementado**: Fallback em cascata Gemini Flash $\rightarrow$ GPT-4o-mini $\rightarrow$ Heurística offline.

---

## 🔗 Links Relacionados
- [[00 - Regras de Manutenção do Vault|Regras de Manutenção do Vault]]
- [[00 - Índice Principal|Retornar ao Índice Principal]]
