---
title: Design System & Componentes Reutilizáveis
tags:
  - components
  - design-system
  - ui
  - tailwindcss
  - tema-dark
updated: 2026-09-17 (reescrita a partir do globals.css real — identidade "V2 dark")
---

# 🎨 Design System & Componentes Reutilizáveis

> [!important] **Identidade única: "V2 dark"**
> Desde 17/09 (ADR 031) o projeto inteiro usa uma só identidade: fundo escuro profundo, **azul como acento principal** e superfícies chapadas com borda sutil. Não há mais tema por rota. As identidades anteriores — "placar" e "caderno & caneta vermelha" — estão registradas no fim desta nota como histórico e preservadas em `design-alternativas/`.

> [!warning] **Dois nomes de classe mentem sobre o que fazem**
> `.glass-panel` e `.glass-card` são herança da fase glassmorphism e **não têm mais `backdrop-filter` nem transparência** — hoje são superfícies sólidas (`--color-folha` / `--color-folha-2`) com borda e cantos arredondados. Os nomes ficaram para não exigir reescrever todo o app. O mesmo vale para `--color-papel`/`--color-tinta`, nomes do tema claro cujos valores hoje são escuros.

---

## 💎 Tokens (`@theme` em `src/app/globals.css`)

Os nomes viram utilitários do Tailwind automaticamente: `bg-papel`, `text-tinta`, `border-regua`, `bg-folha-2`…

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--color-papel` | `#070b14` | Fundo da página |
| `--color-folha` | `#101827` | Superfície elevada: cartões, painéis |
| `--color-folha-2` | `#131e30` | Superfície recuada: campos, faixas |
| `--color-tinta` | `#f8fafc` | Texto principal |
| `--color-tinta-suave` | `#b8c4d6` | Texto secundário |
| `--color-tinta-fraca` | `#94a3b8` | Legendas, metadados |
| `--color-pauta` | `#16233a` | Linha da pauta / divisores sutis |
| `--color-regua` | `#223047` | Bordas |
| `--color-azul` | `#4f8cff` | **Acento principal e CTA** (`--color-azul-claro`: `#16233a`) |
| `--color-vermelho` | `#ff647c` | Erro/alerta — **não é mais cor de marca** (`-escuro` `#d9455e`, `-claro` `#3a1620`) |
| `--color-verde` | `#31d49a` | Acerto, confirmação (`-claro` `#103023`) |
| `--color-ambar` | `#f5c451` | Atenção (`-claro` `#362a10`) |
| `--radius` | `0.875rem` | Cantos arredondados padrão |

**Tipografia** (`next/font` em `layout.tsx`, expostas como classes): `Newsreader` → `.fonte-serifada`; `Karla` → `.fonte-humanista` (**padrão do `<body>`**, inclusive em `h1/h2/h3`).

> [!warning] `Caveat` continua carregada em `layout.tsx` (`--font-caveat` no `<html>`) mas `.fonte-manuscrita`, a única classe que a consumia, foi removida por não ter nenhum uso (ver abaixo) — hoje é uma fonte baixada por todo visitante sem nenhum efeito visual. Decisão de remover o `next/font` do Caveat também, ou achar um uso real para ela, ficou fora do escopo desta limpeza — fica para quem mexer em tipografia de novo.

---

## 🧱 Utilitários CSS (`src/app/globals.css`)

### Em uso
- `.glass-panel` — superfície elevada: `--color-folha`, borda `--color-regua`, `border-radius: var(--radius)`, sombra `0 12px 35px rgba(0,0,0,.25)`.
- `.glass-card` — superfície recuada: `--color-folha-2` + borda, sem sombra.
- `.gradient-text` — `linear-gradient(90deg, #fff, #8eb7ff)` recortado no texto. Usado nos títulos da hero, do `Navbar` e do `Footer`.
- `.fonte-serifada` — hoje só em `/privacidade`.
- Scrollbar customizada (`::-webkit-scrollbar`) na paleta escura.

### Marcação de erros sobre o texto do aluno
Todas compartilham `border-bottom: 2px solid` + fundo translúcido na cor da categoria (14% de opacidade, 28% no `:hover`).

