---
title: Design System & Componentes Reutilizáveis
tags:
  - components
  - design-system
  - ui
  - tailwindcss
  - cyber-aesthetic
updated: 2026-09-01
---

# 🎨 Design System & Componentes Reutilizáveis

> [!tip] **Identidade Visual Cyberpunk / Tech Lab**
> O visual do **NOTA 1000 PRO** adota a estética de **Cyberpunk / Dark Mode Tecnológico**, grid com linhas sutis (`tech-grid-bg`), efeitos de neon ciano/esmeralda, gradientes vibrantes e micro-animações interativas.

---

## 💎 Tokens de Design & Utilitários CSS (`src/app/globals.css`)

### Classes Principais:
- `.tech-card`: Card com fundo escuro translúcido `#040816/80`, borda ciano e efeito de brilho suave no hover.
- `.cyber-badge`: Badge arredondada com borda neon e fonte monoespaçada.
- `.btn-cyber-primary`: Botão de ação primária em ciano com gradiente e elevação ao passar o mouse.
- `.laser-bar`: Barra de escaneamento animada simulando análise em tempo real.
- `.annot-gramatica`, `.annot-coesao`, `.annot-vocabulario`: Destaques interativos no corpo da redação com popups explicativos.

---

## 🧩 Biblioteca de Componentes (`src/components/`)

### 1. `Editor.tsx` (Estúdio de Redação Oficial)
- **Modo Folha Pautada (30 Linhas)**: Simulação visual exata da folha oficial de redação do ENEM com 30 linhas numeradas de 1 a 30 e alertas visuais de estouro de limite.
- **Detector de Repetições em Tempo Real (C4)**: Escaneamento dinâmico que detecta palavras repetidas $>3$ vezes (ex: *"sociedade"*, *"problema"*, *"importante"*) e exibe botões rápidos de substituição por sinônimos cultos.
- **Auto-Save de Rascunhos**: Salvamento contínuo em `localStorage` com exibição de carimbo de hora (*"✓ Rascunho salvo às HH:MM"*).
- **Modo Zen (Tela Cheia)**: Isolamento do editor via `createPortal` anexado ao `document.body` com botão de saída rápido.

### 2. `SimuladorSisu.tsx` (Simulador de Aprovação SISU / Medicina)
- Comparador interativo de notas com a matriz real de corte das principais faculdades brasileiras:
  - Medicina USP / UFRJ (Corte 810+)
  - Direito UFMG (Corte 775+)
  - Ciência da Computação USP (Corte 795+)
  - Psicologia UFPE (Corte 740+)
- Cálculo em tempo real de margem competitiva e peso da nota de redação.

### 3. `CheckoutModal.tsx` (Checkout PIX Dinâmico)
- Modal de altíssima conversão:
  - Geração de QR Code PIX dinâmico com chave "PIX Copia e Cola".
  - Contador regressivo de 15 minutos.
  - Botão de simulação de confirmação bancária com efeito de confetes e liberação instantânea no servidor.
  - Opção secundária para Cartão de Crédito.

### 4. `BannerUrgencia.tsx` (Contagem Regressiva ENEM 2026)
- Barra no topo de todas as telas calculando dias, horas, minutos e segundos restantes para a aplicação oficial do ENEM 2026.

### 5. `ProvaSocialToast.tsx` (Notificações em Tempo Real)
- Toasts flutuantes discretos no canto inferior informando atividades recentes de outros alunos (ex: *"Lucas M. acabou de desbloquear o Laudo Nota 1000 em Medicina!"*).

### 6. `Navbar.tsx`
- Cabeçalho responsivo com contador de streak de estudos (`🔥 {streak} treinos`), botão de alternância rápida de plano (Modo PRO 100% vs Demonstração) e navegação compacta sem overflow.

### 7. `CorrecaoView.tsx`
- Painel anatômico de correção:
  - Notas C1 a C5 com barras de progresso.
  - Simulador SISU acoplado diretamente ao laudo.
  - Marcações interativas no texto com popover de correção.
  - Versão reescrita Nota 1000.
  - Botão de exportação em PDF oficial.

---

## 🔗 Links Relacionados
- [[04 - Arquitetura Técnica/Stack & Estrutura de Rotas|Estrutura de Rotas]]
- [[04 - Arquitetura Técnica/Segurança & Blindagem Server-Side|Segurança & Blindagem Server-Side]]
- [[02 - Metodologia ENEM/Competências Detalhadas C1 a C5|Marcações de Erros no Texto]]
