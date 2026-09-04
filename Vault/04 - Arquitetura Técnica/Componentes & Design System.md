---
title: Design System & Componentes Reutilizáveis
tags:
  - components
  - design-system
  - ui
  - tailwindcss
  - glassmorphism
updated: 2026-09-01
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

### 3. `CorrecaoView.tsx`
- Painel completo de exibição do resultado da correção:
  - Seletor de abas: *1. Análise Geral & Erros*, *2. Versão Reescrita 1000*, *3. Plano de Ação Pedagógico*.
  - Disparo de confete automático quando $\text{nota} \ge 900$.
  - Exportação de relatório completo em formato PDF via `jspdf`.
  - Cards detalhados de cada uma das 5 competências com barras de progresso proporcionais.

### 4. `Editor.tsx`
- Editor de texto para redação com contadores dinâmicos de palavras, linhas e caracteres.
- Validação mínima para garantir que o texto possui estrutura adequada antes do envio.

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