| Classe CSS | Tipo de erro | Cor |
| :--- | :--- | :--- |
| `.highlight-gramatica` | Gramática, ortografia, pontuação | Vermelho `--color-vermelho` |
| `.highlight-coesao` | Conectivos e transições | Âmbar `--color-ambar` |
| `.highlight-vocabulario` | Adequação vocabular | Azul `--color-azul` |
| `.highlight-concordancia` | Concordância e regência | Verde `--color-verde` |
| `.highlight-outro` | Outros desvios de estrutura | Cinza `--color-tinta-fraca` |

---

## 🧩 Biblioteca de Componentes (`src/components/`)

### Casca do app
- **`Navbar.tsx`** — barra sticky responsiva (desktop + drawer mobile). Links: Início (`/`), Dashboard, Nova Redação, Histórico; mais "Entrar"/"Sair" e o CTA "Escrever Redação". **Não tem item de planos/oferta** — removido a pedido do usuário.
- **`Footer.tsx`** — rodapé institucional; "Planos e preços" aponta para `/#planos`.
- ⚠️ A landing `/` **não usa** `Navbar`/`Footer`: tem header e footer próprios (ADR 030).

### Portões de acesso
- **`RequerLogin.tsx`** — exige login + perfil completo, **não** exige assinatura.
- **`RequerAssinatura.tsx`** — exige login + perfil completo + assinatura ativa; sem assinatura, manda para `/`.
- **`CorrecaoBloqueada.tsx`** — o paywall borrado da correção; CTA "Ver planos" → `/#planos`.
- A decisão de cada portão vive em `src/lib/gates.ts`, como função pura testável (ADR 024).

### Correção
- **`CorrecaoView.tsx`** — orquestra abas e banner de nota/anulação/reconciliação. Composto por `src/components/correcao/`: `AbaAnalise.tsx`, `AbaReescrita.tsx`, `AbaPlano.tsx`, `CompetenciaCard.tsx`, `TextoDestacado.tsx`.
- Exportação em PDF fica em `src/lib/pdf-export.ts` (`exportarCorrecaoParaPDF`); confete automático com nota ≥900.

### Editor
- **`Editor.tsx`** — orquestra estado e submissão. Composto por `src/components/editor/`: `SeletorTema.tsx`, `AreaProducaoTextual.tsx` (upload, conectivos, contadores) e `ModalCarregamento.tsx` (a dupla correção leva 20–50s).

### Gráficos
- **`GraficoEvolucao.tsx`** — `Recharts`: linha (evolução da nota 0–1000) e radar (distribuição entre C1–C5).

---

## 🕰️ Identidades anteriores (histórico)

> [!info] Registro para leitura de commits antigos e das notas de decisão. **Nada aqui está em vigor.**

- **"Placar"** (até 07/09, só em `/vendas`) — azul-marinho `#0B1B2B` com acento verde-limão `#C6F24E`, `Anton` + `Barlow`, superfícies chapadas e cantos retos. Preservado em `design-alternativas/vendas-placar.tsx` + `.css`.
- **"Caderno & caneta vermelha"** (07/09 a 17/09, projeto inteiro, ADR 014) — papel `#F7F4ED`, tinta `#1C1917`, vermelho de corretor `#C0392B` como acento, azul de caneta `#29487D`. Preservado em `design-alternativas/vendas-caderno-e-caneta-vermelha.tsx` + `vendas-caderno.css`. Deixou para trás os utilitários órfãos listados acima.
- **Glassmorphism original** (até 07/09) — `rgba` translúcido com `backdrop-filter: blur()` e `gradient-text` azul→roxo→rosa. Sobrou só nos **nomes** `.glass-panel`/`.glass-card`/`.gradient-text`.

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas|Estrutura de Rotas]]
- [[01 - Visão Geral & Negócio/Estratégia de Vendas & Copywriting|Landing de Vendas (`/`)]]
- [[02 - Metodologia ENEM/Competências Detalhadas C1 a C5|Marcações de Erros no Texto]]
- [[06 - Registro de Decisões/Decisões de Arquitetura & Changelog|ADR 031 (tema dark V2), ADR 014 (caderno), ADR 030 (landing única)]]
