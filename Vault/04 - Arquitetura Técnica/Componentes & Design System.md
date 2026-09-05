---
title: Design System & Componentes Reutilizáveis
tags:
  - components
  - design-system
  - ui
  - tailwindcss
  - glassmorphism
updated: 2026-09-05
---

# 🎨 Design System & Componentes Reutilizáveis

> [!tip] **Identidade Visual Premium**
> O visual do **Nota 1000 AI** adota a estética de **Dark Mode Moderno**, **Glassmorphism** com desfoque de fundo (`backdrop-blur`), gradientes refinados (azul royal, índigo, púrpura e esmeralda) e micro-animações responsivas.

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
- Destaque especial pulsante para o link **"⚡ Planos & Oferta"** (`/vendas`).

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

### 6. `SalesStickyBar.tsx`
- Barra flutuante de rodapé que aparece após scroll na página `/vendas`, contendo cronômetro regressivo, indicação do Lote Promocional e botão de rolagem suave para compra.

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas|Estrutura de Rotas]]
- [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting|Página de Vendas /vendas]]
- [[02 - Metodologia ENEM/Competências Detalhadas C1 a C5|Marcações de Erros no Texto]]
