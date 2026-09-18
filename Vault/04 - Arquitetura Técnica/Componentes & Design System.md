---
title: Design System & Componentes Reutilizáveis
tags:
  - components
  - design-system
  - ui
  - tailwindcss
  - glassmorphism
updated: 2026-09-05 (identidade "placar" na página de vendas)
---

# 🎨 Design System & Componentes Reutilizáveis

> [!warning] **Duas identidades convivem hoje**
> A área logada ainda usa a estética original (dark mode com glassmorphism e gradientes). A rota `/vendas` foi redesenhada com a identidade **"placar"** (ver abaixo) porque a antiga tinha "cara de IA" — o kit padrão de gradiente azul→roxo, glass, orbes desfocados e cards idênticos com ícone colorido. A propagação da nova identidade para o resto do sistema está pendente.

---

## 🏆 Identidade "Placar" (`/vendas`)

Escolhida entre quatro direções propostas, com foco em conversão para o público de 16 a 19 anos: **a nota é o herói da página**. O topo é um placar `540 → 920`, e as cinco competências viram um painel de estatísticas com barras — transforma "melhore sua redação" em algo mensurável.

**Paleta** (`.tema-placar` em `globals.css`): fundo `#0B1B2B` (azul-marinho, não o preto-azulado genérico), superfícies `#0F2438`/`#16304A`, linhas `#23415E`, texto `#F2F7FB`, texto suave `#93A8BC`, cinza "antes" `#4A6178` e **um único acento**: verde-limão `#C6F24E`, reservado ao estado "depois"/vitória e aos CTAs.

**Tipografia**: `Anton` (`.fonte-placar`) só nas notas e títulos — condensada pesada, lê como placar esportivo; `Barlow` (`.fonte-ui`) no restante da interface.

**Regras da identidade**: superfícies chapadas, cantos retos, zero gradiente, zero `backdrop-blur`, zero orbe desfocado. Números sempre com `tabular-nums`.

> [!tip] **Honestidade na copy visual**
> O placar `540 → 920` e as barras de competência levam uma nota explícita de que são **faixas ilustrativas** de como o sistema pontua, não o resultado de um aluno real. Sem isso seria um depoimento fabricado — mesmo problema do cronômetro falso removido na v1.4.0 (ver ADR 005 e o changelog).

### Direção alternativa preservada
A direção **"caderno & caneta vermelha"** (fundo de papel `#F7F4ED`, serifada `Newsreader`, correções em vermelho de corretor, anotações manuscritas em `Caveat`) foi construída e descartada nesta rodada, aguardando avaliação de sócio. Os utilitários `.tema-papel`, `.margem-caderno`, `.bloco-pautado`, `.risco-corretor` e `.carimbo` continuam em `globals.css` para essa retomada.

---

## 💎 Tokens de Design & Utilitários CSS (`src/app/globals.css`)

### Classes de Glassmorphism:
- `.glass-panel`: Fundo translúcido `rgba(15, 23, 42, 0.75)` com `backdrop-filter: blur(12px)` e borda sutil `rgba(255, 255, 255, 0.08)`.
- `.glass-card`: Fundo `rgba(30, 41, 59, 0.6)` para cards internos.
- `.gradient-text`: Gradiente de texto `linear-gradient(135deg, #60a5fa 0%, #a855f7 50%, #ec4899 100%)`.

### Classes de Destaque Visual de Erros na Redação:
| Classe CSS | Tipo de Erro | Cor Visual / Sublinhado |
| :--- | :--- | :--- |
| `.highlight-gramatica` | Gramática, ortografia, pontuação | Vermelho translúcido com borda inferior vermelha `#ef4444` |
| `.highlight-coesao` | Conectivos e transições | Âmbar translúcido `#f59e0b` |
| `.highlight-vocabulario`| Adequação vocabular | Azul `#3b82f6` |
| `.highlight-concordancia`| Concordância e regência | Roxo `#a855f7` |
| `.highlight-outro` | Outros desvios de estrutura | Verde-azulado `#14b8a6` |

---

## 🧩 Biblioteca de Componentes (`src/components/`)

### 1. `Navbar.tsx`
- Barra de navegação superior responsiva (Desktop e Mobile Drawer) com efeito sticky e vidro fosco.
- Links: Início (`/`), Dashboard, Nova Redação e Histórico, mais "Entrar"/"Sair" e o CTA "Escrever Redação". **Não tem item de planos/oferta** — foi removido a pedido do usuário. Desde o ADR 030, "Início" leva à landing de vendas, que é a home; por isso a própria landing tem um link "Minha conta" de volta ao app.

### 2. `Footer.tsx`
- Rodapé institucional com colunas para Competências do ENEM, Recursos da Plataforma e links de acesso direto.

### 3. `CorrecaoView.tsx` (235 linhas, era 567)
- Orquestra abas e banner de nota/anulação/reconciliação; composto por `src/components/correcao/`:
  - `AbaAnalise.tsx`, `AbaReescrita.tsx`, `AbaPlano.tsx` — as 3 abas (Análise & Erros / Reescrita 1000 / Plano Pedagógico).
  - `CompetenciaCard.tsx`, `TextoDestacado.tsx` — cards de competência e marcação de erros no texto.
- Exportação em PDF extraída para `src/lib/pdf-export.ts` (`exportarCorrecaoParaPDF`).
- Disparo de confete automático quando nota ≥900.

### 4. `Editor.tsx` (239 linhas, era 468)
- Orquestra estado e submissão; composto por `src/components/editor/`:
  - `SeletorTema.tsx` — seleção de tema oficial/customizado + título.
  - `AreaProducaoTextual.tsx` — upload, conectivos rápidos, textarea, contadores.
  - `ModalCarregamento.tsx` — overlay de progresso durante a correção (dupla correção pode levar 20-50s).

### 5. `GraficoEvolucao.tsx`
- Componente baseado em `Recharts`:
  - Gráfico de Linha (Evolução cronológica da nota de 0 a 1000).
  - Gráfico de Radar (Distribuição dos pontos entre as competências C1, C2, C3, C4 e C5).

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas|Estrutura de Rotas]]
- [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting|Landing de Vendas (`/`)]]
- [[02 - Metodologia ENEM/Competências Detalhadas C1 a C5|Marcações de Erros no Texto]]
