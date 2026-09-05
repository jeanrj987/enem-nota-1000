---
title: Auditoria de Viés do Corretor
tags:
  - qualidade
  - vies
  - auditoria
  - ia
updated: 2026-09-05
---

# ⚖️ Auditoria de Viés do Corretor

> [!warning] **Status: metodologia e corpus prontos, execução pendente de cota de API**
> A cota gratuita do Gemini (20 req/dia) estava esgotada no momento em que isso foi preparado, e não há chave OpenAI configurada. Rodar com `npm run auditoria:vies` assim que houver uma chave funcional, e colar os resultados reais nesta nota — nunca preencher esta seção com um resultado hipotético.

---

## Pergunta que a auditoria responde

O corretor penaliza (ou premia) sistematicamente um texto por características que **não deveriam** afetar a nota pela matriz oficial do INEP? Duas hipóteses concretas:

1. **Regionalismo lexical**: um texto com vocabulário regional legítimo e dicionarizado (ex: "sertão", "vaqueiro", "caatinga") recebe nota mais baixa que um texto de conteúdo/qualidade equivalente com vocabulário neutro — mesmo sem nenhum erro de norma culta em nenhum dos dois lados?
2. **Repertório de fachada**: um texto que cita nomes famosos (Foucault, Bourdieu, Kant) de forma superficial, sem integrar a citação ao argumento, recebe nota de C2 mais alta que um texto igualmente bem argumentado mas que usa dados/raciocínio concreto sem apelo a autoridade?

Isso **não é** sobre se o corretor deveria aceitar desvio gramatical regional — a matriz do ENEM exige norma culta de qualquer região, e isso está correto. É sobre se o modelo confunde "vocabulário regional correto" com "erro", ou infla nota por citação de nome vazio.

## Corpus (`src/lib/auditoria/casos.ts`)

2 pares de redações (4 textos), cada par mantém **idênticos**: número de parágrafos, tamanho aproximado, ausência de erros gramaticais, presença dos 5 elementos de C5 — só a dimensão testada varia:

| Par | Dimensão | Variantes |
| :--- | :--- | :--- |
| `regionalismo_1` | Vocabulário regional | `neutro` vs `regional` (mesmo argumento sobre êxodo rural) |
| `repertorio_2` | Citação vazia vs. dado concreto | `fachada` (Foucault/Bourdieu/Kant descontextualizados) vs `genuino` (dados do SNIS, sem citação) |

## Como interpretar o resultado

`scripts/auditoria-vies.ts` roda cada variante do par com `corrigirRedacaoComIA` (correção única, não a dupla de produção, para gastar metade da cota) e compara `nota_geral` e nota por competência entre as duas variantes do mesmo par.

- Diferença **dentro de ~40 pontos** (1 nível de competência): dentro do ruído normal do modelo — não é evidência de viés isolada.
- Diferença **sistemática e na mesma direção** ao rodar o par mais de uma vez: evidência de viés real, e exige reforço no `prompt-agente.ts` (ex: instrução explícita para não pontuar repertório citado sem integração argumentativa) — mesmo padrão de "estruturado + trava" já usado para anulação/monobloco/C5 em [[03 - Inteligência Artificial/Arquitetura de IA & Prompts]].

## Resultados

_(preencher após rodar `npm run auditoria:vies` com uma chave de API funcional)_

## 🔗 Links Relacionados
- [[03 - Inteligência Artificial/Arquitetura de IA & Prompts|Arquitetura de IA & Prompts]]
- [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog|Changelog]]
