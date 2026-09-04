---
title: Regras de Manutenção do Vault
tags:
  - governanca
  - regras
  - obsidian
  - agentes
updated: 2026-09-01
---

# 🛡️ Regras de Manutenção & Atualização Contínua do Vault

> [!important] **Protocolo Obrigatório para Agentes e Desenvolvedores**
> A pasta `Vault/` é a **Central de Conhecimento e Memória Permanente** deste repositório. Sempre que qualquer informação, dúvida ou implementação for necessária, consulte primeiro este cofre. Sempre que qualquer mudança for feita no código, na arquitetura ou nas regras de negócio, a respectiva documentação no `Vault/` **DEVE ser atualizada imediatamente**.

---

## 📌 1. Princípios de Consulta
1. **Consultar Antes de Agir**: Antes de iniciar uma refatoração, adicionar novas dependências ou criar novas rotas, o agente deve buscar no `Vault/` o padrão já estabelecido (ex: modelos de dados em [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem]], prompt em [[03 - Inteligência Artificial/Arquitetura de IA & Prompts]]).
2. **Respeitar as Decisões Arquiteturais**: Decisões como o fallback Gemini $\rightarrow$ OpenAI $\rightarrow$ heurística offline já estão documentadas em [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog]] e devem ser preservadas.

---

## 📌 2. Princípios de Escrita e Formatação no Obsidian
- **Links Internos Bidirecionais**: Use sempre sintaxe de *wikilinks* `[[Caminho/Nota|Texto Visível]]` para manter o grafo de conhecimento do Obsidian conectado.
- **Frontmatter YAML**: Toda nota deve conter cabeçalho frontmatter com `title`, `tags` e `updated`.
- **Callouts**: Use callouts do Obsidian (`> [!tip]`, `> [!warning]`, `> [!important]`, `> [!info]`, `> [!example]`) para dar ênfase visual à leitura.
- **Tabelas & Blocos de Código**: Use blocos de código com linguagem explícita (`tsx`, `ts`, `json`, `css`) e tabelas comparativas para facilitar o entendimento rápido.

---

## 📌 3. Gatilhos de Atualização Obrigatória
Sempre que ocorrer qualquer uma das seguintes situações, atualize o `Vault/`:

| Acontecimento no Código | O que deve ser atualizado no Vault? |
| :--- | :--- |
| **Nova Rota ou Página Criada** | Atualizar [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas]] e [[00 - Índice Principal]] |
| **Mudança em Prompts ou Lógica de IA** | Atualizar [[03 - Inteligência Artificial/Arquitetura de IA & Prompts]] |
| **Alteração em Tipos TypeScript ou APIs** | Atualizar [[04 - Arquitetura Técnica/APIs, Modelos & Tipagem]] |
| **Novos Planos, Copy ou Preços** | Atualizar [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting]] |
| **Nova Versão / Deploy / Refatoração** | Adicionar entrada no [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog]] |

---

## 📌 4. Estrutura de Diretórios Recomendada no Vault

```text
Vault/
├── 00 - Índice Principal.md
├── 00 - Regras de Manutenção do Vault.md
├── 01 - Visão Geral & Negócio/
│   ├── Visão do Produto.md
│   ├── Persona & Dores dos Vestibulandos.md
│   └── Estratégia de Vendas & Copywriting.md
├── 02 - Metodologia ENEM/
│   ├── Matriz Oficial do INEP.md
│   └── Competências Detalhadas C1 a C5.md
├── 03 - Inteligência Artificial/
│   └── Arquitetura de IA & Prompts.md
├── 04 - Arquitetura Técnica/
│   ├── Stack & Estrutura de Rotas.md
│   ├── Componentes & Design System.md
│   └── APIs, Modelos & Tipagem.md
├── 05 - Banco de Dados & Integrações/
│   └── Supabase, Storage & Env.md
└── 06 - Registro de Decisões/
    └── Decisões de Arquitetura & Changelog.md
```
