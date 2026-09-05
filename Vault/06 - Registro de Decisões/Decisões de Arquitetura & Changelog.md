---
title: Decisões de Arquitetura (ADRs) & Changelog
tags:
  - changelog
  - adr
  - decisoes
  - historico
updated: 2026-09-05
---

# 🏛️ Decisões de Arquitetura (ADRs) & Changelog

> [!info] **Histórico Evolutivo do Projeto**
> Registro cronológico de todas as decisões arquiteturais tomadas e das principais funcionalidades desenvolvidas no projeto.

---

## 📜 Registros de Decisão de Arquitetura (ADRs)

### ADR 001: Fallback Híbrido de Inteligência Artificial
- **Status**: ⚠️ Superado parcialmente pelo ADR 005 (heurística offline removida)
- **Contexto**: A indisponibilidade momentânea ou limite de quota de uma única LLM causaria interrupção na correção do aluno.
- **Decisão original**: Gemini 3.6 Flash (3 retries, backoff exponencial) $\rightarrow$ OpenAI gpt-4o-mini $\rightarrow$ Motor Heurístico Offline.
- **Impacto**: Disponibilidade de 100%, mas ao custo de notas fabricadas quando ambos os provedores falhavam — corrigido pelo ADR 005.

### ADR 002: Parsing de PDF e DOCX em Runtime Serverless
- **Status**: ⚠️ Superado pelo ADR 007 (parser de PDF substituído)
- **Contexto**: Bibliotecas nativas de C++ para extração de PDF frequentemente quebram em ambientes serverless da Vercel.
- **Decisão original**: `mammoth` para `.docx` e parser de streams de texto (regex sobre blocos `BT...ET`) para `.pdf`, frágil e sem suporte real a layouts complexos.

### ADR 003: Criação de Página de Vendas Separada com Foco na Dor e Urgência
- **Status**: Aprovado e Implementado
- **Contexto**: O produto precisava de uma via de conversão direta com apelo psicológico forte para vestibulandos que sofrem com o tempo curto até o ENEM e com a lentidão dos cursinhos tradicionais.
- **Decisão**: Criação da rota `/vendas` contendo 12 blocos de persuasão, termômetro interativo de risco, cronômetro regressivo em tempo real, bônus de lançamento e barra flutuante `SalesStickyBar`.

### ADR 004: Centralização da Memória do Projeto no Obsidian (`Vault/`)
- **Status**: Aprovado e Implementado
- **Contexto**: Necessidade de manter toda a documentação, padrões e conhecimento do projeto centralizados para fácil consulta humana e por agentes de IA.
- **Decisão**: Toda nova funcionalidade, alteração e regra deve ser refletida nas notas do diretório `Vault/` com sintaxe Obsidian.

### ADR 005: Nunca Fabricar um Resultado de Correção
- **Status**: Aprovado e Implementado (substitui parte do ADR 001)
- **Contexto**: O motor heurístico offline gerava uma nota "plausível" quando Gemini e OpenAI falhavam — o aluno recebia uma avaliação que não veio de nenhum modelo real, sem saber disso.
- **Decisão**: Removido o fallback heurístico de produção. Se ambos os provedores falham, `corrigirRedacaoComIA` lança erro explícito, propagado como falha visível ao aluno. A função heurística (`gerarCorrecaoMock`) continua existindo só como fixture de teste offline — nunca é chamada pelo caminho de produção.
- **Impacto**: Disponibilidade deixa de ser 100%, mas toda nota exibida é garantidamente de um modelo real.

### ADR 006: Dupla Correção com Reconciliação (protocolo INEP)
- **Status**: Aprovado e Implementado
- **Contexto**: Medição real mostrou variação de até 120 pontos na mesma redação entre duas execuções do mesmo modelo — não-determinismo do LLM, não bug de código.
- **Decisão**: `corrigirRedacaoComDuplaCorrecao` dispara 2 correções independentes em paralelo. Divergência ≤100 pontos → reconcilia por média. >100 → aciona 3ª correção de arbitragem e reconcilia o par mais próximo — mesmo protocolo de dois corretores + árbitro do ENEM real.
- **Impacto**: Custo/latência 2-3x maior por correção; consistência de nota significativamente maior. Ver [[03 - Inteligência Artificial/Arquitetura de IA & Prompts]].

### ADR 007: Extração de PDF via `pdf-parse` + Upgrade de Node
- **Status**: Aprovado e Implementado
- **Contexto**: O parser regex caseiro (ADR 002) não lidava com PDFs de layout real, gerando texto corrompido.
- **Decisão**: Adotado `pdf-parse` (embrulha `pdfjs-dist`), que exige Node ≥20.16/22.3 — o projeto rodava em Node 20.14.0. Runtime atualizado para Node 22.22.3 (`.nvmrc`) e `next.config.ts` recebeu `serverExternalPackages: ["pdf-parse"]` para o worker do pdfjs resolver fora do bundle do Turbopack.
- **Fora de escopo**: OCR de redação manuscrita/fotografada (PDF sem texto selecionável) — retorna erro explícito em vez de tentar extrair.

---

## 📋 Changelog do Projeto

### [v1.2.0] - 2026-09-05
- **Removido**: Fallback heurístico de produção — ver ADR 005.
- **Adicionado**: Dupla correção com reconciliação/arbitragem — ver ADR 006.
- **Adicionado**: Regras de consistência estruturadas (anulação total, teto de C2 monobloco, habilidades booleanas em C1/C3/C4, elementos de C5) em `correcao-schema.ts`.
- **Adicionado**: Log estruturado de observabilidade (`src/lib/observabilidade.ts`) por tentativa e resultado final de correção.
- **Corrigido**: Extração de PDF via `pdf-parse`, Node atualizado para 22.22.3 — ver ADR 007.
- **Corrigido**: `max_tokens` da OpenAI 3000→6000 (evitava truncar JSON de resposta).
- **Melhorado**: IDs via `crypto.randomUUID()` (antes `Math.random()`).
- **Refatorado**: `CorrecaoView.tsx` e `Editor.tsx` decompostos em componentes menores — ver [[04 - Arquitetura Técnica/Componentes & Design System]].
- **Adicionado**: 45 testes automatizados (Vitest) cobrindo schema, reconciliação e casos de regressão reais.
- **Adicionado**: Repositório Git (`jeanrj987/enem-nota-1000`).

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
